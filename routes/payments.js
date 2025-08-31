const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

// Get all payments in
router.get('/', verifyToken, paymentController.getAllPayments);

// Get payment in by ID
router.get('/:id', verifyToken, paymentController.getPaymentById);

// Create new payment in
router.post('/', verifyToken, paymentController.createPayment);

// Update payment in
router.put('/:id', verifyToken, paymentController.updatePayment);

// Delete payment in
router.delete('/:id', verifyToken, paymentController.deletePayment);

// Generate receipt for a payment
router.get('/:id/receipt', verifyToken, paymentController.generateReceipt);

// Get receipt data for frontend
router.get('/:id/receipt-data', verifyToken, paymentController.getReceiptData);

module.exports = router; 