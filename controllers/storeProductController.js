const StoreProduct = require('../models/StoreProduct');
const Product = require('../models/Product'); // Ensure Product schema is registered
const Store = require('../models/Store'); // Ensure Store schema is registered
const getNextSequence = require('../getNextSequence');

// Get all store products
exports.getAllStoreProducts = async (req, res) => {
  try {
    const storeProducts = await StoreProduct.find();
    const products = await Product.find();
    const stores = await Store.find();

    // Create lookup maps
    const productMap = Object.fromEntries(products.map(p => [p.product_no, p.product_name]));
    const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));

    const result = storeProducts.map(sp => ({
      _id: sp._id,
      store_product_no: sp.store_product_no,
      product_no: sp.product_no,
      product_name: productMap[sp.product_no] || '',
      store_no: sp.store_no,
      store_name: storeMap[sp.store_no] || '',
      qty: sp.qty,
      created_at: sp.created_at
    }));

    res.json(result);
  } catch (err) {
    console.error('Error in getAllStoreProducts:', err);
    res.status(500).json({ error: 'Failed to fetch store products', details: err.message });
  }
};

// Get a single store product by ID
exports.getStoreProductById = async (req, res) => {
  try {
    const sp = await StoreProduct.findById(req.params.id)
      .populate('product_no', 'product_name')
      .populate('store_no', 'store_name');
    if (!sp) return res.status(404).json({ error: 'Store product not found' });
    const result = {
      _id: sp._id,
      product_no: sp.product_no?._id || sp.product_no,
      product_name: sp.product_no?.product_name || '',
      store_no: sp.store_no?._id || sp.store_no,
      store_name: sp.store_no?.store_name || '',
      qty: sp.qty,
      created_at: sp.created_at
    };
    res.json(result);
  } catch (err) {
    console.error('Error in getStoreProductById:', err);
    res.status(500).json({ error: 'Failed to fetch store product', details: err.message });
  }
};

// Helper to recalculate storing_balance for a product
async function recalculateProductBalance(product_no) {
  const StoreProduct = require('../models/StoreProduct');
  const Product = require('../models/Product');
  const total = await StoreProduct.aggregate([
    { $match: { product_no: Number(product_no) } },
    { $group: { _id: null, sum: { $sum: '$qty' } } }
  ]);
  await Product.updateOne(
    { product_no: Number(product_no) },
    { $set: { storing_balance: total[0]?.sum || 0 } }
  );
}

// Helper to recalculate total_items for a store
async function recalculateStoreTotal(store_no) {
  const StoreProduct = require('../models/StoreProduct');
  const Store = require('../models/Store');
  const total = await StoreProduct.aggregate([
    { $match: { store_no: Number(store_no) } },
    { $group: { _id: null, sum: { $sum: '$qty' } } }
  ]);
  await Store.updateOne(
    { store_no: Number(store_no) },
    { $set: { total_items: total[0]?.sum || 0 } }
  );
}

// Create a new store product (user-specific)
exports.createStoreProduct = async (req, res) => {
  try {
    const store_product_no = await getNextSequence('store_product_no');
    const newStoreProduct = new StoreProduct({
      ...req.body,
      store_product_no,
      userId: req.user.id
    });
    await newStoreProduct.save();
    // Recalculate affected product and store
    await recalculateProductBalance(newStoreProduct.product_no);
    await recalculateStoreTotal(newStoreProduct.store_no);
    res.status(201).json(newStoreProduct);
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        error: 'A store product with this product and store already exists.',
        details: err.message
      });
    }
    console.error('Error in createStoreProduct:', err);
    res.status(400).json({ error: 'Failed to create store product', details: err.message });
  }
};

// Update a store product (user-specific)
exports.updateStoreProduct = async (req, res) => {
  try {
    const updated = await StoreProduct.findOneAndUpdate(
      { store_product_no: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Store product not found' });
    // Recalculate affected product and store
    await recalculateProductBalance(updated.product_no);
    await recalculateStoreTotal(updated.store_no);
    res.json(updated);
  } catch (err) {
    console.error('Error in updateStoreProduct:', err);
    res.status(400).json({ error: 'Failed to update store product', details: err.message });
  }
};

// Delete a store product (user-specific)
exports.deleteStoreProduct = async (req, res) => {
  try {
    const deleted = await StoreProduct.findOneAndDelete({ store_product_no: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Store product not found' });
    // Recalculate affected product and store
    await recalculateProductBalance(deleted.product_no);
    await recalculateStoreTotal(deleted.store_no);
    res.json({ message: 'Store product deleted' });
  } catch (err) {
    console.error('Error in deleteStoreProduct:', err);
    res.status(400).json({ error: 'Failed to delete store product', details: err.message });
  }
};

exports.recalculateProductBalance = recalculateProductBalance;
exports.recalculateStoreTotal = recalculateStoreTotal; 