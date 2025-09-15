const express = require('express');
const multer = require('multer');

const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const storeController = require('../controllers/storeController');

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

router.use(verifyToken);

// Get all stores
router.get('/', storeController.getAllStores);

// Download store import template
router.get('/template', storeController.downloadTemplate);

// Get a single store by ID
router.get('/:id', storeController.getStoreById);

// Create a new store
router.post('/', storeController.createStore);

// Import stores from Excel
router.post('/import', upload.single('file'), storeController.importStores);

// Update a store
router.put('/:id', storeController.updateStore);

// Delete a store
router.delete('/:id', storeController.deleteStore);

module.exports = router;