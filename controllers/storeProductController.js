// const StoreProduct = require('../models/StoreProduct');
const Product = require('../models/Product'); // Ensure Product schema is registered
const Store = require('../models/Store'); // Ensure Store schema is registered

// Get all store products
exports.getAllStoreProducts = async (req, res) => {
  try {
    const storeProducts = await StoreProduct.find()
      .populate('product_no', 'product_name')
      .populate('store_no', 'store_name');
    const result = storeProducts.map(sp => ({
      _id: sp._id,
      product_no: sp.product_no?._id || sp.product_no,
      product_name: sp.product_no?.product_name || '',
      store_no: sp.store_no?._id || sp.store_no,
      store_name: sp.store_no?.store_name || '',
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

// Create a new store product
exports.createStoreProduct = async (req, res) => {
  try {
    const newStoreProduct = new StoreProduct(req.body);
    await newStoreProduct.save();
    res.status(201).json(newStoreProduct);
  } catch (err) {
    console.error('Error in createStoreProduct:', err);
    res.status(400).json({ error: 'Failed to create store product', details: err.message });
  }
};

// Update a store product
exports.updateStoreProduct = async (req, res) => {
  try {
    const updated = await StoreProduct.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Store product not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error in updateStoreProduct:', err);
    res.status(400).json({ error: 'Failed to update store product', details: err.message });
  }
};

// Delete a store product
exports.deleteStoreProduct = async (req, res) => {
  try {
    const deleted = await StoreProduct.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Store product not found' });
    res.json({ message: 'Store product deleted' });
  } catch (err) {
    console.error('Error in deleteStoreProduct:', err);
    res.status(400).json({ error: 'Failed to delete store product', details: err.message });
  }
}; 