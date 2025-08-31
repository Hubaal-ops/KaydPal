const express = require('express');
const router = express.Router();
const paymentOutController = require('../controllers/paymentOutController');
const { verifyToken } = require('../middleware/auth');

// Get all payment outs
router.get('/', verifyToken, paymentOutController.getAllPaymentsOut);

// Get payment out by ID
router.get('/:id', verifyToken, paymentOutController.getPaymentOutById);

// Create new payment out
router.post('/', verifyToken, paymentOutController.createPaymentOut);

// Update payment out
router.put('/:id', verifyToken, paymentOutController.updatePaymentOut);

// Delete payment out
router.delete('/:id', verifyToken, paymentOutController.deletePaymentOut);

module.exports = router; 