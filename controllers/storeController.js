const Store = require('../models/Store');
const getNextSequence = require('../getNextSequence');

// Get all stores
exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.find({ userId: req.user.id });
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
};

// Get a single store by ID
exports.getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch store' });
  }
};

// Create a new store
exports.createStore = async (req, res) => {
  try {
    // Generate next store_no
    const store_no = await getNextSequence('store_no');
    const newStore = new Store({
      ...req.body,
      store_no,
      userId: req.user.id
    });
    await newStore.save();
    res.status(201).json(newStore);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create store' });
  }
};

// Update a store (user-specific)
exports.updateStore = async (req, res) => {
  try {
    const updated = await Store.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Store not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update store' });
  }
};

// Delete a store (user-specific)
exports.deleteStore = async (req, res) => {
  try {
    const deleted = await Store.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Store not found' });
    res.json({ message: 'Store deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete store' });
  }
};
