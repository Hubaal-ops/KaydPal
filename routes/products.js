const express = require('express');
const router = express.Router();

const { 
  insertProduct, 
  getAllProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct 
} = require('../controllers/productController');
const { verifyToken } = require('../middleware/auth');

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

module.exports = router;
