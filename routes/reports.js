const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Generate a report with filters (date, product, category, etc.)
router.get('/:type', reportController.generateReport);

module.exports = router;
