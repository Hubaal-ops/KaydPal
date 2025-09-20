const express = require('express');
const multer = require('multer');
const router = express.Router();
const transferController = require('../controllers/transferController');
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

// Download transfer import template
router.get('/import/template', verifyToken, transferController.downloadTransferTemplate);

// Import transfers from file
router.post('/import', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Add user ID to the file object for the controller
    req.file.userId = req.user.id;
    
    const result = await transferController.importTransfers(req.file);
    
    if (result.errors && result.errors.length > 0) {
      return res.status(207).json({
        message: `${result.success} of ${result.total} transfers imported successfully`,
        details: result
      });
    }
    
    res.json({
      message: `Successfully imported ${result.success} transfers`,
      details: result
    });
  } catch (error) {
    console.error('Error importing transfers:', error);
    res.status(500).json({ 
      error: 'Failed to import transfers',
      details: error.message 
    });
  }
});

// Export transfers to file
router.get('/export/:format?', verifyToken, async (req, res) => {
  try {
    const format = req.params.format || 'xlsx';
    if (!['xlsx', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Invalid export format. Use xlsx or csv' });
    }

    const { buffer, contentType, extension } = await transferController.exportTransfers(req.user.id, format);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=transfers_${new Date().toISOString().split('T')[0]}.${extension}`);
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting transfers:', error);
    res.status(500).json({ 
      error: 'Failed to export transfers',
      details: error.message 
    });
  }
});

module.exports = router;