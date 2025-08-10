const express = require('express');
const router = express.Router();
const depositController = require('../controllers/depositController');
const { verifyToken } = require('../middleware/auth');

// Get all deposits
router.get('/', verifyToken, depositController.getAllDeposits);

// Get deposit by ID
router.get('/:id', verifyToken, depositController.getDepositById);

// Create new deposit
router.post('/', verifyToken, depositController.createDeposit);

// Update deposit
router.put('/:id', verifyToken, depositController.updateDeposit);

// Delete deposit
router.delete('/:id', verifyToken, depositController.deleteDeposit);

module.exports = router; 