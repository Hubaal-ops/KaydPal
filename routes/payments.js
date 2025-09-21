const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.memoryStorage();

// Define allowed file types and their MIME types
const allowedFileTypes = {
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls': 'application/vnd.ms-excel',
  'csv': ['text/csv', 'application/csv', 'text/plain']
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    
    // Check if file extension is allowed
    if (!allowedFileTypes[ext]) {
      return cb(new Error('Invalid file type. Only Excel (.xls, .xlsx) and CSV files are allowed.'));
    }
    
    // Check MIME type
    const mimeType = file.mimetype;
    const isValidMimeType = allowedFileTypes[ext] === mimeType || 
                           (Array.isArray(allowedFileTypes[ext]) && 
                            allowedFileTypes[ext].includes(mimeType));
    
    if (isValidMimeType) {
      return cb(null, true);
    } else {
      return cb(new Error(`Invalid file type for .${ext}. Expected MIME type: ${allowedFileTypes[ext]}, got: ${mimeType}`));
    }
  }
});

// Error handling middleware for file uploads
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 5MB.',
        code: 'FILE_TOO_LARGE'
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
      code: 'UPLOAD_ERROR'
    });
  } else if (err) {
    // An unknown error occurred
    return res.status(400).json({
      success: false,
      error: err.message || 'Error uploading file',
      code: 'UPLOAD_ERROR'
    });
  }
  next();
};

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

// Export payments to Excel
router.get('/export/excel', verifyToken, paymentController.exportPayments);

// Download payment import template
router.get('/template/download', verifyToken, paymentController.downloadTemplate);

// Import payments from Excel
router.post(
  '/import/excel',
  verifyToken,
  upload.single('file'),
  handleUploadError,
  paymentController.importPayments
);

module.exports = router;