const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { verifyToken } = require('../middleware/auth');

// Get all transfers
router.get('/', verifyToken, transferController.getAllTransfers);

// Get transfer by ID
router.get('/:id', verifyToken, transferController.getTransferById);

// Create new transfer
router.post('/', verifyToken, transferController.createTransfer);

// Update transfer
router.put('/:id', verifyToken, transferController.updateTransfer);

// Delete transfer
router.delete('/:id', verifyToken, transferController.deleteTransfer);

module.exports = router; 