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
    const returns = await PurchaseReturn.find({ userId }).sort({ created_at: -1 });
    const productNos = [...new Set(returns.map(r => r.product_no))];
    const supplierNos = [...new Set(returns.map(r => r.supplier_no))];
    const storeNos = [...new Set(returns.map(r => r.store_no))];
    const [products, suppliers, stores] = await Promise.all([
      Product.find({ product_no: { $in: productNos } }),
      Supplier.find({ supplier_no: { $in: supplierNos } }),
      Store.find({ store_no: { $in: storeNos } })
    ]);
    const productMap = Object.fromEntries(products.map(p => [p.product_no, p.product_name]));
    const supplierMap = Object.fromEntries(suppliers.map(s => [s.supplier_no, s.name]));
    const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));
    res.json(returns.map(r => ({
      ...r.toObject(),
      product_name: productMap[r.product_no] || '',
      supplier_name: supplierMap[r.supplier_no] || '',
      store_name: storeMap[r.store_no] || ''
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new purchase return with validations and inventory/account effects
exports.createPurchaseReturn = async (req, res) => {
  try {
    const { product_no, supplier_no, store_no, qty, price, paid, reason, account_id } = req.body;
    if (!product_no || !supplier_no || !store_no || !qty || !price) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }
    if (qty <= 0 || price <= 0) {
      return res.status(400).json({ error: 'Quantity and price must be greater than 0.' });
    }
    // Validate entities
    const [product, supplier, store, account, storeProduct] = await Promise.all([
      Product.findOne({ product_no }),
      Supplier.findOne({ supplier_no }),
      Store.findOne({ store_no }),
      account_id ? Account.findOne({ account_id }) : null,
      StoreProduct.findOne({ product_no, store_no })
    ]);
    if (!product) return res.status(400).json({ error: 'Product not found.' });
    if (!supplier) return res.status(400).json({ error: 'Supplier not found.' });
    if (!store) return res.status(400).json({ error: 'Store not found.' });
    if (!storeProduct) return res.status(400).json({ error: 'Product not found in this store.' });
    if (storeProduct.qty < qty) return res.status(400).json({ error: `Insufficient stock in store. Current: ${storeProduct.qty}` });
    // Calculate amount
    const amount = qty * price;
    if (paid > amount) return res.status(400).json({ error: 'Paid amount cannot exceed total amount.' });
    // Get next return_no
    const return_no = await getNextSequence('purchase_return_no');
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
    // Update inventory and balances
    await Promise.all([
      // Decrease StoreProduct qty
      StoreProduct.updateOne(
        { product_no, store_no },
        { $inc: { qty: -qty }, $set: { updated_at: new Date() } }
      ),
      // Decrease product storing_balance
      Product.updateOne(
        { product_no },
        { $inc: { storing_balance: -qty } }
      ),
      // Decrease store total_items
      Store.updateOne(
        { store_no },
        { $inc: { total_items: -qty } }
      ),
      // Adjust supplier balance (increase debt reduction)
      paid > 0 ? Supplier.updateOne(
        { supplier_no },
        { $inc: { bal: -paid } }
      ) : Promise.resolve(),
      // Refund to account if paid
      paid > 0 && account ? Account.updateOne(
        { account_id },
        { $inc: { balance: paid } }
      ) : Promise.resolve()
    ]);
    res.status(201).json(newReturn);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
    const oldReturn = await PurchaseReturn.findById(id);
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
    // Validate new entities
    const [product, supplier, store, account, storeProduct] = await Promise.all([
      Product.findOne({ product_no }),
      Supplier.findOne({ supplier_no }),
      Store.findOne({ store_no }),
      account_id ? Account.findOne({ account_id }) : null,
      StoreProduct.findOne({ product_no, store_no })
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
    const oldReturn = await PurchaseReturn.findById(id);
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