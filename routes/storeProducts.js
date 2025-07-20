const express = require('express');
const router = express.Router();
const storeProductController = require('../controllers/storeProductController');

// Get all store products
router.get('/', storeProductController.getAllStoreProducts);

// Get a single store product by ID
router.get('/:id', storeProductController.getStoreProductById);

// Create a new store product
router.post('/', storeProductController.createStoreProduct);

// Update a store product
router.put('/:id', storeProductController.updateStoreProduct);

// Delete a store product
router.delete('/:id', storeProductController.deleteStoreProduct);

module.exports = router; 