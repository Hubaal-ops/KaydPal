const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');

// Get all withdrawals
router.get('/', withdrawalController.getAllWithdrawals);

// Get withdrawal by ID
router.get('/:id', withdrawalController.getWithdrawalById);

// Create new withdrawal
router.post('/', withdrawalController.createWithdrawal);

// Update withdrawal
router.put('/:id', withdrawalController.updateWithdrawal);

// Delete withdrawal
router.delete('/:id', withdrawalController.deleteWithdrawal);

module.exports = router; 