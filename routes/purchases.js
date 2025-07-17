const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

// Get all purchases
router.get('/', async (req, res) => {
  try {
    const purchases = await purchaseController.getAllPurchases();
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch purchases' });
  }
});

// Add a new purchase
router.post('/', async (req, res) => {
  try {
    const result = await purchaseController.insertPurchase(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to add purchase' });
  }
});

// Update a purchase
router.put('/:purchase_no', async (req, res) => {
  try {
    const result = await purchaseController.updatePurchase(req.params.purchase_no, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update purchase' });
  }
});

// Delete a purchase
router.delete('/:purchase_no', async (req, res) => {
  try {
    const result = await purchaseController.deletePurchase(req.params.purchase_no);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to delete purchase' });
  }
});

module.exports = router; 