const express = require('express');
const router = express.Router();

const salesController = require('../controllers/salesController');
const { verifyToken } = require('../middleware/auth');

// Get all sales (user-specific)
router.get('/', verifyToken, salesController.getAllSalesRoute);

// Get single sale by sale_no or sel_no (user-specific)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const Sale = require('../models/Sale');
    let sale;
    
    // Try to find by sale_no first
    sale = await Sale.findOne({ sale_no: req.params.id, userId: req.user.id });
    
    // If not found, try by sel_no for backward compatibility
    if (!sale) {
      const sel_no = parseInt(req.params.id.replace('SAL-', ''));
      if (!isNaN(sel_no)) {
        sale = await Sale.findOne({ sel_no, userId: req.user.id });
      }
    }
    
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create a new sale (user-specific)
router.post('/', verifyToken, async (req, res) => {
  try {
    const result = await salesController.insertSale(req.body, req.user.id);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update a sale (user-specific) - supports status changes and cancellation
router.put('/:sale_no', verifyToken, async (req, res) => {
  try {
    const result = await salesController.updateSale(req.params.sale_no, req.body, req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Cancel a sale (convenience route for status update)
router.patch('/:sale_no/cancel', verifyToken, async (req, res) => {
  try {
    const result = await salesController.updateSale(req.params.sale_no, { status: 'cancelled' }, req.user.id);
    res.json({ success: true, message: 'Sale cancelled successfully', ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Confirm a sale (convenience route for status update)
router.patch('/:sale_no/confirm', verifyToken, async (req, res) => {
  try {
    const result = await salesController.updateSale(req.params.sale_no, { status: 'confirmed' }, req.user.id);
    res.json({ success: true, message: 'Sale confirmed successfully', ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Mark sale as delivered (convenience route for status update)
router.patch('/:sale_no/deliver', verifyToken, async (req, res) => {
  try {
    const updateData = { status: 'delivered' };
    if (req.body.delivery_date) {
      updateData.delivery_date = req.body.delivery_date;
    }
    const result = await salesController.updateSale(req.params.sale_no, updateData, req.user.id);
    res.json({ success: true, message: 'Sale marked as delivered successfully', ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete a sale (user-specific)
router.delete('/:sale_no', verifyToken, async (req, res) => {
  try {
    const result = await salesController.deleteSale(req.params.sale_no, req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router; 