const express = require('express');
const router = express.Router();

const accountController = require('../controllers/accountController');
const { verifyToken } = require('../middleware/auth');

// Get all accounts (user-specific)
router.get('/', verifyToken, accountController.getAllAccounts);

// Get account by ID (user-specific)
router.get('/:id', verifyToken, accountController.getAccountById);

// Create new account (user-specific)
router.post('/', verifyToken, accountController.createAccount);

// Update account (user-specific)
router.put('/:id', verifyToken, accountController.updateAccount);

// Delete account (user-specific)
router.delete('/:id', verifyToken, accountController.deleteAccount);

module.exports = router; 