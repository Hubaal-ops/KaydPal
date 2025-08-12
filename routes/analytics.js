const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// GET /api/analytics
router.get('/', analyticsController.getAnalytics);

module.exports = router;
