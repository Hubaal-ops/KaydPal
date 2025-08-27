const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const StoreProduct = require('../models/StoreProduct');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Customer = require('../models/Customer');
const Account = require('../models/Account');
const { recalculateProductBalance, recalculateStoreTotal } = require('./storeProductController');
const Invoice = require('../models/Invoice');
const getNextSequence = require('../getNextSequence');
const connectDB = require('../db');

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

// Helper function to apply sale effects (inventory and financial)
async function applySaleEffects(sale, session, userId) {
  console.log(`[DEBUG] Applying effects for sale ${sale.sale_no}`);
  
  // Update inventory for each item (decrease stock)
  for (const item of sale.items) {
    console.log(`[DEBUG] Applying inventory for product ${item.product_no}, qty: -${item.qty}`);
    
    // Decrease store product quantity
    const storeProductResult = await StoreProduct.updateOne(
      { product_no: item.product_no, store_no: sale.store_no, userId },
      { $inc: { qty: -item.qty }, $set: { updated_at: new Date() } },
      session ? { session } : {}
    );
    
    if (storeProductResult.matchedCount === 0) {
      throw new Error(`Store product not found for product ${item.product_no} in store ${sale.store_no}`);
    }
    
    // Note: Product.storing_balance will be updated by recalculateProductBalance outside transaction
  }
  
  // Update store total items (decrease)
  const totalQty = sale.items.reduce((sum, item) => sum + item.qty, 0);
  console.log(`[DEBUG] Applying store total items: -${totalQty}`);
  await Store.updateOne(
    { store_no: sale.store_no, userId },
    { $inc: { total_items: -totalQty } },
    session ? { session } : {}
  );
  
  // Update customer balance (debt if not fully paid)
  const debt = sale.amount - sale.paid;
  console.log(`[DEBUG] Applying customer balance: ${debt} (amount: ${sale.amount}, paid: ${sale.paid})`);
  if (debt > 0) {
    await Customer.updateOne(
      { customer_no: sale.customer_no, userId },
      { $inc: { bal: debt } },
      session ? { session } : {}
    );
  }
  
  // Update account balance (increase)
  console.log(`[DEBUG] Applying account balance: ${sale.paid}`);
  if (sale.paid > 0) {
    await Account.updateOne(
      { account_id: sale.account_id, userId },
      { $inc: { balance: sale.paid } },
      session ? { session } : {}
    );
  }
  
  console.log(`[DEBUG] Finished applying effects for sale ${sale.sale_no}`);
}

// Helper function to reverse sale effects (inventory and financial)
async function reverseSaleEffects(sale, session, userId) {
  console.log(`[DEBUG] Reversing effects for sale ${sale.sale_no}`);
  
  try {
    // Reverse inventory for each item (increase stock)
    for (const item of sale.items) {
      console.log(`[DEBUG] Reversing inventory for product ${item.product_no}, qty: +${item.qty}`);
      
      // Increase store product quantity
      const storeProductResult = await StoreProduct.updateOne(
        { product_no: item.product_no, store_no: sale.store_no, userId },
        { $inc: { qty: item.qty }, $set: { updated_at: new Date() } },
        session ? { session } : {}
      );
      console.log(`[DEBUG] Store product update result:`, storeProductResult);
      
      // Note: Product.storing_balance will be updated by recalculateProductBalance outside transaction
    }
    
    // Update store total items (increase)
    const totalQty = sale.items.reduce((sum, item) => sum + item.qty, 0);
    console.log(`[DEBUG] Reversing store total items: +${totalQty}`);
    const storeResult = await Store.updateOne(
      { store_no: sale.store_no, userId },
      { $inc: { total_items: totalQty } },
      session ? { session } : {}
    );
    console.log(`[DEBUG] Store total update result:`, storeResult);
    
    // Reverse customer balance - use calculated debt from amount - paid
    const debt = sale.amount - sale.paid;
    console.log(`[DEBUG] Reversing customer balance: -${debt} (amount: ${sale.amount}, paid: ${sale.paid})`);
    if (debt > 0) {
      const customerResult = await Customer.updateOne(
        { customer_no: sale.customer_no, userId },
        { $inc: { bal: -debt } },
        session ? { session } : {}
      );
      console.log(`[DEBUG] Customer balance update result:`, customerResult);
    }
    
    // Reverse account balance (decrease)
    console.log(`[DEBUG] Reversing account balance: -${sale.paid}`);
    if (sale.paid > 0) {
      const accountResult = await Account.updateOne(
        { account_id: sale.account_id, userId },
        { $inc: { balance: -sale.paid } },
        session ? { session } : {}
      );
      console.log(`[DEBUG] Account balance update result:`, accountResult);
    }
    
    console.log(`[DEBUG] Finished reversing effects for sale ${sale.sale_no}`);
  } catch (error) {
    console.error(`[ERROR] Failed to reverse effects for sale ${sale.sale_no}:`, error);
    throw error;
  }
}

// Create Sale Order
async function insertSale(saleData, userId) {
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
    if (!saleData.items || !Array.isArray(saleData.items) || saleData.items.length === 0) {
      throw new Error('At least one item is required for a sale order');
    }
    
    // Convert numeric fields
    const customer_no = Number(saleData.customer_no);
    const store_no = Number(saleData.store_no);
    const account_id = Number(saleData.account_id);
    const paid = Number(saleData.paid || 0);
    
    // Validate and process items
    const processedItems = saleData.items.map(item => {
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
        product_name: item.product_name || '',
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
    
    // Check account balance if payment is being made
    if (paid > 0) {
      const account = await Account.findOne({ account_id, userId }, null, session ? { session } : {});
      if (!account) {
        throw new Error('Account not found');
      }
    }
    
    // Check stock availability for all items if status will have effects
    const status = saleData.status || 'draft';
    const statusesWithEffects = ['confirmed', 'delivered'];
    const willHaveEffects = statusesWithEffects.includes(status);
    
    if (willHaveEffects) {
      for (const item of processedItems) {
        const storeProduct = await StoreProduct.findOne({ 
          product_no: item.product_no, 
          store_no, 
          userId 
        }, null, session ? { session } : {});
        
        if (!storeProduct || storeProduct.qty < item.qty) {
          throw new Error(`Insufficient stock for product ${item.product_no} in the selected store. Available: ${storeProduct?.qty || 0}, Required: ${item.qty}`);
        }
      }
    }
    
    // Get customer and store names for denormalization
    const [customer, store] = await Promise.all([
      Customer.findOne({ customer_no, userId }, null, session ? { session } : {}),
      Store.findOne({ store_no, userId }, null, session ? { session } : {})
    ]);
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    if (!store) {
      throw new Error('Store not found');
    }
    
    // Get account name
    const account = await Account.findOne({ account_id, userId }, null, session ? { session } : {});
    
    // Generate sale identifiers
    const sale_id = await getNextSequence('sale_id');
    const sequence = await getNextSequence('sale_no');
    const sale_no = `SAL-${String(sequence).padStart(5, '0')}`;
    const sel_no = await getNextSequence('sel_no'); // Keep for backward compatibility
    
    // Create sale order
    const newSale = new Sale({
      sale_id,
      sale_no,
      sel_no, // Keep for backward compatibility
      customer_no,
      customer_name: customer.name || customer.customer_name || '',
      store_no,
      store_name: store.store_name || '',
      items: processedItems,
      subtotal: totals.subtotal,
      total_discount: totals.totalDiscount,
      total_tax: totals.totalTax,
      amount: totals.totalAmount,
      paid,
      balance_due: totals.totalAmount - paid,
      account_id,
      account_name: account?.name || account?.account_name || '',
      status,
      sel_date: saleData.sel_date || new Date(),
      delivery_date: saleData.delivery_date,
      notes: saleData.notes || '',
      userId,
      // Legacy fields for backward compatibility
      discount: totals.totalDiscount,
      tax: totals.totalTax
    });
    
    // Save sale order first
    const savedSale = await newSale.save(session ? { session } : {});
    
    // Only apply inventory and financial effects if status requires it
    if (willHaveEffects) {
      await applySaleEffects(savedSale, session, userId);
    }
    
    // Create invoice if sale is confirmed or delivered
    if (['confirmed', 'delivered'].includes(status)) {
      try {
        const invoice_no = await getNextSequence('invoice_no');
        const invoiceItems = processedItems.map(item => ({
          ...item,
          name: item.product_name
        }));
        const invoiceStatus = paid >= totals.totalAmount ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');
        
        await Invoice.create({
          invoice_no,
          sale_id: savedSale._id,
          date: new Date(),
          customer: {
            customer_no: savedSale.customer_no,
            name: savedSale.customer_name,
            address: customer.address || '',
            phone: customer.phone || '',
            email: customer.email || ''
          },
          items: invoiceItems,
          subtotal: totals.totalAmount,
          total_discount: totals.totalDiscount,
          total_tax: totals.totalTax,
          total: totals.totalAmount,
          paid: paid,
          balance_due: totals.totalAmount - paid,
          status: invoiceStatus,
          notes: savedSale.notes || ''
        });
      } catch (err) {
        console.error('Failed to create invoice for sale:', err.message);
        // Don't fail the entire sale if invoice creation fails
      }
    }
    
    // Commit transaction if using one
    if (session) {
      await session.commitTransaction();
    }
    
    // Recalculate balances outside transaction only if effects were applied
    if (willHaveEffects) {
      for (const item of processedItems) {
        await recalculateProductBalance(item.product_no);
      }
      await recalculateStoreTotal(store_no);
    }
    
    return {
      message: 'Sale order created successfully',
      sale_no,
      sale_id,
      sel_no,
      _id: savedSale._id,
      sale: savedSale
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

// Update Sale Order
async function updateSale(sale_no, updateData, userId) {
  // Check if MongoDB supports transactions (replica set required)
  const isReplicaSet = mongoose.connection.db.topology?.type === 'ReplicaSetWithPrimary' || 
                      mongoose.connection.db.topology?.constructor?.name === 'ReplSet';
  
  let session = null;
  if (isReplicaSet) {
    session = await mongoose.startSession();
    await session.startTransaction();
  }
  
  try {
    console.log(`[DEBUG] Updating sale ${sale_no} for user ${userId}`);
    console.log(`[DEBUG] Update data:`, JSON.stringify(updateData, null, 2));
    
    // Try both sale_no and sel_no for backward compatibility
    let existingSale = await Sale.findOne({ sale_no, userId }, null, session ? { session } : {});
    
    if (!existingSale) {
      // Try with sel_no for backward compatibility
      const sel_no = parseInt(sale_no.replace('SAL-', ''));
      if (!isNaN(sel_no)) {
        existingSale = await Sale.findOne({ sel_no, userId }, null, session ? { session } : {});
      }
    }
    
    if (!existingSale) {
      throw new Error('Sale order not found');
    }
    
    console.log(`[DEBUG] Found sale: ${existingSale.sale_no}, status: ${existingSale.status}`);
    
    // For now, we'll handle simple updates (status, notes, payment)
    // Full item updates would require more complex logic
    const allowedUpdates = ['status', 'notes', 'paid', 'delivery_date'];
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
    const oldStatus = existingSale.status;
    const newStatus = updates.status;
    
    console.log(`[DEBUG] Status change: ${oldStatus} → ${newStatus}`);
    
    // Define which statuses should have effects applied
    const statusesWithEffects = ['confirmed', 'delivered'];
    const oldHadEffects = statusesWithEffects.includes(oldStatus);
    const newWillHaveEffects = newStatus ? statusesWithEffects.includes(newStatus) : oldHadEffects;
    
    console.log(`[DEBUG] Old had effects: ${oldHadEffects}, New will have effects: ${newWillHaveEffects}`);
    
    // Check stock availability if transitioning to status with effects
    if (!oldHadEffects && newWillHaveEffects) {
      for (const item of existingSale.items) {
        const storeProduct = await StoreProduct.findOne({ 
          product_no: item.product_no, 
          store_no: existingSale.store_no, 
          userId 
        }, null, session ? { session } : {});
        
        if (!storeProduct || storeProduct.qty < item.qty) {
          throw new Error(`Insufficient stock for product ${item.product_no} in store. Available: ${storeProduct?.qty || 0}, Required: ${item.qty}`);
        }
      }
    }
    
    // Apply or reverse inventory and financial effects based on status change
    if (!oldHadEffects && newWillHaveEffects) {
      // Status changed from draft/pending to confirmed/delivered - apply effects
      console.log(`[DEBUG] Applying effects due to status change`);
      await applySaleEffects(existingSale, session, userId);
    } else if (oldHadEffects && !newWillHaveEffects) {
      // Status changed from confirmed/delivered to draft/pending/cancelled - reverse effects
      console.log(`[DEBUG] Reversing effects due to status change`);
      await reverseSaleEffects(existingSale, session, userId);
    } else {
      console.log(`[DEBUG] No effect changes needed for this status transition`);
    }
    
    // Handle payment changes
    if (updates.paid !== undefined) {
      const newPaid = Number(updates.paid);
      if (newPaid > existingSale.amount) {
        throw new Error('Paid amount cannot exceed total amount');
      }
      
      const paidDifference = newPaid - existingSale.paid;
      
      // Only update balances if the sale order has effects applied (confirmed/delivered)
      if (paidDifference !== 0 && statusesWithEffects.includes(existingSale.status)) {
        // Update account balance
        await Account.updateOne(
          { account_id: existingSale.account_id, userId },
          { $inc: { balance: paidDifference } },
          session ? { session } : {}
        );
        
        // Update customer balance (reverse: if paid more, customer owes less)
        await Customer.updateOne(
          { customer_no: existingSale.customer_no, userId },
          { $inc: { bal: -paidDifference } },
          session ? { session } : {}
        );
      }
      
      updates.balance_due = existingSale.amount - newPaid;
    }
    
    updates.updated_at = new Date();
    
    // Update the sale
    const updateQuery = existingSale.sale_no ? { sale_no: existingSale.sale_no, userId } : { sel_no: existingSale.sel_no, userId };
    await Sale.updateOne(
      updateQuery,
      { $set: updates },
      session ? { session } : {}
    );
    
    // Verify the update actually happened
    const updatedSale = await Sale.findOne(updateQuery);
    console.log(`[DEBUG] Sale after update - Status: ${updatedSale.status}, Paid: ${updatedSale.paid}`);
    
    // Commit transaction if using one
    if (session) {
      await session.commitTransaction();
    }
    
    // Recalculate balances outside transaction if effects were applied or reversed
    if ((!oldHadEffects && newWillHaveEffects) || (oldHadEffects && !newWillHaveEffects)) {
      console.log(`[DEBUG] Recalculating balances after status change`);
      for (const item of existingSale.items) {
        await recalculateProductBalance(item.product_no);
      }
      await recalculateStoreTotal(existingSale.store_no);
    }
    
    return { message: 'Sale order updated successfully' };
    
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

// Delete Sale Order
async function deleteSale(sale_no, userId) {
  // Check if MongoDB supports transactions (replica set required)
  const isReplicaSet = mongoose.connection.db.topology?.type === 'ReplicaSetWithPrimary' || 
                      mongoose.connection.db.topology?.constructor?.name === 'ReplSet';
  
  let session = null;
  if (isReplicaSet) {
    session = await mongoose.startSession();
    await session.startTransaction();
  }
  
  try {
    // Try both sale_no and sel_no for backward compatibility
    let existingSale = await Sale.findOne({ sale_no, userId }, null, session ? { session } : {});
    
    if (!existingSale) {
      // Try with sel_no for backward compatibility
      const sel_no = parseInt(sale_no.replace('SAL-', ''));
      if (!isNaN(sel_no)) {
        existingSale = await Sale.findOne({ sel_no, userId }, null, session ? { session } : {});
      }
    }
    
    if (!existingSale) {
      throw new Error('Sale order not found');
    }
    
    // Only reverse effects if the sale had effects applied (confirmed/delivered status)
    const statusesWithEffects = ['confirmed', 'delivered'];
    const hadEffects = statusesWithEffects.includes(existingSale.status);
    
    console.log(`[DEBUG] Deleting sale ${existingSale.sale_no || existingSale.sel_no}, status: ${existingSale.status}, had effects: ${hadEffects}`);
    
    if (hadEffects) {
      // Reverse inventory and financial effects
      console.log(`[DEBUG] Reversing effects before deletion`);
      await reverseSaleEffects(existingSale, session, userId);
    } else {
      console.log(`[DEBUG] No effects to reverse for draft/pending sale`);
    }
    
    // Delete the sale order
    const deleteQuery = existingSale.sale_no ? { sale_no: existingSale.sale_no, userId } : { sel_no: existingSale.sel_no, userId };
    await Sale.deleteOne(deleteQuery, session ? { session } : {});
    
    // Commit transaction if using one
    if (session) {
      await session.commitTransaction();
    }
    
    // Recalculate balances outside transaction only if effects were reversed
    if (hadEffects) {
      console.log(`[DEBUG] Recalculating balances after deletion`);
      for (const item of existingSale.items) {
        await recalculateProductBalance(item.product_no);
      }
      await recalculateStoreTotal(existingSale.store_no);
    }
    
    return { message: 'Sale order deleted successfully' };
    
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

// Get All Sales
async function getAllSales(userId) {
  try {
    const sales = await Sale.find({ userId })
      .sort({ created_at: -1 })
      .lean();
    
    // Get related data for display
    const customerNos = [...new Set(sales.map(s => s.customer_no))];
    const storeNos = [...new Set(sales.map(s => s.store_no))];
    const accountIds = [...new Set(sales.map(s => s.account_id))];
    
    const [customers, stores, accounts] = await Promise.all([
      Customer.find({ customer_no: { $in: customerNos }, userId }).lean(),
      Store.find({ store_no: { $in: storeNos }, userId }).lean(),
      Account.find({ account_id: { $in: accountIds }, userId }).lean()
    ]);
    
    // Create lookup maps
    const customerMap = Object.fromEntries(customers.map(c => [c.customer_no, c.name || c.customer_name]));
    const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));
    const accountMap = Object.fromEntries(accounts.map(a => [a.account_id, a.name || a.account_name]));
    
    // Enhance sales with related names
    return sales.map(sale => ({
      ...sale,
      customer_name: customerMap[sale.customer_no] || sale.customer_name || '',
      store_name: storeMap[sale.store_no] || sale.store_name || '',
      account_name: accountMap[sale.account_id] || sale.account_name || ''
    }));
    
  } catch (error) {
    throw new Error(`Failed to fetch sales: ${error.message}`);
  }
}

// Express route handler for getAllSales
async function getAllSalesRoute(req, res) {
  try {
    const sales = await getAllSales(req.user.id);
    res.json(sales);
    console.log('API /api/sales returning:', sales.length, 'sales');
  } catch (err) {
    console.error('Error in getAllSales:', err);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
}

module.exports = { 
  insertSale, 
  updateSale, 
  deleteSale, 
  getAllSales,
  getAllSalesRoute,
  applySaleEffects,
  reverseSaleEffects,
  calculateTotals
};
