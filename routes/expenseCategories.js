const express = require('express');
const router = express.Router();
const multer = require('multer');
const expenseCategoryController = require('../controllers/expenseCategoryController');
const { verifyToken } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // List of valid MIME types for Excel files
    const validMimeTypes = [
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12', // .xlsb
      'application/octet-stream', // Some Excel files might report this
      'application/zip' // Some Excel files might report this
    ];
    
    // Check file extension
    const validExtensions = ['.xlsx', '.xls', '.xlsm', '.xlsb', '.csv'];
    const fileExt = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
    
    // Check both MIME type and file extension for better compatibility
    const isMimeTypeValid = validMimeTypes.some(type => 
      file.mimetype.toLowerCase().includes(type.toLowerCase())
    );
    
    const isExtensionValid = validExtensions.includes(fileExt.toLowerCase());
    
    // For debugging
    console.log('File upload validation:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      isMimeTypeValid,
      isExtensionValid,
      fileExt
    });
    
    if (isMimeTypeValid && isExtensionValid) {
      cb(null, true);
    } else {
      console.error('Invalid file type:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        allowedMimeTypes: validMimeTypes,
        allowedExtensions: validExtensions
      });
      cb(new Error(`Invalid file type. Please upload a valid Excel file (${validExtensions.join(', ')})`));
    }
  }
});

// Get all expense categories
router.get('/', verifyToken, expenseCategoryController.getAllExpenseCategories);

// Get expense category by ID
router.get('/:id', verifyToken, expenseCategoryController.getExpenseCategoryById);

// Create new expense category
router.post('/', verifyToken, expenseCategoryController.createExpenseCategory);

// Update expense category
router.put('/:id', verifyToken, expenseCategoryController.updateExpenseCategory);

// Delete expense category
router.delete('/:id', verifyToken, expenseCategoryController.deleteExpenseCategory);

// Export categories to Excel
router.get('/export/excel', verifyToken, (req, res, next) => {
  console.log('Export route hit');
  expenseCategoryController.exportCategories(req, res).catch(err => {
    console.error('Export error:', err);
    res.status(500).json({ 
      error: 'Failed to export categories',
      details: err.message 
    });
  });
});

// Import categories from Excel
router.post('/import/excel', 
  verifyToken, 
  (req, res, next) => {
    upload.single('file')(req, res, function(err) {
      if (err) {
        console.error('File upload validation error:', {
          error: err.message,
          stack: err.stack,
          originalError: err.originalError
        });
        
        // Handle different types of errors
        let statusCode = 400;
        let errorMessage = err.message || 'Error processing file';
        let errorCode = 'FILE_UPLOAD_ERROR';
        
        // Handle file size errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          statusCode = 413; // Payload Too Large
          errorMessage = 'File size exceeds the maximum limit of 5MB';
          errorCode = 'FILE_TOO_LARGE';
        }
        // Handle file type errors
        else if (err.message && err.message.includes('Invalid file type')) {
          errorCode = 'INVALID_FILE_TYPE';
        }
        
        return res.status(statusCode).json({ 
          success: false,
          error: errorMessage,
          code: errorCode,
          details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
      }
      
      if (!req.file) {
        console.error('No file was uploaded');
        return res.status(400).json({ 
          success: false,
          error: 'No file was uploaded',
          code: 'NO_FILE_UPLOADED'
        });
      }
      
      console.log('File upload successful:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      
      next();
    });
  },
  // Error handling middleware for the controller
  (req, res, next) => {
    expenseCategoryController.importCategories(req, res).catch(err => {
      console.error('Error in import controller:', {
        error: err.message,
        stack: err.stack,
        originalError: err.originalError
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to process the Excel file',
        code: 'PROCESSING_ERROR',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });
  }
);

module.exports = router;