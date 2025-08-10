const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { verifyToken } = require('../middleware/auth');

// Get all withdrawals
router.get('/', verifyToken, withdrawalController.getAllWithdrawals);

// Get withdrawal by ID
router.get('/:id', verifyToken, withdrawalController.getWithdrawalById);

// Create new withdrawal
router.post('/', verifyToken, withdrawalController.createWithdrawal);

// Update withdrawal
router.put('/:id', verifyToken, withdrawalController.updateWithdrawal);

// Delete withdrawal
router.delete('/:id', verifyToken, withdrawalController.deleteWithdrawal);

module.exports = router; 