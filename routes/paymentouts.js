const express = require('express');
const router = express.Router();
const paymentOutController = require('../controllers/paymentOutController');

// Get all payment outs
router.get('/', paymentOutController.getAllPaymentsOut);

// Get payment out by ID
router.get('/:id', paymentOutController.getPaymentOutById);

// Create new payment out
router.post('/', paymentOutController.createPaymentOut);

// Update payment out
router.put('/:id', paymentOutController.updatePaymentOut);

// Delete payment out
router.delete('/:id', paymentOutController.deletePaymentOut);

module.exports = router; 