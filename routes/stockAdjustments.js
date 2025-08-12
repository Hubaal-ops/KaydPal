const express = require('express');
const router = express.Router();
const { insertStockAdjustment, getAllStockAdjustments } = require('../controllers/stockAdjustmentController');
const { verifyToken } = require('../middleware/auth');

// Get all stock adjustments (user-specific)
router.get('/', verifyToken, async (req, res) => {
  try {
    const adjustments = await getAllStockAdjustments({ userId: req.user.id });
    res.json(adjustments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new stock adjustment (user-specific)
router.post('/', verifyToken, async (req, res) => {
  try {
    const result = await insertStockAdjustment({ ...req.body, userId: req.user.id });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 