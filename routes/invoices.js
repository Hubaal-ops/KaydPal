const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, invoiceController.createInvoice);
router.get('/', verifyToken, invoiceController.getAllInvoices);
router.get('/:id', verifyToken, invoiceController.getInvoiceById);
router.put('/:id', verifyToken, invoiceController.updateInvoice);
router.delete('/:id', verifyToken, invoiceController.deleteInvoice);

module.exports = router; 