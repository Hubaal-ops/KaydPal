const SalesReturn = require('../models/SalesReturn');
const getNextSequence = require('../getNextSequence');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Customer = require('../models/Customer');
const Account = require('../models/Account');
const StoreProduct = require('../models/StoreProduct');

// Get all sales returns with names
exports.getAllSalesReturns = async (req, res) => {
  try {
    const userId = req.user.id;
    const returns = await SalesReturn.find({ userId }).sort({ created_at: -1 });
    const productNos = [...new Set(returns.map(r => r.product_no))];
    const customerNos = [...new Set(returns.map(r => r.customer_no))];
    const storeNos = [...new Set(returns.map(r => r.store_no))];
    const [products, customers, stores] = await Promise.all([
      Product.find({ product_no: { $in: productNos } }),
      Customer.find({ customer_no: { $in: customerNos } }),
      Store.find({ store_no: { $in: storeNos } })
    ]);
    const productMap = Object.fromEntries(products.map(p => [p.product_no, p.product_name]));
    const customerMap = Object.fromEntries(customers.map(c => [c.customer_no, c.name]));
    const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));
    res.json(returns.map(r => ({
      ...r.toObject(),
      product_name: productMap[r.product_no] || '',
      customer_name: customerMap[r.customer_no] || '',
      store_name: storeMap[r.store_no] || ''
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new sales return with validations and effects
exports.createSalesReturn = async (req, res) => {
  // Use manual rollback for standalone MongoDB (local development)
  let storeProduct = null;
  let product = null;
  let store = null;
  let customer = null;
  let account = null;
  let originalStoreProductQty = 0;
  let originalProductBalance = 0;
  let originalStoreTotalItems = 0;
  let originalCustomerBalance = 0;
  let originalAccountBalance = 0;
  
  try {
    const { sel_no, product_no, customer_no, store_no, qty, price, paid, reason, account_id } = req.body;
    if (!sel_no || !product_no || !customer_no || !store_no || !qty || !price) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }
    if (qty <= 0 || price <= 0) {
      return res.status(400).json({ error: 'Quantity and price must be greater than 0.' });
    }
    // Validate entities with user context
    const [sale, productEntity, customerEntity, storeEntity, accountEntity, storeProductEntity] = await Promise.all([
      Sale.findOne({ sel_no, userId: req.user.id }),
      Product.findOne({ product_no, userId: req.user.id }),
      Customer.findOne({ customer_no, userId: req.user.id }),
      Store.findOne({ store_no, userId: req.user.id }),
      account_id ? Account.findOne({ account_id, userId: req.user.id }) : null,
      StoreProduct.findOne({ product_no, store_no, userId: req.user.id })
    ]);
    
    if (!sale) return res.status(400).json({ error: 'Sale not found.' });
    if (!productEntity) return res.status(400).json({ error: 'Product not found.' });
    if (!customerEntity) return res.status(400).json({ error: 'Customer not found.' });
    if (!storeEntity) return res.status(400).json({ error: 'Store not found.' });
    if (!storeProductEntity) return res.status(400).json({ error: 'Product not found in this store.' });
    if (qty > sale.qty) return res.status(400).json({ error: 'Return quantity cannot exceed original sale quantity.' });
    const amount = qty * price;
    if (paid > amount) return res.status(400).json({ error: 'Paid amount cannot exceed total amount.' });
    
    // Store references and original values for potential rollback
    storeProduct = storeProductEntity;
    product = productEntity;
    store = storeEntity;
    customer = customerEntity;
    account = accountEntity;
    originalStoreProductQty = storeProduct.qty || 0;
    originalProductBalance = product.storing_balance || 0;
    originalStoreTotalItems = store.total_items || 0;
    originalCustomerBalance = customer.bal || 0;
    originalAccountBalance = account ? (account.balance || 0) : 0;
    
    // Get next return_no
    const return_no = await getNextSequence('sales_return_no');
    
    // Update store product quantity
    storeProduct.qty = (storeProduct.qty || 0) + Number(qty);
    storeProduct.updated_at = new Date();
    await storeProduct.save();
    
    // Update product storing balance
    product.storing_balance = (product.storing_balance || 0) + Number(qty);
    await product.save();
    
    // Update store total items
    store.total_items = (store.total_items || 0) + Number(qty);
    await store.save();
    
    // Update customer balance if paid
    if (paid > 0) {
      customer.bal = (customer.bal || 0) - Number(paid);
      await customer.save();
    }
    
    // Update account balance if paid
    if (paid > 0 && account) {
      account.balance = (account.balance || 0) - Number(paid);
      await account.save();
    }
    
    // Create return record
    const newReturn = new SalesReturn({
      ...req.body,
      return_no,
      amount,
      date: req.body.date || new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      userId: req.user.id
    });
    await newReturn.save();
    
    res.status(201).json(newReturn);
  } catch (err) {
    // Manual rollback if return creation failed after balance updates
    console.error('Sales return creation error, attempting manual rollback:', err);
    
    try {
      if (storeProduct && originalStoreProductQty !== undefined) {
        storeProduct.qty = originalStoreProductQty;
        await storeProduct.save();
        console.log('Store product quantity rolled back');
      }
      
      if (product && originalProductBalance !== undefined) {
        product.storing_balance = originalProductBalance;
        await product.save();
        console.log('Product storing balance rolled back');
      }
      
      if (store && originalStoreTotalItems !== undefined) {
        store.total_items = originalStoreTotalItems;
        await store.save();
        console.log('Store total items rolled back');
      }
      
      if (customer && originalCustomerBalance !== undefined) {
        customer.bal = originalCustomerBalance;
        await customer.save();
        console.log('Customer balance rolled back');
      }
      
      if (account && originalAccountBalance !== undefined) {
        account.balance = originalAccountBalance;
        await account.save();
        console.log('Account balance rolled back');
      }
    } catch (rollbackErr) {
      console.error('Manual rollback failed:', rollbackErr);
      return res.status(500).json({ 
        error: 'Sales return creation failed and rollback failed',
        details: 'Data may be inconsistent. Please check balances manually.',
        originalError: err.message,
        rollbackError: rollbackErr.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create sales return: ' + err.message,
      details: 'Changes have been rolled back manually' 
    });
  }
};

// Update a sales return and adjust inventory/account
exports.updateSalesReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { sel_no, product_no, customer_no, store_no, qty, price, paid, reason, account_id } = req.body;
    if (!sel_no || !product_no || !customer_no || !store_no || !qty || !price) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }
    if (qty <= 0 || price <= 0) {
      return res.status(400).json({ error: 'Quantity and price must be greater than 0.' });
    }
    const oldReturn = await SalesReturn.findOne({ _id: id, userId: req.user.id });
    if (!oldReturn) return res.status(404).json({ error: 'Sales return not found.' });
    // Reverse previous effects
    await Promise.all([
      StoreProduct.updateOne(
        { product_no: oldReturn.product_no, store_no: oldReturn.store_no },
        { $inc: { qty: -oldReturn.qty }, $set: { updated_at: new Date() } }
      ),
      Product.updateOne(
        { product_no: oldReturn.product_no },
        { $inc: { storing_balance: -oldReturn.qty } }
      ),
      Store.updateOne(
        { store_no: oldReturn.store_no },
        { $inc: { total_items: -oldReturn.qty } }
      ),
      oldReturn.paid > 0 ? Customer.updateOne(
        { customer_no: oldReturn.customer_no },
        { $inc: { bal: oldReturn.paid } }
      ) : Promise.resolve(),
      oldReturn.paid > 0 && oldReturn.account_id ? Account.updateOne(
        { account_id: oldReturn.account_id },
        { $inc: { balance: oldReturn.paid } }
      ) : Promise.resolve()
    ]);
    // Validate new entities with user context
    const [sale, product, customer, store, account, storeProduct] = await Promise.all([
      Sale.findOne({ sel_no, userId: req.user.id }),
      Product.findOne({ product_no, userId: req.user.id }),
      Customer.findOne({ customer_no, userId: req.user.id }),
      Store.findOne({ store_no, userId: req.user.id }),
      account_id ? Account.findOne({ account_id, userId: req.user.id }) : null,
      StoreProduct.findOne({ product_no, store_no, userId: req.user.id })
    ]);
    if (!sale) return res.status(400).json({ error: 'Sale not found.' });
    if (!product) return res.status(400).json({ error: 'Product not found.' });
    if (!customer) return res.status(400).json({ error: 'Customer not found.' });
    if (!store) return res.status(400).json({ error: 'Store not found.' });
    if (!storeProduct) return res.status(400).json({ error: 'Product not found in this store.' });
    if (qty > sale.qty) return res.status(400).json({ error: 'Return quantity cannot exceed original sale quantity.' });
    const amount = qty * price;
    if (paid > amount) return res.status(400).json({ error: 'Paid amount cannot exceed total amount.' });
    // Apply new effects
    await Promise.all([
      StoreProduct.updateOne(
        { product_no, store_no },
        { $inc: { qty: qty }, $set: { updated_at: new Date() } }
      ),
      Product.updateOne(
        { product_no },
        { $inc: { storing_balance: qty } }
      ),
      Store.updateOne(
        { store_no },
        { $inc: { total_items: qty } }
      ),
      paid > 0 ? Customer.updateOne(
        { customer_no },
        { $inc: { bal: -paid } }
      ) : Promise.resolve(),
      paid > 0 && account ? Account.updateOne(
        { account_id },
        { $inc: { balance: -paid } }
      ) : Promise.resolve()
    ]);
    // Update return record
    oldReturn.sel_no = sel_no;
    oldReturn.product_no = product_no;
    oldReturn.customer_no = customer_no;
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

// Delete a sales return and reverse inventory/account effects
exports.deleteSalesReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const oldReturn = await SalesReturn.findOne({ _id: id, userId: req.user.id });
    if (!oldReturn) return res.status(404).json({ error: 'Sales return not found.' });
    // Reverse effects
    await Promise.all([
      StoreProduct.updateOne(
        { product_no: oldReturn.product_no, store_no: oldReturn.store_no },
        { $inc: { qty: -oldReturn.qty }, $set: { updated_at: new Date() } }
      ),
      Product.updateOne(
        { product_no: oldReturn.product_no },
        { $inc: { storing_balance: -oldReturn.qty } }
      ),
      Store.updateOne(
        { store_no: oldReturn.store_no },
        { $inc: { total_items: -oldReturn.qty } }
      ),
      oldReturn.paid > 0 ? Customer.updateOne(
        { customer_no: oldReturn.customer_no },
        { $inc: { bal: oldReturn.paid } }
      ) : Promise.resolve(),
      oldReturn.paid > 0 && oldReturn.account_id ? Account.updateOne(
        { account_id: oldReturn.account_id },
        { $inc: { balance: oldReturn.paid } }
      ) : Promise.resolve()
    ]);
    await SalesReturn.findByIdAndDelete(id);
    res.json({ message: 'Sales return deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 