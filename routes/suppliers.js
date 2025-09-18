const express = require('express');
const multer = require('multer');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

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
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  }
});

// Get all suppliers (user-specific)
const { verifyToken } = require('../middleware/auth');
router.get('/', verifyToken, async (req, res) => {
  try {
    const suppliers = await supplierController.getAllSuppliers(req.user.id);
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch suppliers' });
  }
});

// Add a new supplier (user-specific)
router.post('/', verifyToken, async (req, res) => {
  try {
    const result = await supplierController.insertSupplier({ ...req.body, userId: req.user.id });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to add supplier' });
  }
});

// Update a supplier (user-specific)
router.put('/:supplier_no', verifyToken, async (req, res) => {
  try {
    const result = await supplierController.updateSupplier(req.params.supplier_no, req.body, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update supplier' });
  }
});

// Delete a supplier (user-specific)
router.delete('/:supplier_no', verifyToken, async (req, res) => {
  try {
    const result = await supplierController.deleteSupplier(req.params.supplier_no, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to delete supplier' });
  }
});

// Download supplier import template
router.get('/import/template', verifyToken, supplierController.downloadSupplierTemplate);

// Import suppliers from Excel/CSV file
router.post('/import', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const result = await supplierController.importSuppliers(req.file, { userId: req.user.id });
    res.json({
      success: true,
      data: {
        ...result,
        message: result.message || 'Import completed successfully',
        hasErrors: result.errors && result.errors.length > 0
      }
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process the file',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 