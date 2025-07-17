const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await customerController.getAllCustomers();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch customers' });
  }
});

// Add a new customer
router.post('/', async (req, res) => {
  try {
    const result = await customerController.insertCustomer(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to add customer' });
  }
});

// Update a customer
router.put('/:customer_no', async (req, res) => {
  try {
    const result = await customerController.updateCustomer(req.params.customer_no, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update customer' });
  }
});

// Delete a customer
router.delete('/:customer_no', async (req, res) => {
  try {
    const result = await customerController.deleteCustomer(req.params.customer_no);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to delete customer' });
  }
});

module.exports = router; 