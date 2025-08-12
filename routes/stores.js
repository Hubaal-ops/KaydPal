const express = require('express');

const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const storeController = require('../controllers/storeController');
router.use(verifyToken);

// Get all stores
router.get('/', storeController.getAllStores);
// Get a single store by ID
router.get('/:id', storeController.getStoreById);
// Create a new store
router.post('/', storeController.createStore);
// Update a store
router.put('/:id', storeController.updateStore);
// Delete a store
router.delete('/:id', storeController.deleteStore);

module.exports = router; 