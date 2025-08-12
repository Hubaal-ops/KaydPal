const express = require('express');
const router = express.Router();
const purchaseReturnController = require('../controllers/purchaseReturnController');
const { verifyToken } = require('../middleware/auth');

// Get all purchase returns
router.get('/', verifyToken, purchaseReturnController.getAllPurchaseReturns);

// Create a new purchase return
router.post('/', verifyToken, purchaseReturnController.createPurchaseReturn);

// Update a purchase return
router.put('/:id', verifyToken, purchaseReturnController.updatePurchaseReturn);

// Delete a purchase return
router.delete('/:id', verifyToken, purchaseReturnController.deletePurchaseReturn);

module.exports = router; 