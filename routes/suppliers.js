const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

// Get all suppliers (user-specific)
const { verifyToken } = require('../middleware/auth');
router.get('/', verifyToken, async (req, res) => {
  try {
    const suppliers = await supplierController.getAllSuppliers(req.user.id);
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch suppliers' });
  }
});

// Add a new supplier (user-specific)
router.post('/', verifyToken, async (req, res) => {
  try {
    const result = await supplierController.insertSupplier({ ...req.body, userId: req.user.id });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to add supplier' });
  }
});

// Update a supplier (user-specific)
router.put('/:supplier_no', verifyToken, async (req, res) => {
  try {
    const result = await supplierController.updateSupplier(req.params.supplier_no, req.body, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update supplier' });
  }
});

// Delete a supplier (user-specific)
router.delete('/:supplier_no', verifyToken, async (req, res) => {
  try {
    const result = await supplierController.deleteSupplier(req.params.supplier_no, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to delete supplier' });
  }
});

module.exports = router; 