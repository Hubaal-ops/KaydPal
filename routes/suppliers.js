const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await supplierController.getAllSuppliers();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch suppliers' });
  }
});

// Add a new supplier
router.post('/', async (req, res) => {
  try {
    const result = await supplierController.insertSupplier(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to add supplier' });
  }
});

// Update a supplier
router.put('/:supplier_no', async (req, res) => {
  try {
    const result = await supplierController.updateSupplier(req.params.supplier_no, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update supplier' });
  }
});

// Delete a supplier
router.delete('/:supplier_no', async (req, res) => {
  try {
    const result = await supplierController.deleteSupplier(req.params.supplier_no);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to delete supplier' });
  }
});

module.exports = router; 