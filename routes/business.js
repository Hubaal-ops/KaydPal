const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { verifyToken } = require('../middleware/auth');

// Get business information
router.get('/', verifyToken, businessController.getBusinessInfo);

// Create business information
router.post('/', verifyToken, businessController.createBusinessInfo);

// Update business information
router.put('/', verifyToken, businessController.updateBusinessInfo);

module.exports = router;