
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
    const userId = req.user && req.user.userId ? req.user.userId : req.user && req.user._id ? req.user._id : undefined;
    const matchStage = userId ? { userId } : {};
    
    // Total sales and revenue
    const salesData = await Sale.aggregate([
      { $match: matchStage },
      { 
        $group: { 
          _id: null, 
          totalSales: { $sum: '$amount' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$amount' }
        } 
      }
    ]);
    
    // Total expenses
    const expenseData = await Expense.aggregate([
      { $match: matchStage },
      { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
    ]);
    
    // Top selling products by quantity
    const topProductsData = await Sale.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      { 
        $group: { 
          _id: '$items.product_no', 
          totalQuantity: { $sum: '$items.qty' },
          totalRevenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } }
        } 
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);
    
    // Get product details for top products
    const productFilter = userId ? { userId } : {};
    const allProducts = await Product.find(productFilter);
    const topProducts = topProductsData.map(item => {
      const product = allProducts.find(p => p.product_no === item._id);
      return {
        name: product?.product_name || `Product ${item._id}`,
        quantity: item.totalQuantity,
        revenue: item.totalRevenue
      };
    });
    
    // Stock analysis
    const StoreProduct = require('../models/StoreProduct');
    const stockData = await StoreProduct.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          lowStockItems: {
            $sum: {
              $cond: [{ $and: [{ $gt: ['$qty', 0] }, { $lte: ['$qty', 10] }] }, 1, 0]
            }
          },
          outOfStockItems: {
            $sum: {
              $cond: [{ $eq: ['$qty', 0] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // Customer analysis
    const Customer = require('../models/Customer');
    const customerData = await Customer.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          newCustomers: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    const sales = salesData[0] || { totalSales: 0, totalOrders: 0, avgOrderValue: 0 };
    const expenses = expenseData[0] || { totalExpenses: 0 };
    const stock = stockData[0] || { lowStockItems: 0, outOfStockItems: 0 };
    const customers = customerData[0] || { totalCustomers: 0, newCustomers: 0 };
    
    res.json({
      success: true,
      data: {
        totalSales: sales.totalSales,
        totalRevenue: sales.totalSales,
        totalOrders: sales.totalOrders,
        avgOrderValue: sales.avgOrderValue || 0,
        totalExpenses: expenses.totalExpenses,
        topSellingProduct: topProducts[0] || { name: '', quantity: 0 },
        topProducts: topProducts,
        lowStockItems: stock.lowStockItems,
        outOfStockItems: stock.outOfStockItems,
        totalCustomers: customers.totalCustomers,
        newCustomers: customers.newCustomers,
        revenueChange: 0 // Could be calculated with historical data
      }
    });
  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch analytics summary', 
      error: err.message 
    });
  }
});

// GET /api/analytics/export
router.get('/export', verifyToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId ? req.user.userId : req.user && req.user._id ? req.user._id : undefined;
    const { startDate, endDate, type = 'full' } = req.query;
    
    // Build filter
    const saleFilter = {};
    if (userId) saleFilter.userId = userId;
    if (startDate && endDate) {
      saleFilter.sel_date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Fetch sales data
    const sales = await Sale.find(saleFilter)
      .populate('customer_no', 'name')
      .sort({ sel_date: -1 });
    
    // Create CSV content
    let csvContent = '';
    
    if (type === 'full' || type === 'sales') {
      csvContent += 'Date,Customer,Amount,Paid,Balance,Items\n';
      sales.forEach(sale => {
        const customerName = sale.customer_no?.name || `Customer ${sale.customer_no}`;
        const itemsCount = sale.items ? sale.items.length : 0;
        csvContent += `${sale.sel_date.toISOString().split('T')[0]},"${customerName}",${sale.amount || 0},${sale.paid || 0},${(sale.amount || 0) - (sale.paid || 0)},${itemsCount}\n`;
      });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${type}-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
    
  } catch (err) {
    console.error('Analytics export error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export analytics data', 
      error: err.message 
    });
  }
});

// Add more analytics endpoints as needed

module.exports = router;
