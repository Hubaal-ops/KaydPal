const express = require('express');
const router = express.Router();
const salesReturnController = require('../controllers/salesReturnController');
const { verifyToken } = require('../middleware/auth');

// Get all sales returns
router.get('/', verifyToken, salesReturnController.getAllSalesReturns);

// Create a new sales return
router.post('/', verifyToken, salesReturnController.createSalesReturn);

// Update a sales return
router.put('/:id', verifyToken, salesReturnController.updateSalesReturn);

// Delete a sales return
router.delete('/:id', verifyToken, salesReturnController.deleteSalesReturn);

module.exports = router; 