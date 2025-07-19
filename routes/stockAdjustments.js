const express = require('express');
const router = express.Router();
const { insertStockAdjustment, getAllStockAdjustments } = require('../controllers/stockAdjustmentController');
// const auth = require('../middleware/auth'); // Uncomment if you use auth middleware

// Get all stock adjustments
router.get('/', /*auth,*/ async (req, res) => {
  try {
    const adjustments = await getAllStockAdjustments();
    res.json(adjustments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new stock adjustment
router.post('/', /*auth,*/ async (req, res) => {
  try {
    const result = await insertStockAdjustment(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 