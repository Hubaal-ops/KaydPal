const express = require('express');
const router = express.Router();
const { insertStockTransfer, getAllStockTransfers } = require('../controllers/stockTransferController');

// POST /api/stock-transfers
router.post('/', async (req, res) => {
  try {
    const result = await insertStockTransfer(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/stock-transfers
router.get('/', async (req, res) => {
  try {
    const transfers = await getAllStockTransfers();
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 