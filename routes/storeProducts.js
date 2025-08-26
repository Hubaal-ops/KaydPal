const express = require('express');
const router = express.Router();
const storeProductController = require('../controllers/storeProductController');
const { verifyToken } = require('../middleware/auth');

// Get all store products
router.get('/', verifyToken, storeProductController.getAllStoreProducts);

// Get a single store product by ID
router.get('/:id', verifyToken, storeProductController.getStoreProductById);

// Create a new store product
router.post('/', verifyToken, storeProductController.createStoreProduct);

// Update a store product
router.put('/:id', verifyToken, storeProductController.updateStoreProduct);

// Delete a store product
router.delete('/:id', verifyToken, storeProductController.deleteStoreProduct);

module.exports = router; 