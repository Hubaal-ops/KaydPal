const mongoose = require('mongoose');
const connectDB = require('../db');
const Purchase = require('../models/Purchase');
const StoreProduct = require('../models/StoreProduct');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Store = require('../models/Store');
const Account = require('../models/Account');
const recalculateProductBalance = require('./storeProductController').recalculateProductBalance;
const recalculateStoreTotal = require('./storeProductController').recalculateStoreTotal;
const getNextSequence = require('../getNextSequence');

// Helper function to calculate totals from items
function calculateTotals(items) {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  
  items.forEach(item => {
    const qty = Number(item.qty);
    const price = Number(item.price);
    const discount = Number(item.discount || 0);
    const tax = Number(item.tax || 0);
    
    const itemSubtotal = (qty * price) - discount + tax;
    item.subtotal = itemSubtotal;
    
    subtotal += qty * price;
    totalDiscount += discount;
    totalTax += tax;
  });
  
  const totalAmount = subtotal - totalDiscount + totalTax;
  
  return {
    subtotal,
    totalDiscount,
    totalTax,
    totalAmount
  };
}

// Helper function to apply purchase effects (inventory and financial)
async function applyPurchaseEffects(purchase, session, userId) {
  console.log(`[DEBUG] Applying effects for purchase ${purchase.purchase_no}`);
  
  // Update inventory for each item
  for (const item of purchase.items) {
    console.log(`[DEBUG] Applying inventory for product ${item.product_no}, qty: ${item.qty}`);
    
    // Update or create store product
    let storeProduct = await StoreProduct.findOne({ 
      product_no: item.product_no, 
      store_no: purchase.store_no, 
      userId 
    }, null, session ? { session } : {});
    
    if (storeProduct) {
      storeProduct.qty += item.qty;
      storeProduct.updated_at = new Date();
      await storeProduct.save(session ? { session } : {});
    } else {
      const store_product_no = await getNextSequence('store_product_no');
      if (session) {
        await StoreProduct.create([{
          store_product_no,
          product_no: item.product_no,
          store_no: purchase.store_no,
          qty: item.qty,
          userId,
          created_at: new Date(),
          updated_at: new Date()
        }], { session });
      } else {
        await StoreProduct.create({
          store_product_no,
          product_no: item.product_no,
          store_no: purchase.store_no,
          qty: item.qty,
          userId,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    // Note: Product.storing_balance will be updated by recalculateProductBalance outside transaction
  }
  
  // Update store total items
  const totalQty = purchase.items.reduce((sum, item) => sum + item.qty, 0);
  console.log(`[DEBUG] Applying store total items: ${totalQty}`);
  await Store.updateOne(
    { store_no: purchase.store_no, userId },
    { $inc: { total_items: totalQty } },
    session ? { session } : {}
  );
  
  // Update supplier balance (debt if not fully paid)
  const debt = purchase.amount - purchase.paid;
  console.log(`[DEBUG] Applying supplier balance: ${debt} (amount: ${purchase.amount}, paid: ${purchase.paid})`);
  if (debt > 0) {
    await Supplier.updateOne(
      { supplier_no: purchase.supplier_no, userId },
      { $inc: { balance: debt } },
      session ? { session } : {}
    );
  }
  
  // Update account balance
  console.log(`[DEBUG] Applying account balance: ${purchase.paid}`);
  if (purchase.paid > 0) {
    await Account.updateOne(
      { account_id: purchase.account_id, userId },
      { $inc: { balance: -purchase.paid } },
      session ? { session } : {}
    );
  }
  
  console.log(`[DEBUG] Finished applying effects for purchase ${purchase.purchase_no}`);
}

// Helper function to reverse purchase effects (inventory and financial)
async function reversePurchaseEffects(purchase, session, userId) {
  console.log(`[DEBUG] Reversing effects for purchase ${purchase.purchase_no}`);
  
  try {
    // Reverse inventory for each item
    for (const item of purchase.items) {
      console.log(`[DEBUG] Reversing inventory for product ${item.product_no}, qty: ${item.qty}`);
      
      // Update store product
      const storeProductResult = await StoreProduct.updateOne(
        { product_no: item.product_no, store_no: purchase.store_no, userId },
        { $inc: { qty: -item.qty }, $set: { updated_at: new Date() } },
        session ? { session } : {}
      );
      console.log(`[DEBUG] Store product update result:`, storeProductResult);
      
      // Note: Product.storing_balance will be updated by recalculateProductBalance outside transaction
    }
    
    // Update store total items
    const totalQty = purchase.items.reduce((sum, item) => sum + item.qty, 0);
    console.log(`[DEBUG] Reversing store total items: ${totalQty}`);
    const storeResult = await Store.updateOne(
      { store_no: purchase.store_no, userId },
      { $inc: { total_items: -totalQty } },
      session ? { session } : {}
    );
    console.log(`[DEBUG] Store total update result:`, storeResult);
    
    // Reverse supplier balance - use calculated debt from amount - paid
    const debt = purchase.amount - purchase.paid;
    console.log(`[DEBUG] Reversing supplier balance: ${debt} (amount: ${purchase.amount}, paid: ${purchase.paid})`);
    if (debt > 0) {
      const supplierResult = await Supplier.updateOne(
        { supplier_no: purchase.supplier_no, userId },
        { $inc: { balance: -debt } },
        session ? { session } : {}
      );
      console.log(`[DEBUG] Supplier balance update result:`, supplierResult);
    }
    
    // Reverse account balance
    console.log(`[DEBUG] Reversing account balance: ${purchase.paid}`);
    if (purchase.paid > 0) {
      const accountResult = await Account.updateOne(
        { account_id: purchase.account_id, userId },
        { $inc: { balance: purchase.paid } },
        session ? { session } : {}
      );
      console.log(`[DEBUG] Account balance update result:`, accountResult);
    }
    
    console.log(`[DEBUG] Finished reversing effects for purchase ${purchase.purchase_no}`);
  } catch (error) {
    console.error(`[ERROR] Failed to reverse effects for purchase ${purchase.purchase_no}:`, error);
    throw error;
  }
}

// Create Purchase Order
async function insertPurchase(purchaseData, userId) {
  // Check if MongoDB supports transactions (replica set required)
  const isReplicaSet = mongoose.connection.db.topology?.type === 'ReplicaSetWithPrimary' || 
                      mongoose.connection.db.topology?.constructor?.name === 'ReplSet';
  
  let session = null;
  if (isReplicaSet) {
    session = await mongoose.startSession();
    await session.startTransaction();
  }
  
  try {
    
    // Validate input data
    if (!purchaseData.items || !Array.isArray(purchaseData.items) || purchaseData.items.length === 0) {
      throw new Error('At least one item is required for a purchase order');
    }
    
    // Convert numeric fields
    const supplier_no = Number(purchaseData.supplier_no);
    const store_no = Number(purchaseData.store_no);
    const account_id = Number(purchaseData.account_id);
    const paid = Number(purchaseData.paid || 0);
    
    // Validate and process items
    const processedItems = purchaseData.items.map(item => {
      const product_no = Number(item.product_no);
      const qty = Number(item.qty);
      const price = Number(item.price);
      const discount = Number(item.discount || 0);
      const tax = Number(item.tax || 0);
      
      if (qty <= 0 || price < 0) {
        throw new Error(`Invalid quantity or price for product ${product_no}`);
      }
      
      return {
        product_no,
        qty,
        price,
        discount,
        tax,
        subtotal: (qty * price) - discount + tax
      };
    });
    
    // Calculate totals
    const totals = calculateTotals(processedItems);
    
    if (paid > totals.totalAmount) {
      throw new Error('Paid amount cannot exceed total amount');
    }
    
    // Check account balance
    const account = await Account.findOne({ account_id, userId }, null, session ? { session } : {});
    if (!account) {
      throw new Error('Account not found');
    }
    
    if (paid > 0 && account.balance < paid) {
      throw new Error('Insufficient account balance for this purchase');
    }
    
    // Get supplier name for denormalization
    const supplier = await Supplier.findOne({ supplier_no, userId }, null, session ? { session } : {});
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    
    // Generate purchase identifiers
    const purchase_id = await getNextSequence('purchase_id');
    const sequence = await getNextSequence('purchase_no');
    const purchase_no = `PUR-${String(sequence).padStart(5, '0')}`;
    
    // Create purchase order
    const newPurchase = new Purchase({
      purchase_id,
      purchase_no,
      supplier_no,
      supplier_name: supplier.name,
      store_no,
      items: processedItems,
      subtotal: totals.subtotal,
      total_discount: totals.totalDiscount,
      total_tax: totals.totalTax,
      amount: totals.totalAmount,
      paid,
      balance_due: totals.totalAmount - paid,
      account_id,
      status: 'pending',
      notes: purchaseData.notes || '',
      userId
    });
    
    // Save purchase order first
    const savedPurchase = await newPurchase.save(session ? { session } : {});
    
    // Only apply inventory and financial effects if status is approved or received
    const shouldApplyEffects = ['approved', 'received'].includes(newPurchase.status);
    
    if (shouldApplyEffects) {
      // Update inventory for each item
      for (const item of processedItems) {
        // Update or create store product
        let storeProduct = await StoreProduct.findOne({ 
          product_no: item.product_no, 
          store_no, 
          userId 
        }, null, session ? { session } : {});
        
        if (storeProduct) {
          storeProduct.qty += item.qty;
          storeProduct.updated_at = new Date();
          await storeProduct.save(session ? { session } : {});
        } else {
          const store_product_no = await getNextSequence('store_product_no');
          if (session) {
            await StoreProduct.create([{
              store_product_no,
              product_no: item.product_no,
              store_no,
              qty: item.qty,
              userId,
              created_at: new Date(),
              updated_at: new Date()
            }], { session });
          } else {
            await StoreProduct.create({
              store_product_no,
              product_no: item.product_no,
              store_no,
              qty: item.qty,
              userId,
              created_at: new Date(),
              updated_at: new Date()
            });
          }
        }
        
        // Note: Product.storing_balance will be updated by recalculateProductBalance outside transaction
      }
      
      // Update store total items
      const totalQty = processedItems.reduce((sum, item) => sum + item.qty, 0);
      await Store.updateOne(
        { store_no, userId },
        { $inc: { total_items: totalQty } },
        session ? { session } : {}
      );
      
      // Update supplier balance (debt if not fully paid)
      const debt = totals.totalAmount - paid;
      if (debt > 0) {
        await Supplier.updateOne(
          { supplier_no, userId },
          { $inc: { balance: debt } },
          session ? { session } : {}
        );
      }
      
      // Update account balance
      if (paid > 0) {
        await Account.updateOne(
          { account_id, userId },
          { $inc: { balance: -paid } },
          session ? { session } : {}
        );
      }
    }
    
    // Commit transaction if using one
    if (session) {
      await session.commitTransaction();
    }
    
    // Recalculate balances outside transaction only if effects were applied
    if (shouldApplyEffects) {
      for (const item of processedItems) {
        await recalculateProductBalance(item.product_no);
      }
      await recalculateStoreTotal(store_no);
    }
    
    return {
      message: 'Purchase order created successfully',
      purchase_no,
      purchase_id
    };
    
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

// Get All Purchases
async function getAllPurchases(userId) {
  try {
    const purchases = await Purchase.find({ userId })
      .sort({ created_at: -1 })
      .lean();
    
    // Get related data for display
    const supplierNos = [...new Set(purchases.map(p => p.supplier_no))];
    const storeNos = [...new Set(purchases.map(p => p.store_no))];
    const accountIds = [...new Set(purchases.map(p => p.account_id))];
    
    const [suppliers, stores, accounts] = await Promise.all([
      Supplier.find({ supplier_no: { $in: supplierNos }, userId }).lean(),
      Store.find({ store_no: { $in: storeNos }, userId }).lean(),
      Account.find({ account_id: { $in: accountIds }, userId }).lean()
    ]);
    
    // Create lookup maps
    const supplierMap = Object.fromEntries(suppliers.map(s => [s.supplier_no, s.name]));
    const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));
    const accountMap = Object.fromEntries(accounts.map(a => [a.account_id, a.name || a.account_name]));
    
    // Enhance purchases with related names
    return purchases.map(purchase => ({
      ...purchase,
      supplier_name: supplierMap[purchase.supplier_no] || purchase.supplier_name || '',
      store_name: storeMap[purchase.store_no] || '',
      account_name: accountMap[purchase.account_id] || ''
    }));
    
  } catch (error) {
    throw new Error(`Failed to fetch purchases: ${error.message}`);
  }
}

// Update Purchase Order
async function updatePurchase(purchase_no, updateData, userId) {
  // Check if MongoDB supports transactions (replica set required)
  const isReplicaSet = mongoose.connection.db.topology?.type === 'ReplicaSetWithPrimary' || 
                      mongoose.connection.db.topology?.constructor?.name === 'ReplSet';
  
  let session = null;
  if (isReplicaSet) {
    session = await mongoose.startSession();
    await session.startTransaction();
  }
  
  try {
    console.log(`[DEBUG] Updating purchase ${purchase_no} for user ${userId}`);
    console.log(`[DEBUG] Update data:`, JSON.stringify(updateData, null, 2));
    
    const existingPurchase = await Purchase.findOne({ purchase_no, userId }, null, session ? { session } : {});
    if (!existingPurchase) {
      console.log(`[DEBUG] Purchase not found: ${purchase_no}, userId: ${userId}`);
      // Let's also check if the purchase exists without userId filter for debugging
      const purchaseWithoutUser = await Purchase.findOne({ purchase_no });
      if (purchaseWithoutUser) {
        console.log(`[DEBUG] Purchase exists but belongs to different user: ${purchaseWithoutUser.userId}`);
      } else {
        console.log(`[DEBUG] Purchase ${purchase_no} does not exist in database at all`);
        // Let's see what purchases exist for this user
        const userPurchases = await Purchase.find({ userId }).select('purchase_no supplier_no');
        console.log(`[DEBUG] User has ${userPurchases.length} purchases:`, userPurchases.map(p => p.purchase_no));
      }
      throw new Error('Purchase order not found');
    }
    
    console.log(`[DEBUG] Found purchase: ${existingPurchase.purchase_no}, status: ${existingPurchase.status}`);
    
    // For now, we'll handle simple updates (status, notes, payment)
    // Full item updates would require more complex logic
    const allowedUpdates = ['status', 'notes', 'paid'];
    const updates = {};
    
    console.log(`[DEBUG] Processing update keys:`, Object.keys(updateData));
    
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = updateData[key];
        console.log(`[DEBUG] Added update: ${key} = ${updateData[key]}`);
      } else {
        console.log(`[DEBUG] Skipped non-allowed update: ${key}`);
      }
    });
    
    console.log(`[DEBUG] Final updates object:`, updates);
    
    // Handle status changes and their effects
    const oldStatus = existingPurchase.status;
    const newStatus = updates.status;
    
    console.log(`[DEBUG] Status change: ${oldStatus} → ${newStatus}`);
    
    // Define which statuses should have effects applied
    const statusesWithEffects = ['approved', 'received'];
    const oldHadEffects = statusesWithEffects.includes(oldStatus);
    const newWillHaveEffects = newStatus ? statusesWithEffects.includes(newStatus) : oldHadEffects;
    
    console.log(`[DEBUG] Old had effects: ${oldHadEffects}, New will have effects: ${newWillHaveEffects}`);
    
    // Apply or reverse inventory and financial effects based on status change
    if (!oldHadEffects && newWillHaveEffects) {
      // Status changed from pending to approved/received - apply effects
      console.log(`[DEBUG] Applying effects due to status change`);
      await applyPurchaseEffects(existingPurchase, session, userId);
    } else if (oldHadEffects && !newWillHaveEffects) {
      // Status changed from approved/received to pending/cancelled - reverse effects
      console.log(`[DEBUG] Reversing effects due to status change`);
      await reversePurchaseEffects(existingPurchase, session, userId);
    } else {
      console.log(`[DEBUG] No effect changes needed for this status transition`);
    }
    
    if (updates.paid !== undefined) {
      const newPaid = Number(updates.paid);
      if (newPaid > existingPurchase.amount) {
        throw new Error('Paid amount cannot exceed total amount');
      }
      
      const paidDifference = newPaid - existingPurchase.paid;
      
      // Only update balances if the purchase order has effects applied (approved/received)
      if (paidDifference !== 0 && statusesWithEffects.includes(existingPurchase.status)) {
        // Update account balance
        await Account.updateOne(
          { account_id: existingPurchase.account_id, userId },
          { $inc: { balance: -paidDifference } },
          session ? { session } : {}
        );
        
        // Update supplier balance
        await Supplier.updateOne(
          { supplier_no: existingPurchase.supplier_no, userId },
          { $inc: { balance: -paidDifference } },
          session ? { session } : {}
        );
      }
      
      updates.balance_due = existingPurchase.amount - newPaid;
    }
    
    updates.updated_at = new Date();
    
    await Purchase.updateOne(
      { purchase_no, userId },
      { $set: updates },
      session ? { session } : {}
    );
    
    // Verify the update actually happened
    const updatedPurchase = await Purchase.findOne({ purchase_no, userId });
    console.log(`[DEBUG] Purchase after update - Status: ${updatedPurchase.status}, Paid: ${updatedPurchase.paid}`);
    
    // Commit transaction if using one
    if (session) {
      await session.commitTransaction();
    }
    
    // Recalculate balances outside transaction if effects were applied or reversed
    if ((!oldHadEffects && newWillHaveEffects) || (oldHadEffects && !newWillHaveEffects)) {
      console.log(`[DEBUG] Recalculating balances after status change`);
      for (const item of existingPurchase.items) {
        await recalculateProductBalance(item.product_no);
      }
      await recalculateStoreTotal(existingPurchase.store_no);
    }
    
    return { message: 'Purchase order updated successfully' };
    
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

// Delete Purchase Order
async function deletePurchase(purchase_no, userId) {
  // Check if MongoDB supports transactions (replica set required)
  const isReplicaSet = mongoose.connection.db.topology?.type === 'ReplicaSetWithPrimary' || 
                      mongoose.connection.db.topology?.constructor?.name === 'ReplSet';
  
  let session = null;
  if (isReplicaSet) {
    session = await mongoose.startSession();
    await session.startTransaction();
  }
  
  try {
    
    const existingPurchase = await Purchase.findOne({ purchase_no, userId }, null, session ? { session } : {});
    if (!existingPurchase) {
      throw new Error('Purchase order not found');
    }
    
    // Only reverse effects if the purchase had effects applied (approved/received status)
    const statusesWithEffects = ['approved', 'received'];
    const hadEffects = statusesWithEffects.includes(existingPurchase.status);
    
    console.log(`[DEBUG] Deleting purchase ${purchase_no}, status: ${existingPurchase.status}, had effects: ${hadEffects}`);
    
    if (hadEffects) {
      // Reverse inventory and financial effects
      console.log(`[DEBUG] Reversing effects before deletion`);
      await reversePurchaseEffects(existingPurchase, session, userId);
    } else {
      console.log(`[DEBUG] No effects to reverse for pending purchase`);
    }
    
    // Delete the purchase order
    await Purchase.deleteOne({ purchase_no, userId }, session ? { session } : {});
    
    // Commit transaction if using one
    if (session) {
      await session.commitTransaction();
    }
    
    // Recalculate balances outside transaction only if effects were reversed
    if (hadEffects) {
      for (const item of existingPurchase.items) {
        await recalculateProductBalance(item.product_no);
      }
      await recalculateStoreTotal(existingPurchase.store_no);
    }
    
    return { message: 'Purchase order deleted successfully' };
    
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

module.exports = {
  insertPurchase,
  getAllPurchases,
  updatePurchase,
  deletePurchase
};
