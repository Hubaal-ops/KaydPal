const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { verifyToken } = require('../middleware/auth');

// Get all employees
router.get('/', verifyToken, employeeController.getAllEmployees);

// Get employee by ID
router.get('/:id', verifyToken, employeeController.getEmployeeById);

// Create new employee
router.post('/', verifyToken, employeeController.createEmployee);

// Update employee
router.put('/:id', verifyToken, employeeController.updateEmployee);

// Delete employee
router.delete('/:id', verifyToken, employeeController.deleteEmployee);

module.exports = router; 