const express = require('express');
const router = express.Router();
const expenseCategoryController = require('../controllers/expenseCategoryController');
const { verifyToken } = require('../middleware/auth');

// Get all expense categories
router.get('/', verifyToken, expenseCategoryController.getAllExpenseCategories);

// Get expense category by ID
router.get('/:id', verifyToken, expenseCategoryController.getExpenseCategoryById);

// Create new expense category
router.post('/', verifyToken, expenseCategoryController.createExpenseCategory);

// Update expense category
router.put('/:id', verifyToken, expenseCategoryController.updateExpenseCategory);

// Delete expense category
router.delete('/:id', verifyToken, expenseCategoryController.deleteExpenseCategory);

module.exports = router; 