// (Expiry Report logic removed)
// Expiry Report
exports.expiryReport = async (req, res) => {
  try {
    const userId = req.user && req.user.userId ? req.user.userId : req.user && req.user._id ? req.user._id : undefined;
    const Product = require('../models/Product');
    const filter = { expiryDate: { $ne: null } };
    if (userId) filter.userId = userId;
    const products = await Product.find(filter).sort({ expiryDate: 1 });
    const now = new Date();
    const rows = products.map(p => ({
      product_no: p._id,
      product_name: p.name,
      expiryDate: p.expiryDate,
      daysToExpire: p.expiryDate ? Math.ceil((p.expiryDate - now) / (1000 * 60 * 60 * 24)) : null,
      stock: p.storing_balance || 0,
    }));
    res.json({ success: true, data: { rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Stock Valuation Report (FIFO, LIFO, Weighted Average)
exports.stockValuationReport = async (req, res) => {
  try {
    const method = req.query.method || 'fifo'; // 'fifo', 'lifo', 'weighted'
    const userId = req.user && req.user.userId ? req.user.userId : req.user && req.user._id ? req.user._id : undefined;
    const Product = require('../models/Product');
    const Purchase = require('../models/Purchase');
    const Sale = require('../models/Sale');
    const products = await Product.find(userId ? { userId } : {});
    let rows = [];
    for (const product of products) {
      const productName = product.name;
      // Get all purchases and sales for this product by name
      const purchases = await Purchase.find({ product_name: productName, ...(userId ? { userId } : {}) }).sort({ created_at: 1 });
      const sales = await Sale.find({ 'items.product_name': productName, ...(userId ? { userId } : {}) }).sort({ created_at: 1 });
      let stock = product.storing_balance || 0;
      let valuation = 0;
      if (method === 'fifo' || method === 'lifo') {
        // Build purchase lots
        let lots = [];
        for (const p of purchases) {
          lots.push({ qty: p.qty, price: p.price });
        }
        if (method === 'lifo') lots = lots.reverse();
        let remaining = stock;
        for (const lot of lots) {
          if (remaining <= 0) break;
          const used = Math.min(lot.qty, remaining);
          valuation += used * lot.price;
          remaining -= used;
        }
      } else if (method === 'weighted') {
        // Weighted average cost
        let totalQty = 0, totalCost = 0;
        for (const p of purchases) {
          totalQty += p.qty;
          totalCost += p.qty * p.price;
        }
        const avgCost = totalQty > 0 ? totalCost / totalQty : 0;
        valuation = stock * avgCost;
      }
      rows.push({
        product_no: product._id,
        product_name: productName,
        stock,
        valuation: Math.round(valuation * 100) / 100,
        method: method.toUpperCase(),
      });
    }
    res.json({ success: true, data: { rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Top/Bottom Products Report
exports.topProductsReport = async (req, res) => {
  const { start, end } = parseDateRange(req.query);
  const limit = parseInt(req.query.limit) || 10;
  const type = req.query.type === 'bottom' ? 'bottom' : 'top';
  try {
    // Multi-tenancy: filter by userId if available
    const userId = req.user && req.user.userId ? req.user.userId : req.user && req.user._id ? req.user._id : undefined;
    const filter = {};
    if (start && end) filter.sel_date = { $gte: start, $lte: end };
    if (userId) filter.userId = userId;
    const sales = await Sales.find(filter);
    // Aggregate product sales
    const productSales = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        if (!productSales[item.product_no]) {
          productSales[item.product_no] = { product_no: item.product_no, qty: 0, amount: 0 };
        }
        productSales[item.product_no].qty += item.qty || 0;
        productSales[item.product_no].amount += (item.qty || 0) * (item.price || 0);
      }
    }
    let productsArr = Object.values(productSales);
    productsArr.sort((a, b) => type === 'top' ? b.qty - a.qty : a.qty - b.qty);
    productsArr = productsArr.slice(0, limit);
    // Lookup product names
    const Product = require('../models/Product');
    const products = await Product.find({ product_no: { $in: productsArr.map(p => p.product_no) } });
    const productMap = Object.fromEntries(products.map(p => [p.product_no, p.product_name]));
    for (const p of productsArr) {
      p.product_name = productMap[p.product_no] || p.product_no;
    }
    res.json({ success: true, data: { rows: productsArr } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const Sales = require('../models/Sale');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const Purchase = require('../models/Purchase');
const { startOfDay, endOfDay } = require('date-fns');

// Helper: parse date range from query
function parseDateRange(query) {
  let { startDate, endDate } = query;
  if (startDate) startDate = new Date(startDate);
  if (endDate) endDate = new Date(endDate);
  return {
    start: startDate ? startOfDay(startDate) : undefined,
    end: endDate ? endOfDay(endDate) : undefined,
  };
}

exports.generateReport = async (req, res) => {
  const { type } = req.params;
  const { start, end } = parseDateRange(req.query);
  try {
    let data = {};
    // Multi-tenancy: filter by userId if available
    const userId = req.user && req.user.userId ? req.user.userId : req.user && req.user._id ? req.user._id : undefined;
    if (type === 'sales') {
      // Filter by date, product, customer, userId
      const filter = {};
      if (start && end) filter.sel_date = { $gte: start, $lte: end };
      if (req.query.customer_no) filter.customer_no = req.query.customer_no;
      if (req.query.store_no) filter.store_no = req.query.store_no;
      if (userId) filter.userId = userId;
      let sales = await Sales.find(filter);
      if (req.query.product_no) {
        sales = sales.filter(sale => sale.items.some(item => item.product_no == req.query.product_no));
      }
      const allProductNos = Array.from(new Set(sales.flatMap(sale => sale.items.map(item => item.product_no))));
      const allCustomerNos = Array.from(new Set(sales.map(sale => sale.customer_no)));
      const allStoreNos = Array.from(new Set(sales.map(sale => sale.store_no)));
      const Product = require('../models/Product');
      const Customer = require('../models/Customer');
      const Store = require('../models/Store');
      const products = await Product.find({ product_no: { $in: allProductNos } });
      const customers = await Customer.find({ customer_no: { $in: allCustomerNos } });
      const stores = await Store.find({ store_no: { $in: allStoreNos } });
      const productMap = Object.fromEntries(products.map(p => [p.product_no, p.product_name]));
      const customerMap = Object.fromEntries(customers.map(c => [c.customer_no, c.name]));
      const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));
      data.rows = sales.map(sale => ({
        sel_no: sale.sel_no,
        customer_no: sale.customer_no,
        customer_name: customerMap[sale.customer_no] || sale.customer_no,
        store_no: sale.store_no,
        store_name: storeMap[sale.store_no] || sale.store_no,
        amount: sale.amount,
        paid: sale.paid,
        discount: sale.discount,
        tax: sale.tax,
        sel_date: sale.sel_date,
        items: sale.items.map(item => ({
          ...item.toObject(),
          product_name: productMap[item.product_no] || item.product_no
        }))
      }));
      data.summary = {
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, s) => sum + (s.amount || 0), 0),
        totalPaid: sales.reduce((sum, s) => sum + (s.paid || 0), 0),
        totalDiscount: sales.reduce((sum, s) => sum + (s.discount || 0), 0),
        totalTax: sales.reduce((sum, s) => sum + (s.tax || 0), 0)
      };
    } else if (type === 'stock-movement') {
      // Stock Movement/History Report
      const Purchase = require('../models/Purchase');
      const Sales = require('../models/Sale');
      const StockAdjustment = require('../models/StockAdjustment');
      const StockTransfer = require('../models/StockTransfer');
      const PurchaseReturn = require('../models/PurchaseReturn');
      const SalesReturn = require('../models/SalesReturn');
      const Product = require('../models/Product');
      const Store = require('../models/Store');
      const { product_no, store_no } = req.query;
      // Purchases (Inbound)
      let purchaseFilter = {};
      if (start && end) purchaseFilter.created_at = { $gte: start, $lte: end };
      if (product_no) purchaseFilter.product_no = product_no;
      if (store_no) purchaseFilter.store_no = store_no;
      if (userId) purchaseFilter.userId = userId;
      const purchases = await Purchase.find(purchaseFilter);
      // Sales (Outbound)
      let salesFilter = {};
      if (start && end) salesFilter.sel_date = { $gte: start, $lte: end };
      if (store_no) salesFilter.store_no = store_no;
      if (userId) salesFilter.userId = userId;
      let sales = await Sales.find(salesFilter);
      if (product_no) {
        sales = sales.filter(sale => sale.items.some(item => item.product_no == product_no));
      }
      // Stock Adjustments
      let adjFilter = {};
      if (start && end) adjFilter.created_at = { $gte: start, $lte: end };
      if (product_no) adjFilter.pro_no = product_no;
      if (store_no) adjFilter.store_no = store_no;
      if (userId) adjFilter.userId = userId;
      const adjustments = await StockAdjustment.find(adjFilter);
      // Stock Transfers
      let transferFilter = {};
      if (start && end) transferFilter.created_at = { $gte: start, $lte: end };
      if (product_no) transferFilter.product_no = product_no;
      if (userId) transferFilter.userId = userId;
      let transfers = await StockTransfer.find(transferFilter);
      if (store_no) {
        transfers = transfers.filter(t => t.from_store == store_no || t.to_store == store_no);
      }
      // Purchase Returns (Outbound)
      let purchaseReturnFilter = {};
      if (start && end) purchaseReturnFilter.created_at = { $gte: start, $lte: end };
      if (product_no) purchaseReturnFilter.product_no = product_no;
      if (store_no) purchaseReturnFilter.store_no = store_no;
      if (userId) purchaseReturnFilter.userId = userId;
      const purchaseReturns = await PurchaseReturn.find(purchaseReturnFilter);
      // Sales Returns (Inbound)
      let salesReturnFilter = {};
      if (start && end) salesReturnFilter.created_at = { $gte: start, $lte: end };
      if (product_no) salesReturnFilter.product_no = product_no;
      if (store_no) salesReturnFilter.store_no = store_no;
      if (userId) salesReturnFilter.userId = userId;
      const salesReturns = await SalesReturn.find(salesReturnFilter);
      // Map all to a unified movement array
      const movementRows = [];
      // Purchases (Inbound)
      for (const p of purchases) {
        movementRows.push({
          type: 'Purchase',
          direction: 'Inbound',
          product_no: p.product_no,
          qty: p.qty,
          store_no: p.store_no,
          date: p.created_at,
          ref: p.purchase_id || p._id,
        });
      }
      // Sales (Outbound)
      for (const s of sales) {
        for (const item of s.items) {
          if (!product_no || item.product_no == product_no) {
            movementRows.push({
              type: 'Sale',
              direction: 'Outbound',
              product_no: item.product_no,
              qty: item.qty,
              store_no: s.store_no,
              date: s.sel_date,
              ref: s.sel_no || s._id,
            });
          }
        }
      }
      // Stock Adjustments
      for (const a of adjustments) {
        movementRows.push({
          type: 'Adjustment',
          direction: a.adj_type === 'add' ? 'Inbound' : 'Outbound',
          product_no: a.pro_no,
          qty: a.qty,
          store_no: a.store_no,
          date: a.created_at,
          ref: a.adj_no || a._id,
        });
      }
      // Stock Transfers
      for (const t of transfers) {
        // Outbound from from_store
        if (!store_no || t.from_store == store_no) {
          movementRows.push({
            type: 'Transfer Out',
            direction: 'Outbound',
            product_no: t.product_no,
            qty: t.qty,
            store_no: t.from_store,
            date: t.created_at,
            ref: t.transfer_id || t._id,
          });
        }
        // Inbound to to_store
        if (!store_no || t.to_store == store_no) {
          movementRows.push({
            type: 'Transfer In',
            direction: 'Inbound',
            product_no: t.product_no,
            qty: t.qty,
            store_no: t.to_store,
            date: t.created_at,
            ref: t.transfer_id || t._id,
          });
        }
      }
      // Purchase Returns (Outbound)
      for (const pr of purchaseReturns) {
        movementRows.push({
          type: 'Purchase Return',
          direction: 'Outbound',
          product_no: pr.product_no,
          qty: pr.qty,
          store_no: pr.store_no,
          date: pr.created_at,
          ref: pr.return_no || pr._id,
        });
      }
      // Sales Returns (Inbound)
      for (const sr of salesReturns) {
        movementRows.push({
          type: 'Sales Return',
          direction: 'Inbound',
          product_no: sr.product_no,
          qty: sr.qty,
          store_no: sr.store_no,
          date: sr.created_at,
          ref: sr.return_no || sr._id,
        });
      }
      // Lookup product and store names
      const allProductNos = Array.from(new Set(movementRows.map(m => m.product_no)));
      const allStoreNos = Array.from(new Set(movementRows.map(m => m.store_no)));
      const products = await Product.find({ product_no: { $in: allProductNos } });
      const stores = await Store.find({ store_no: { $in: allStoreNos } });
      const productMap = Object.fromEntries(products.map(p => [p.product_no, p.product_name]));
      const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));
      for (const m of movementRows) {
        m.product_name = productMap[m.product_no] || m.product_no;
        m.store_name = storeMap[m.store_no] || m.store_no;
      }
      // Summary
      const summary = {
        totalMovements: movementRows.length,
        inbound: movementRows.filter(m => m.direction === 'Inbound').reduce((sum, m) => sum + (m.qty || 0), 0),
        outbound: movementRows.filter(m => m.direction === 'Outbound').reduce((sum, m) => sum + (m.qty || 0), 0),
        transfers: transfers.length,
        adjustments: adjustments.length,
        returns: purchaseReturns.length + salesReturns.length,
      };
      data.rows = movementRows;
      data.summary = summary;
    } else if (type === 'inventory') {
      // Inventory Report
      const Product = require('../models/Product');
      const filter = {};
      if (userId) filter.userId = userId;
      const products = await Product.find(filter);
      data.rows = products.map(p => ({
        product_no: p.product_no,
        product_name: p.product_name,
        category: p.category,
        stock: p.stock,
        price: p.price,
        status: p.stock === 0 ? 'Out of Stock' : (p.stock < 10 ? 'Low Stock' : 'In Stock'),
      }));
      data.summary = {
        totalProducts: products.length,
        totalStock: products.reduce((sum, p) => sum + (p.stock || 0), 0),
        outOfStock: products.filter(p => p.stock === 0).length,
        lowStock: products.filter(p => p.stock < 10 && p.stock > 0).length,
      };
    } else if (type === 'low-stock') {
      // Low Stock/Out-of-Stock Report
      const Product = require('../models/Product');
      const Store = require('../models/Store');
      const filter = {};
      if (userId) filter.userId = userId;
      // Allow filtering by store if needed
      if (req.query.store_no) filter.store_no = req.query.store_no;
      // Only products with stock <= minStock (or 0)
      filter.$expr = { $lte: ["$stock", { $ifNull: ["$minStock", 0] }] };
      const products = await Product.find(filter);
      // Optionally, join store name if needed
      let storeMap = {};
      if (products.length > 0) {
        const storeNos = Array.from(new Set(products.map(p => p.store_no).filter(Boolean)));
        if (storeNos.length > 0) {
          const stores = await Store.find({ store_no: { $in: storeNos } });
          storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));
        }
      }
      data.rows = products.map(p => ({
        product_no: p.product_no,
        product_name: p.product_name,
        category: p.category,
        store_name: storeMap[p.store_no] || p.store_no || '',
        stock: p.stock,
        minStock: p.minStock,
        status: p.stock === 0 ? 'Out of Stock' : (p.stock <= (p.minStock || 0) ? 'Low Stock' : 'OK'),
      }));
      data.summary = {
        totalLowStock: data.rows.length,
        outOfStock: data.rows.filter(r => r.stock === 0).length,
        lowStock: data.rows.filter(r => r.stock > 0 && r.stock <= (r.minStock || 0)).length,
      };
    } else if (type === 'purchases') {
      // Purchases Report
      const Purchase = require('../models/Purchase');
      const Supplier = require('../models/Supplier');
      const Store = require('../models/Store');
      const filter = {};
      if (start && end) filter.created_at = { $gte: start, $lte: end };
      if (req.query.supplier_no) filter.supplier_no = req.query.supplier_no;
      if (req.query.store_no) filter.store_no = req.query.store_no;
      if (userId) filter.userId = userId;
      let purchases = await Purchase.find(filter);
      if (req.query.product_no) {
        purchases = purchases.filter(p => p.product_no == req.query.product_no);
      }
      const allSupplierNos = Array.from(new Set(purchases.map(p => p.supplier_no)));
      const allStoreNos = Array.from(new Set(purchases.map(p => p.store_no)));
      const SupplierModel = require('../models/Supplier');
      const StoreModel = require('../models/Store');
      const suppliers = await SupplierModel.find({ supplier_no: { $in: allSupplierNos } });
      const stores = await StoreModel.find({ store_no: { $in: allStoreNos } });
      const supplierMap = Object.fromEntries(suppliers.map(s => [s.supplier_no, s.name]));
      const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));
      data.rows = purchases.map(p => ({
        purchase_id: p.purchase_id,
        product_no: p.product_no,
        product_name: p.product_name,
        supplier_no: p.supplier_no,
        supplier_name: supplierMap[p.supplier_no] || p.supplier_no,
        store_no: p.store_no,
        store_name: storeMap[p.store_no] || p.store_no,
        qty: p.qty,
        price: p.price,
        discount: p.discount,
        tax: p.tax,
        amount: p.amount,
        paid: p.paid,
        account_id: p.account_id,
        created_at: p.created_at,
      }));
      data.summary = {
        totalPurchases: purchases.length,
        totalAmount: purchases.reduce((sum, p) => sum + (p.amount || 0), 0),
        totalPaid: purchases.reduce((sum, p) => sum + (p.paid || 0), 0),
      };
    } else if (type === 'expenses') {
      // Expenses Report
      const Expense = require('../models/Expense');
      const filter = {};
      if (start && end) filter.expense_date = { $gte: start, $lte: end };
      if (userId) filter.userId = userId;
      const expenses = await Expense.find(filter);
      data.rows = expenses.map(e => ({
        expense_id: e.expense_id,
        category: e.category,
        account: e.account,
        amount: e.amount,
        description: e.description,
        expense_date: e.expense_date,
      }));
      data.summary = {
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
      };
    } else if (type === 'customer-sales') {
      // Customer Sales Report: group sales by customer
      const filter = {};
      if (start && end) filter.sel_date = { $gte: start, $lte: end };
      if (userId) filter.userId = userId;
      const sales = await Sales.find(filter);
      // Aggregate by customer
      const customerMap = {};
      for (const sale of sales) {
        const key = sale.customer_no;
        if (!customerMap[key]) {
          customerMap[key] = {
            customer_no: sale.customer_no,
            customer_name: sale.customer_name || sale.customer_no,
            totalSales: 0,
            totalRevenue: 0
          };
        }
        customerMap[key].totalSales += 1;
        customerMap[key].totalRevenue += sale.amount || 0;
      }
      data.rows = Object.values(customerMap);
      data.summary = {
        totalCustomers: data.rows.length,
        totalRevenue: data.rows.reduce((sum, c) => sum + (c.totalRevenue || 0), 0),
        totalSales: data.rows.reduce((sum, c) => sum + (c.totalSales || 0), 0)
      };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type' });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}
