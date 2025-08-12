
const express = require('express');
const router = express.Router();
const { insertStockTransfer, getAllStockTransfers } = require('../controllers/stockTransferController');
const { verifyToken } = require('../middleware/auth');


// POST /api/stock-transfers
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await insertStockTransfer({ ...req.body, userId });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/stock-transfers
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const transfers = await getAllStockTransfers({ userId });
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 