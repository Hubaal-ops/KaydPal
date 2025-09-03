const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');

// Advanced Sales Report (Enterprise-level)
router.get('/sales/advanced', verifyToken, reportController.generateAdvancedSalesReport);

// Advanced Purchase Report (Enterprise-level)
router.get('/purchases/advanced', verifyToken, reportController.generateAdvancedPurchaseReport);

// Advanced Inventory Report (Enterprise-level)
router.get('/inventory/advanced', verifyToken, reportController.generateAdvancedInventoryReport);

// Advanced Financial Report (Enterprise-level)
router.get('/financial/advanced', verifyToken, reportController.generateAdvancedFinancialReport);

// Sales Analytics Dashboard
router.get('/sales/analytics', verifyToken, reportController.getSalesAnalytics);

// Sales Export
router.get('/sales/export', verifyToken, reportController.exportSalesReport);

// Sales Forecasting
router.get('/sales/forecast', verifyToken, reportController.getSalesForecasting);

// Stock Valuation Report
router.get('/stock-valuation', verifyToken, reportController.stockValuationReport);

// Top/Bottom Products
router.get('/top-products', verifyToken, reportController.topProductsReport);

// Generate a report with filters (date, product, category, etc.)
router.get('/:type', verifyToken, reportController.generateReport);

module.exports = router;