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
       if (type === 'sales') {
         // Filter by date, product, customer
         const filter = {};
         if (start && end) filter.sel_date = { $gte: start, $lte: end };
         if (req.query.customer_no) filter.customer_no = req.query.customer_no;
         if (req.query.store_no) filter.store_no = req.query.store_no;
         // For product filter, need to match items.product_no
         let sales = await Sales.find(filter);
         if (req.query.product_no) {
           sales = sales.filter(sale => sale.items.some(item => item.product_no == req.query.product_no));
         }
         // Fetch all product_nos and customer_nos for name lookup
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
    } else if (type === 'inventory') {
      const products = await Product.find();
      data.rows = products;
      data.summary = {
        totalProducts: products.length,
        totalStock: products.reduce((sum, p) => sum + (p.stock || 0), 0),
      };
    } else if (type === 'expenses') {
      const filter = {};
      if (start && end) filter.date = { $gte: start, $lte: end };
      const expenses = await Expense.find(filter);
      data.rows = expenses;
      data.summary = {
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
      };
    } else if (type === 'purchases') {
      const filter = {};
      if (start && end) filter.created_at = { $gte: start, $lte: end };
      const purchases = await Purchase.find(filter);
      // Fetch all product_nos, supplier_nos, store_nos for name lookup
      const allProductNos = Array.from(new Set(purchases.map(p => p.product_no)));
      const allSupplierNos = Array.from(new Set(purchases.map(p => p.supplier_no)));
      const allStoreNos = Array.from(new Set(purchases.map(p => p.store_no)));
      const Product = require('../models/Product');
      const Supplier = require('../models/Supplier');
      const Store = require('../models/Store');
      const products = await Product.find({ product_no: { $in: allProductNos } });
      const suppliers = await Supplier.find({ supplier_no: { $in: allSupplierNos } });
      const stores = await Store.find({ store_no: { $in: allStoreNos } });
      const productMap = Object.fromEntries(products.map(p => [p.product_no, p.product_name]));
      const supplierMap = Object.fromEntries(suppliers.map(s => [s.supplier_no, s.name]));
      const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s.store_name]));
      data.rows = purchases.map(p => ({
        ...p.toObject(),
        product_name: productMap[p.product_no] || p.product_no,
        supplier_name: supplierMap[p.supplier_no] || p.supplier_no,
        store_name: storeMap[p.store_no] || p.store_no
      }));
      data.summary = {
        totalPurchases: purchases.length,
        totalAmount: purchases.reduce((sum, p) => sum + (p.amount || 0), 0),
      };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type' });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
