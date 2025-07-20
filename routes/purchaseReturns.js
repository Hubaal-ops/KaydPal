const express = require('express');
const router = express.Router();
const purchaseReturnController = require('../controllers/purchaseReturnController');

// Get all purchase returns
router.get('/', purchaseReturnController.getAllPurchaseReturns);

// Create a new purchase return
router.post('/', purchaseReturnController.createPurchaseReturn);

// Update a purchase return
router.put('/:id', purchaseReturnController.updatePurchaseReturn);

// Delete a purchase return
router.delete('/:id', purchaseReturnController.deletePurchaseReturn);

module.exports = router; 