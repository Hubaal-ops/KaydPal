
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/auth');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Product = require('../models/Product');

// GET /api/analytics
router.get('/', verifyToken, analyticsController.getAnalytics);

// GET /api/analytics/summary
router.get('/summary', verifyToken, async (req, res) => {
  try {
    // Total sales
    const userId = req.user && req.user.userId ? req.user.userId : req.user && req.user._id ? req.user._id : undefined;
    const matchStage = userId ? [{ $match: { userId } }] : [];
    const totalSales = await Sale.aggregate([
      ...matchStage,
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    // Total expenses
    const totalExpenses = await Expense.aggregate([
      ...matchStage,
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    // Top 5 products by sales quantity
    const topProducts = await Sale.aggregate([
      ...matchStage,
      { $unwind: '$items' },
      { $group: { _id: '$items.product', quantity: { $sum: '$items.quantity' } } },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { _id: 0, name: '$product.name', quantity: 1 } }
    ]);
    res.json({
      success: true,
      data: {
        totalSales: totalSales[0]?.total || 0,
        totalExpenses: totalExpenses[0]?.total || 0,
        topProducts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: err.message });
  }
});

// Add more analytics endpoints as needed

module.exports = router;
