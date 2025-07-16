const express = require('express');
const router = express.Router();
const depositController = require('../controllers/depositController');

// Get all deposits
router.get('/', depositController.getAllDeposits);

// Get deposit by ID
router.get('/:id', depositController.getDepositById);

// Create new deposit
router.post('/', depositController.createDeposit);

// Update deposit
router.put('/:id', depositController.updateDeposit);

// Delete deposit
router.delete('/:id', depositController.deleteDeposit);

module.exports = router; 