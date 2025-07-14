const express = require('express');
const router = express.Router();
const { 
  insertCategory, 
  getAllCategories, 
  getCategoryById, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categoryController');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await getCategoryById(parseInt(req.params.id));
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
    const result = await insertCategory(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const result = await updateCategory(parseInt(req.params.id), req.body);
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
    const result = await deleteCategory(parseInt(req.params.id));
    if (!result) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
