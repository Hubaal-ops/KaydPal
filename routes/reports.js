
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');

// Stock Valuation Report
router.get('/stock-valuation', verifyToken, reportController.stockValuationReport);

// Top/Bottom Products
router.get('/top-products', verifyToken, reportController.topProductsReport);

// Generate a report with filters (date, product, category, etc.)
router.get('/:type', verifyToken, reportController.generateReport);

module.exports = router;
