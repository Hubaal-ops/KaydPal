const express = require('express');
const router = express.Router();
const expenseCategoryController = require('../controllers/expenseCategoryController');

// Get all expense categories
router.get('/', expenseCategoryController.getAllExpenseCategories);

// Get expense category by ID
router.get('/:id', expenseCategoryController.getExpenseCategoryById);

// Create new expense category
router.post('/', expenseCategoryController.createExpenseCategory);

// Update expense category
router.put('/:id', expenseCategoryController.updateExpenseCategory);

// Delete expense category
router.delete('/:id', expenseCategoryController.deleteExpenseCategory);

module.exports = router; 