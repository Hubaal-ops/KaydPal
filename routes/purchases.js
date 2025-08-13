const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { verifyToken } = require('../middleware/auth');

// Get all purchases
router.get('/', verifyToken, async (req, res) => {
  try {
    const purchases = await purchaseController.getAllPurchases(req.user.id);
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch purchases' });
  }
});

// Add a new purchase
router.post('/', verifyToken, async (req, res) => {
  try {
    // Validate account_id before calling controller
    if (!req.body.account_id || isNaN(Number(req.body.account_id))) {
      return res.status(400).json({ message: 'Please select a valid account before submitting the purchase.' });
    }
    const result = await purchaseController.insertPurchase(req.body, req.user.id);
    res.status(201).json(result);
  } catch (err) {
    // Friendly error for missing account
    if (err.message && err.message.includes('Account not found')) {
      return res.status(400).json({ message: 'The selected account does not exist. Please choose a valid account.' });
    }
    res.status(400).json({ message: err.message || 'Failed to add purchase' });
  }
});

// Update a purchase
router.put('/:purchase_no', verifyToken, async (req, res) => {
  try {
    const result = await purchaseController.updatePurchase(req.params.purchase_no, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update purchase' });
  }
});

// Delete a purchase
router.delete('/:purchase_no', verifyToken, async (req, res) => {
  try {
    const result = await purchaseController.deletePurchase(req.params.purchase_no);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to delete purchase' });
  }
});

module.exports = router; 