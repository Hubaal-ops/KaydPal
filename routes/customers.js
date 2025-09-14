const express = require('express');
const multer = require('multer');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.ms-excel' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'text/csv' ||
        file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  }
});

// Get all customers (user-specific)
const { verifyToken } = require('../middleware/auth');
router.get('/', verifyToken, async (req, res) => {
  try {
    const customers = await customerController.getAllCustomers(req.user.id);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch customers' });
  }
});

// Add a new customer (user-specific)
router.post('/', verifyToken, async (req, res) => {
  try {
    const result = await customerController.insertCustomer({ ...req.body, userId: req.user.id });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to add customer' });
  }
});

// Update a customer (user-specific)
router.put('/:customer_no', verifyToken, async (req, res) => {
  try {
    const result = await customerController.updateCustomer(req.params.customer_no, req.body, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update customer' });
  }
});

// Delete a customer (user-specific)
router.delete('/:customer_no', verifyToken, async (req, res) => {
  try {
    const result = await customerController.deleteCustomer(req.params.customer_no, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to delete customer' });
  }
});

// Import customers from Excel
router.post('/import', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const result = await customerController.importCustomers(req.file, req.user.id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to process import' 
    });
  }
});

// Download template
router.get('/template', verifyToken, async (req, res) => {
  try {
    // Create a sample workbook
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    
    // Sample data for the template
    const templateData = [
      ['name', 'email', 'phone', 'address', 'balance'],
      ['John Doe', 'john@example.com', '1234567890', '123 Main St', 0],
      ['Jane Smith', 'jane@example.com', '0987654321', '456 Oak Ave', 100]
    ];
    
    // Convert data to worksheet
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Customers Template');
    
    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customer_import_template.xlsx');
    
    // Send the file
    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

module.exports = router; 