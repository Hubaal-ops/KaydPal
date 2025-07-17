const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// Get all sales
router.get('/', salesController.getAllSales);

// Create a new sale
router.post('/', async (req, res) => {
  try {
    const result = await salesController.insertSale(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a sale
router.put('/:sel_no', async (req, res) => {
  try {
    const result = await salesController.updateSale(parseInt(req.params.sel_no), req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a sale
router.delete('/:sel_no', async (req, res) => {
  try {
    const result = await salesController.deleteSale(parseInt(req.params.sel_no));
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 