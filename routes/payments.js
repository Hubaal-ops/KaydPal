const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Get all payments in
router.get('/', paymentController.getAllPayments);

// Get payment in by ID
router.get('/:id', paymentController.getPaymentById);

// Create new payment in
router.post('/', paymentController.createPayment);

// Update payment in
router.put('/:id', paymentController.updatePayment);

// Delete payment in
router.delete('/:id', paymentController.deletePayment);

module.exports = router; 