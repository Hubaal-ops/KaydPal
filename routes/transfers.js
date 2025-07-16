const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');

// Get all transfers
router.get('/', transferController.getAllTransfers);

// Get transfer by ID
router.get('/:id', transferController.getTransferById);

// Create new transfer
router.post('/', transferController.createTransfer);

// Update transfer
router.put('/:id', transferController.updateTransfer);

// Delete transfer
router.delete('/:id', transferController.deleteTransfer);

module.exports = router; 