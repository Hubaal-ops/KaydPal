const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Get all customers (user-specific)
const { verifyToken } = require('../middleware/auth');
router.get('/', verifyToken, async (req, res) => {
  try {
    const customers = await customerController.getAllCustomers(req.user.id);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch customers' });
  }
});

// Add a new customer (user-specific)
router.post('/', verifyToken, async (req, res) => {
  try {
    const result = await customerController.insertCustomer({ ...req.body, userId: req.user.id });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to add customer' });
  }
});

// Update a customer (user-specific)
router.put('/:customer_no', verifyToken, async (req, res) => {
  try {
    const result = await customerController.updateCustomer(req.params.customer_no, req.body, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update customer' });
  }
});

// Delete a customer (user-specific)
router.delete('/:customer_no', verifyToken, async (req, res) => {
  try {
    const result = await customerController.deleteCustomer(req.params.customer_no, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to delete customer' });
  }
});

module.exports = router; 