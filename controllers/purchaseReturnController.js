const PurchaseReturn = require('../models/PurchaseReturn');
const getNextSequence = require('../getNextSequence');
const StoreProduct = require('../models/StoreProduct');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Supplier = require('../models/Supplier');
const Account = require('../models/Account');

// Get all purchase returns with names
exports.getAllPurchaseReturns = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Getting purchase returns for user:', userId);
    
    const returns = await PurchaseReturn.find({ userId }).sort({ created_at: -1 });
    console.log('📊 Found', returns.length, 'purchase returns');
    
    const productNos = [...new Set(returns.map(r => r.product_no))];
    const supplierNos = [...new Set(returns.map(r => r.supplier_no))];
    const storeNos = [...new Set(returns.map(r => r.store_no))];
    
    console.log('🔍 Looking up related data for user:', userId);
    console.log('Product numbers:', productNos);
    console.log('Supplier numbers:', supplierNos);
    console.log('Store numbers:', storeNos);
    
    const [products, suppliers, stores] = await Promise.all([
      Product.find({ product_no: { $in: productNos }, userId }),
      Supplier.find({ supplier_no: { $in: supplierNos }, userId }),
      Store.find({ store_no: { $in: storeNos }, userId })
    ]);
    
    console.log('📊 Found related data:');
    console.log('Products:', products.length);
    console.log('Suppliers:', suppliers.length);
    console.log('Stores:', stores.length);
    
    const productMap = Object.fromEntries(products.map(p => [p.product_no, p.product_name]));
    const supplierMap = Object.fromEntries(suppliers.map(s => [s.supplier_no, s.name]));
    const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));
    
    const enrichedReturns = returns.map(r => ({
      ...r.toObject(),
      product_name: productMap[r.product_no] || '',
      supplier_name: supplierMap[r.supplier_no] || '',
      store_name: storeMap[r.store_no] || ''
    }));
    
    console.log('✅ Returning', enrichedReturns.length, 'enriched purchase returns');
    res.json(enrichedReturns);
  } catch (err) {
    console.error('❌ Error in getAllPurchaseReturns:', err);
    res.status(500).json({ error: err.message });
  }
};

// Create a new purchase return with validations and inventory/account effects
exports.createPurchaseReturn = async (req, res) => {
  // Use manual rollback for standalone MongoDB (local development)
  let storeProduct = null;
  let product = null;
  let store = null;
  let supplier = null;
  let account = null;
  let originalStoreProductQty = 0;
  let originalProductBalance = 0;
  let originalStoreTotalItems = 0;
  let originalSupplierBalance = 0;
  let originalAccountBalance = 0;
  
  try {
    console.log('🔍 Purchase Return Creation - Request Data:', req.body);
    console.log('🔍 User ID:', req.user?.id);
    
    const { product_no, supplier_no, store_no, qty, price, paid, reason, account_id } = req.body;
    if (!product_no || !supplier_no || !store_no || !qty || !price) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }
    if (qty <= 0 || price <= 0) {
      console.log('❌ Validation failed: Invalid qty or price');
      return res.status(400).json({ error: 'Quantity and price must be greater than 0.' });
    }
    
    console.log('🔍 Validating entities...');
    // Validate entities with user context
    const [productEntity, supplierEntity, storeEntity, accountEntity, storeProductEntity] = await Promise.all([
      Product.findOne({ product_no, userId: req.user.id }),
      Supplier.findOne({ supplier_no, userId: req.user.id }),
      Store.findOne({ store_no, userId: req.user.id }),
      account_id ? Account.findOne({ account_id, userId: req.user.id }) : null,
      StoreProduct.findOne({ product_no, store_no, userId: req.user.id })
    ]);
    
    console.log('🔍 Entity validation results:', {
      product: !!productEntity,
      supplier: !!supplierEntity,
      store: !!storeEntity,
      storeProduct: !!storeProductEntity,
      account: !!accountEntity
    });
    
    if (!productEntity) {
      console.log('❌ Product not found for user');
      return res.status(400).json({ error: 'Product not found.' });
    }
    if (!supplierEntity) {
      console.log('❌ Supplier not found for user');
      return res.status(400).json({ error: 'Supplier not found.' });
    }
    if (!storeEntity) {
      console.log('❌ Store not found for user');
      return res.status(400).json({ error: 'Store not found.' });
    }
    if (!storeProductEntity) {
      console.log('❌ Product not found in this store for user');
      return res.status(400).json({ error: 'Product not found in this store.' });
    }
    if (storeProductEntity.qty < qty) {
      console.log(`❌ Insufficient stock: ${storeProductEntity.qty} < ${qty}`);
      return res.status(400).json({ error: `Insufficient stock in store. Current: ${storeProductEntity.qty}` });
    }
    
    // Calculate amount
    const amount = qty * price;
    if (paid > amount) {
      console.log('❌ Paid amount exceeds total amount');
      return res.status(400).json({ error: 'Paid amount cannot exceed total amount.' });
    }
    
    console.log('✅ All validations passed, starting updates...');
    
    // Store references and original values for potential rollback
    storeProduct = storeProductEntity;
    product = productEntity;
    store = storeEntity;
    supplier = supplierEntity;
    account = accountEntity;
    originalStoreProductQty = storeProduct.qty || 0;
    originalProductBalance = product.storing_balance || 0;
    originalStoreTotalItems = store.total_items || 0;
    originalSupplierBalance = supplier.bal || 0;
    originalAccountBalance = account ? (account.balance || 0) : 0;
    
    // Get next return_no
    const return_no = await getNextSequence('purchase_return_no');
    console.log('🔍 Generated return_no:', return_no);
    
    // Update store product quantity
    storeProduct.qty = (storeProduct.qty || 0) - Number(qty);
    storeProduct.updated_at = new Date();
    await storeProduct.save();
    console.log('✅ Updated store product quantity');
    
    // Update product storing balance
    product.storing_balance = (product.storing_balance || 0) - Number(qty);
    await product.save();
    console.log('✅ Updated product storing balance');
    
    // Update store total items
    store.total_items = (store.total_items || 0) - Number(qty);
    await store.save();
    console.log('✅ Updated store total items');
    
    // Update supplier balance if paid
    if (paid > 0) {
      supplier.bal = (supplier.bal || 0) - Number(paid);
      await supplier.save();
      console.log('✅ Updated supplier balance');
    }
    
    // Update account balance if paid
    if (paid > 0 && account) {
      account.balance = (account.balance || 0) + Number(paid);
      await account.save();
      console.log('✅ Updated account balance');
    }
    
    // Create return record
    const newReturn = new PurchaseReturn({
      ...req.body,
      return_no,
      amount,
      date: req.body.date || new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      userId: req.user.id
    });
    await newReturn.save();
    console.log('✅ Purchase return created successfully:', newReturn._id);
    
    res.status(201).json(newReturn);
  } catch (err) {
    // Manual rollback if return creation failed after balance updates
    console.error('❌ Purchase return creation error, attempting manual rollback:', err);
    
    try {
      if (storeProduct && originalStoreProductQty !== undefined) {
        storeProduct.qty = originalStoreProductQty;
        await storeProduct.save();
        console.log('✅ Store product quantity rolled back');
      }
      
      if (product && originalProductBalance !== undefined) {
        product.storing_balance = originalProductBalance;
        await product.save();
        console.log('✅ Product storing balance rolled back');
      }
      
      if (store && originalStoreTotalItems !== undefined) {
        store.total_items = originalStoreTotalItems;
        await store.save();
        console.log('✅ Store total items rolled back');
      }
      
      if (supplier && originalSupplierBalance !== undefined) {
        supplier.bal = originalSupplierBalance;
        await supplier.save();
        console.log('✅ Supplier balance rolled back');
      }
      
      if (account && originalAccountBalance !== undefined) {
        account.balance = originalAccountBalance;
        await account.save();
        console.log('✅ Account balance rolled back');
      }
    } catch (rollbackErr) {
      console.error('❌ Manual rollback failed:', rollbackErr);
      return res.status(500).json({ 
        error: 'Purchase return creation failed and rollback failed',
        details: 'Data may be inconsistent. Please check balances manually.',
        originalError: err.message,
        rollbackError: rollbackErr.message
      });
    }
    
    res.status(400).json({ 
      error: 'Failed to create purchase return: ' + err.message,
      details: 'Changes have been rolled back manually' 
    });
  }
};

// Update a purchase return and adjust inventory/account
exports.updatePurchaseReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_no, supplier_no, store_no, qty, price, paid, reason, account_id } = req.body;
    if (!product_no || !supplier_no || !store_no || !qty || !price) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }
    if (qty <= 0 || price <= 0) {
      return res.status(400).json({ error: 'Quantity and price must be greater than 0.' });
    }
    const oldReturn = await PurchaseReturn.findOne({ _id: id, userId: req.user.id });
    if (!oldReturn) return res.status(404).json({ error: 'Purchase return not found.' });
    // Reverse previous effects
    await Promise.all([
      StoreProduct.updateOne(
        { product_no: oldReturn.product_no, store_no: oldReturn.store_no },
        { $inc: { qty: oldReturn.qty }, $set: { updated_at: new Date() } }
      ),
      Product.updateOne(
        { product_no: oldReturn.product_no },
        { $inc: { storing_balance: oldReturn.qty } }
      ),
      Store.updateOne(
        { store_no: oldReturn.store_no },
        { $inc: { total_items: oldReturn.qty } }
      ),
      oldReturn.paid > 0 ? Supplier.updateOne(
        { supplier_no: oldReturn.supplier_no },
        { $inc: { bal: oldReturn.paid } }
      ) : Promise.resolve(),
      oldReturn.paid > 0 && oldReturn.account_id ? Account.updateOne(
        { account_id: oldReturn.account_id },
        { $inc: { balance: -oldReturn.paid } }
      ) : Promise.resolve()
    ]);
    // Validate new entities with user context
    const [product, supplier, store, account, storeProduct] = await Promise.all([
      Product.findOne({ product_no, userId: req.user.id }),
      Supplier.findOne({ supplier_no, userId: req.user.id }),
      Store.findOne({ store_no, userId: req.user.id }),
      account_id ? Account.findOne({ account_id, userId: req.user.id }) : null,
      StoreProduct.findOne({ product_no, store_no, userId: req.user.id })
    ]);
    if (!product) return res.status(400).json({ error: 'Product not found.' });
    if (!supplier) return res.status(400).json({ error: 'Supplier not found.' });
    if (!store) return res.status(400).json({ error: 'Store not found.' });
    if (!storeProduct) return res.status(400).json({ error: 'Product not found in this store.' });
    if (storeProduct.qty < qty) return res.status(400).json({ error: `Insufficient stock in store. Current: ${storeProduct.qty}` });
    const amount = qty * price;
    if (paid > amount) return res.status(400).json({ error: 'Paid amount cannot exceed total amount.' });
    // Apply new effects
    await Promise.all([
      StoreProduct.updateOne(
        { product_no, store_no },
        { $inc: { qty: -qty }, $set: { updated_at: new Date() } }
      ),
      Product.updateOne(
        { product_no },
        { $inc: { storing_balance: -qty } }
      ),
      Store.updateOne(
        { store_no },
        { $inc: { total_items: -qty } }
      ),
      paid > 0 ? Supplier.updateOne(
        { supplier_no },
        { $inc: { bal: -paid } }
      ) : Promise.resolve(),
      paid > 0 && account ? Account.updateOne(
        { account_id },
        { $inc: { balance: paid } }
      ) : Promise.resolve()
    ]);
    // Update return record
    oldReturn.product_no = product_no;
    oldReturn.supplier_no = supplier_no;
    oldReturn.store_no = store_no;
    oldReturn.qty = qty;
    oldReturn.price = price;
    oldReturn.amount = amount;
    oldReturn.paid = paid;
    oldReturn.reason = reason;
    oldReturn.account_id = account_id;
    oldReturn.updated_at = new Date();
    await oldReturn.save();
    res.json(oldReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a purchase return and reverse inventory/account effects
exports.deletePurchaseReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const oldReturn = await PurchaseReturn.findOne({ _id: id, userId: req.user.id });
    if (!oldReturn) return res.status(404).json({ error: 'Purchase return not found.' });
    // Reverse effects
    await Promise.all([
      StoreProduct.updateOne(
        { product_no: oldReturn.product_no, store_no: oldReturn.store_no },
        { $inc: { qty: oldReturn.qty }, $set: { updated_at: new Date() } }
      ),
      Product.updateOne(
        { product_no: oldReturn.product_no },
        { $inc: { storing_balance: oldReturn.qty } }
      ),
      Store.updateOne(
        { store_no: oldReturn.store_no },
        { $inc: { total_items: oldReturn.qty } }
      ),
      oldReturn.paid > 0 ? Supplier.updateOne(
        { supplier_no: oldReturn.supplier_no },
        { $inc: { bal: oldReturn.paid } }
      ) : Promise.resolve(),
      oldReturn.paid > 0 && oldReturn.account_id ? Account.updateOne(
        { account_id: oldReturn.account_id },
        { $inc: { balance: -oldReturn.paid } }
      ) : Promise.resolve()
    ]);
    await PurchaseReturn.findByIdAndDelete(id);
    res.json({ message: 'Purchase return deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 