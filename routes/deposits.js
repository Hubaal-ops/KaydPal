const express = require('express');
const multer = require('multer');
const router = express.Router();
const depositController = require('../controllers/depositController');
const { verifyToken } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'text/csv' ||
      file.originalname.match(/\.(xlsx|xls|csv)$/i)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'));
    }
  }
});

// Get all deposits
router.get('/', verifyToken, depositController.getAllDeposits);

// Get deposit by ID
router.get('/:id', verifyToken, depositController.getDepositById);

// Create new deposit
router.post('/', verifyToken, depositController.createDeposit);

// Update deposit
router.put('/:id', verifyToken, depositController.updateDeposit);

// Delete deposit
router.delete('/:id', verifyToken, depositController.deleteDeposit);

// Download deposit import template
router.get('/import/template', verifyToken, depositController.downloadDepositTemplate);

// Import deposits from file
router.post('/import', verifyToken, upload.single('file'), async (req, res) => {
  console.log('Import request received');
  
  try {
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded. Please select a file to import.' 
      });
    }
    
    console.log('Processing file:', req.file.originalname);
    
    try {
      const result = await depositController.importDeposits(req.file, { 
        userId: req.user.id 
      });
      
      console.log('Import completed successfully:', {
        importedCount: result.importedCount,
        errorCount: result.errors ? result.errors.length : 0
      });
      
      const response = {
        success: true,
        data: {
          importedCount: result.importedCount || 0,
          skippedCount: result.skippedCount || 0,
          totalCount: (result.importedCount || 0) + (result.skippedCount || 0),
          errors: result.errors || [],
          hasErrors: result.errors && result.errors.length > 0,
          message: result.message || 'Import completed successfully'
        }
      };
      
      if (response.data.importedCount === 0 && response.data.errors.length === 0) {
        response.data.message = 'No valid deposits found in the file. Please check the file format and try again.';
      } else if (response.data.importedCount === 0 && response.data.errors.length > 0) {
        response.data.message = 'Import completed with errors. No valid deposits were imported.';
      }
      
      res.json(response);
      
    } catch (importError) {
      console.error('Import processing error:', importError);
      throw importError; // Let the outer catch handle it
    }
    
  } catch (error) {
    console.error('Import route error:', error);
    
    // Handle specific error types
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    
    if (error.message.includes('file format') || error.message.includes('invalid')) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid file format. Please upload a valid Excel or CSV file.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while processing the file',
      ...(process.env.NODE_ENV === 'development' && { error: error.stack })
    });
  }
});

// Export deposits
router.get('/export/:format?', verifyToken, async (req, res) => {
  try {
    const format = (req.params.format || 'xlsx').toLowerCase();
    if (!['xlsx', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Invalid export format. Use xlsx or csv.' });
    }
    
    const { buffer, mimeType, fileExtension } = await depositController.exportDeposits(req.user.id, format);
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename=deposits_${new Date().toISOString().split('T')[0]}.${fileExtension}`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message || 'Failed to export deposits' });
  }
});

module.exports = router;