const express = require('express');
const router = express.Router();

const expenseController = require('../controllers/expenseController');
const { verifyToken } = require('../middleware/auth');

// Get all expenses (user-specific)
router.get('/', verifyToken, expenseController.getAllExpenses);

// Get expense by ID (user-specific)
router.get('/:id', verifyToken, expenseController.getExpenseById);

// Create new expense (user-specific)
router.post('/', verifyToken, expenseController.createExpense);

// Update expense (user-specific)
router.put('/:id', verifyToken, expenseController.updateExpense);

// Delete expense (user-specific)
router.delete('/:id', verifyToken, expenseController.deleteExpense);

module.exports = router; 