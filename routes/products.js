const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { 
  insertProduct, 
  getAllProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  exportProducts,
  importProducts,
  downloadTemplate
} = require('../controllers/productController');
const { verifyToken } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.memoryStorage();

// Define allowed file types and their MIME types
const allowedFileTypes = {
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls': 'application/vnd.ms-excel'
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
      return cb(new Error('Invalid file type. Only Excel (.xls, .xlsx) files are allowed.'));
    }
    
    // Check MIME type
    const mimeType = file.mimetype;
    const isValidMimeType = allowedFileTypes[ext] === mimeType;
    
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

// Get all products (user-specific)
router.get('/', verifyToken, async (req, res) => {
  try {
    const products = await getAllProducts(req.user.id);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single product (user-specific)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const product = await getProductById(req.params.id, req.user.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create product (user-specific)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (!req.body.product_name) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }
    const result = await insertProduct({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update product (user-specific)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const result = await updateProduct(req.params.id, req.body, req.user.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete product (user-specific)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await deleteProduct(req.params.id, req.user.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export products to Excel
router.get('/export/excel', verifyToken, exportProducts);

// Download product import template
router.get('/template/download', verifyToken, downloadTemplate);

// Import products from Excel
router.post(
  '/import/excel',
  verifyToken,
  upload.single('file'),
  handleUploadError,
  importProducts
);

module.exports = router;