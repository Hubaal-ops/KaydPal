const express = require('express');
const router = express.Router();
const salesReturnController = require('../controllers/salesReturnController');

// Get all sales returns
router.get('/', salesReturnController.getAllSalesReturns);

// Create a new sales return
router.post('/', salesReturnController.createSalesReturn);

// Update a sales return
router.put('/:id', salesReturnController.updateSalesReturn);

// Delete a sales return
router.delete('/:id', salesReturnController.deleteSalesReturn);

module.exports = router; 