const Sale = require('../models/Sale');
const Invoice = require('../models/Invoice');
const Purchase = require('../models/Purchase');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Store = require('../models/Store');
const StoreProduct = require('../models/StoreProduct');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require('date-fns');

// Helper: parse date range and filters
function parseFilters(query) {
  let { startDate, endDate, store_no, category, range } = query;
  let start, end;
  const now = new Date();
  if (range) {
    if (range === 'day') {
      start = startOfDay(now);
      end = endOfDay(now);
    } else if (range === 'week') {
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
    } else if (range === 'month') {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else if (range === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
  } else if (startDate && endDate) {
    start = startOfDay(new Date(startDate));
    end = endOfDay(new Date(endDate));
  }
  return { start, end, store_no, category };
}

exports.getAnalytics = async (req, res) => {
  // Multi-tenancy: get userId from req.user (set by auth middleware)
  const userId = req.user && req.user.userId ? req.user.userId : req.user && req.user._id ? req.user._id : undefined;
  try {
    const { start, end, store_no, category } = parseFilters(req.query);
    const saleFilter = {};
    if (start && end) saleFilter.sel_date = { $gte: start, $lte: end };
    if (store_no) saleFilter.store_no = Number(store_no);

    // SALES TRENDS (for line chart)
    if (userId) saleFilter.userId = userId;
    const sales = await Sale.find(saleFilter);
    const salesTrends = [];
    const trendMap = {};
    sales.forEach(sale => {
      const date = sale.sel_date.toISOString().slice(0, 10); // YYYY-MM-DD format
      if (!trendMap[date]) trendMap[date] = 0;
      trendMap[date] += sale.amount || 0;
    });
    
    // Convert to array and sort by date
    const sortedTrends = Object.entries(trendMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    salesTrends.push(...sortedTrends);

    // STOCK LEVELS (top-selling and low-stock)
    const productCounts = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        productCounts[item.product_no] = (productCounts[item.product_no] || 0) + item.qty;
      });
    });
    const topProductNos = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pno]) => Number(pno));
    const productFilter = {};
    if (userId) productFilter.userId = userId;
    const allProducts = await Product.find(productFilter);
    // Multi-tenancy for StoreProduct aggregation
    let storeProductMatch = {};
    if (userId) storeProductMatch.userId = userId;
    const storeProducts = await StoreProduct.aggregate([
      { $match: storeProductMatch },
      { $group: { _id: "$product_no", qty: { $sum: "$qty" } } }
    ]);
    const stockLevels = storeProducts.map(sp => {
      const prod = allProducts.find(p => p.product_no === sp._id);
      let status = 'good';
      if (sp.qty <= (prod?.min_stock || 10)) status = sp.qty === 0 ? 'critical' : 'warning';
      if (topProductNos.includes(sp._id)) status = 'good';
      return {
        name: prod?.product_name || `Product ${sp._id}`,
        productName: prod?.product_name || `Product ${sp._id}`,
        qty: sp.qty,
        quantity: sp.qty,
        product_no: sp._id,
        status
      };
    });

    // Add products with no StoreProduct record (qty = 0)
    const storeProductIds = storeProducts.map(sp => sp._id);
    const missingProducts = allProducts.filter(p => !storeProductIds.includes(p.product_no));
    missingProducts.forEach(prod => {
      stockLevels.push({
        name: prod.product_name,
        productName: prod.product_name,
        qty: 0,
        quantity: 0,
        product_no: prod.product_no,
        status: 'critical'
      });
    });

    // FAST/SLOW MOVING PRODUCTS with sales data
    const fastSlowProducts = [];
    for (const prod of allProducts) {
      const soldQty = productCounts[prod.product_no] || 0;
      const revenue = soldQty * (prod.selling_price || 0);
      fastSlowProducts.push({
        name: prod.product_name,
        productName: prod.product_name,
        product_no: prod.product_no,
        quantity: soldQty,
        revenue: revenue,
        status: soldQty > 20 ? 'fast' : 'slow' // threshold can be adjusted
      });
    }

    // DEBT TRACKING (customers with debt > $1000 and overdue by 1+ month)
    const now = new Date();
    const arSalesFilter = { $expr: { $gt: ["$amount", "$paid"] } };
    if (userId) arSalesFilter.userId = userId;
    const arSales = await Sale.find(arSalesFilter);
    // Collect all customer_nos with debt
    const debtCustomerNos = Array.from(new Set(arSales.map(s => s.customer_no)));
    const customerFilter = { customer_no: { $in: debtCustomerNos } };
    if (userId) customerFilter.userId = userId;
    const debtCustomers = await Customer.find(customerFilter);
    const customerMap = Object.fromEntries(debtCustomers.map(c => [c.customer_no, c.name]));
    const arList = arSales.map(s => ({
      name: customerMap[s.customer_no] || `Customer ${s.customer_no}`,
      customerName: customerMap[s.customer_no] || `Customer ${s.customer_no}`,
      customer_no: s.customer_no,
      amount: (s.amount || 0) - (s.paid || 0),
      days: Math.floor((now - s.sel_date) / (1000 * 60 * 60 * 24)),
      daysOverdue: Math.floor((now - s.sel_date) / (1000 * 60 * 60 * 24))
    })).filter(x => x.amount > 1000 && x.days >= 30);
    const debtTracking = arList;

    // AI PREDICTION (simulate with proper object structure)
    let aiPrediction = { product: '', days: 0 };
    const soonOut = stockLevels.find(s => s.status === 'warning' || s.status === 'critical');
    if (soonOut) {
      aiPrediction = {
        product: soonOut.name,
        days: soonOut.qty < 10 ? 3 : 7
      };
    }

    // SMART RESTOCK RECOMMENDATION (simulate with proper object structure)
    let restockRecommendation = { product: '', qty: 0 };
    const restock = stockLevels.find(s => s.status === 'warning' || s.status === 'critical');
    if (restock) {
      restockRecommendation = {
        product: restock.name,
        qty: Math.max(100 - restock.qty, 10)
      };
    }

    // DEBT RISK ALERTS (simulate: high risk if debt > $2000 and overdue > 40 days)
    const debtRiskAlerts = debtTracking.filter(d => d.amount > 2000 && d.days > 40).map(d => ({ name: d.name, risk: 'High' }));

    res.json({
      success: true,
      data: {
        salesTrends,
        stockLevels,
        fastSlowProducts,
        fastSlowTable: fastSlowProducts, // Alias for compatibility
        debtTracking,
        aiPrediction,
        restockRecommendation,
        restockRec: restockRecommendation, // Alias for compatibility
        debtRiskAlerts
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
