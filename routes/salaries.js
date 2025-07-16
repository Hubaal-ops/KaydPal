const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');

// Get all salaries
router.get('/', salaryController.getAllSalaries);

// Get salary by ID
router.get('/:id', salaryController.getSalaryById);

// Create new salary
router.post('/', salaryController.createSalary);

// Update salary
router.put('/:id', salaryController.updateSalary);

// Delete salary
router.delete('/:id', salaryController.deleteSalary);

module.exports = router; 