const express = require('express');
const router = express.Router();

const salesController = require('../controllers/salesController');
const { verifyToken } = require('../middleware/auth');

// Get all sales (user-specific)
router.get('/', verifyToken, salesController.getAllSales);

// Create a new sale (user-specific)
router.post('/', verifyToken, async (req, res) => {
  try {
    const result = await salesController.insertSale({ ...req.body, userId: req.user.id });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a sale (user-specific)
router.put('/:sel_no', verifyToken, async (req, res) => {
  try {
    const result = await salesController.updateSale(parseInt(req.params.sel_no), req.body, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a sale (user-specific)
router.delete('/:sel_no', verifyToken, async (req, res) => {
  try {
    const result = await salesController.deleteSale(parseInt(req.params.sel_no), req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 