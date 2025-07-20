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
    const returns = await SalesReturn.find().sort({ created_at: -1 });
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
  try {
    const { sel_no, product_no, customer_no, store_no, qty, price, paid, reason, account_id } = req.body;
    if (!sel_no || !product_no || !customer_no || !store_no || !qty || !price) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }
    if (qty <= 0 || price <= 0) {
      return res.status(400).json({ error: 'Quantity and price must be greater than 0.' });
    }
    // Validate entities
    const [sale, product, customer, store, account, storeProduct] = await Promise.all([
      Sale.findOne({ sel_no }),
      Product.findOne({ product_no }),
      Customer.findOne({ customer_no }),
      Store.findOne({ store_no }),
      account_id ? Account.findOne({ account_id }) : null,
      StoreProduct.findOne({ product_no, store_no })
    ]);
    if (!sale) return res.status(400).json({ error: 'Sale not found.' });
    if (!product) return res.status(400).json({ error: 'Product not found.' });
    if (!customer) return res.status(400).json({ error: 'Customer not found.' });
    if (!store) return res.status(400).json({ error: 'Store not found.' });
    if (!storeProduct) return res.status(400).json({ error: 'Product not found in this store.' });
    if (qty > sale.qty) return res.status(400).json({ error: 'Return quantity cannot exceed original sale quantity.' });
    const amount = qty * price;
    if (paid > amount) return res.status(400).json({ error: 'Paid amount cannot exceed total amount.' });
    // Get next return_no
    const return_no = await getNextSequence('sales_return_no');
    // Create return record
    const newReturn = new SalesReturn({
      ...req.body,
      return_no,
      amount,
      date: req.body.date || new Date(),
      created_at: new Date(),
      updated_at: new Date()
    });
    await newReturn.save();
    // Update inventory and balances
    await Promise.all([
      // Increase StoreProduct qty
      StoreProduct.updateOne(
        { product_no, store_no },
        { $inc: { qty: qty }, $set: { updated_at: new Date() } }
      ),
      // Increase product storing_balance
      Product.updateOne(
        { product_no },
        { $inc: { storing_balance: qty } }
      ),
      // Increase store total_items
      Store.updateOne(
        { store_no },
        { $inc: { total_items: qty } }
      ),
      // Reduce customer debt if paid
      paid > 0 ? Customer.updateOne(
        { customer_no },
        { $inc: { bal: -paid } }
      ) : Promise.resolve(),
      // Refund from account if paid
      paid > 0 && account ? Account.updateOne(
        { account_id },
        { $inc: { balance: -paid } }
      ) : Promise.resolve()
    ]);
    res.status(201).json(newReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    const oldReturn = await SalesReturn.findById(id);
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
    // Validate new entities
    const [sale, product, customer, store, account, storeProduct] = await Promise.all([
      Sale.findOne({ sel_no }),
      Product.findOne({ product_no }),
      Customer.findOne({ customer_no }),
      Store.findOne({ store_no }),
      account_id ? Account.findOne({ account_id }) : null,
      StoreProduct.findOne({ product_no, store_no })
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
    const oldReturn = await SalesReturn.findById(id);
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