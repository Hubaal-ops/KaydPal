const express = require('express');
const router = express.Router();
const { insertStockTransfer, getAllStockTransfers, exportStockTransfers, importStockTransfers, downloadTemplate } = require('../controllers/stockTransferController');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

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

// Export stock transfers to Excel
router.get('/export', verifyToken, exportStockTransfers);

// Import stock transfers from Excel
router.post('/import', verifyToken, upload.single('file'), importStockTransfers);

// Download template for stock transfers
router.get('/template', verifyToken, downloadTemplate);

module.exports = router;