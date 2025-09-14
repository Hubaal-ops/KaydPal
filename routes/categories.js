const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
router.use(verifyToken);
const { 
  insertCategory, 
  getAllCategories, 
  getCategoryById, 
  updateCategory, 
  deleteCategory,
  importCategories
} = require('../controllers/categoryController');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await getAllCategories({ userId: req.user.id });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await getCategoryById(parseInt(req.params.id), { userId: req.user.id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create category
router.post('/', async (req, res) => {
  try {
    if (!req.body.category_name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const result = await insertCategory({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const result = await updateCategory(parseInt(req.params.id), { ...req.body, userId: req.user.id });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteCategory(parseInt(req.params.id), { userId: req.user.id });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Import categories from Excel
router.post('/import', async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Pass the file buffer to the controller
    const result = await importCategories(req.file, { userId: req.user.id });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;