// Required models and dependencies
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const Expense = require('../models/Expense');
const Account = require('../models/Account');
const StoreProduct = require('../models/StoreProduct');
const { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears, startOfDay, endOfDay } = require('date-fns');
const {
  generateProfitLossStatement,
  generateBalanceSheet,
  generateCashFlowStatement,
  calculateFinancialSummary,
  groupFinancialDataByTime,
  calculateCategoryBreakdown,
  calculateFinancialRatios,
  generateFinancialForecasting,
  calculateFinancialComparisonMetrics,
  compileAllTransactions
} = require('./financialHelpers');

// Expiry Report
exports.expiryReport = async (req, res) => {
  try {
    const userId = req.user && req.user.userId ? req.user.userId : req.user && req.user._id ? req.user._id : undefined;
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
    const sales = await Sale.find(filter);
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

// Helper: parse date range from query
function parseDateRange(query) {
  let { startDate, endDate, period } = query;
  let start, end;
  const now = new Date();
  
  // Handle predefined periods
  if (period) {
    switch (period) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        start = startOfDay(yesterday);
        end = endOfDay(yesterday);
        break;
      case 'this_week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'last_week':
        const lastWeek = subDays(now, 7);
        start = startOfWeek(lastWeek, { weekStartsOn: 1 });
        end = endOfWeek(lastWeek, { weekStartsOn: 1 });
        break;
      case 'this_month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'this_quarter':
        const quarterStart = startOfMonth(subMonths(now, (now.getMonth() % 3)));
        start = quarterStart;
        end = endOfMonth(subMonths(quarterStart, -2));
        break;
      case 'this_year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'last_year':
        const lastYear = subYears(now, 1);
        start = startOfYear(lastYear);
        end = endOfYear(lastYear);
        break;
      case 'last_30_days':
        start = startOfDay(subDays(now, 30));
        end = endOfDay(now);
        break;
      case 'last_90_days':
        start = startOfDay(subDays(now, 90));
        end = endOfDay(now);
        break;
      default:
        // Custom date range
        if (startDate) start = startOfDay(new Date(startDate));
        if (endDate) end = endOfDay(new Date(endDate));
    }
  } else {
    // Custom date range
    if (startDate) start = startOfDay(new Date(startDate));
    if (endDate) end = endOfDay(new Date(endDate));
  }
  
  return { start, end };
}

// Advanced Financial Report with Enterprise Features
exports.generateAdvancedFinancialReport = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    console.log('🔍 Generating advanced financial report for userId:', userId);
    
    const { start, end } = parseDateRange(req.query);
    const {
      reportType = 'comprehensive',
      groupBy = 'month',
      includeComparisons = true,
      includeForecasting = true,
      page = 1,
      limit = 50
    } = req.query;

    console.log('🔍 Financial report filters:', { userId, start, end, reportType, groupBy });

    // Use the same data fetching approach as working reports
    const Sale = require('../models/Sale');
    const Purchase = require('../models/Purchase');
    const Expense = require('../models/Expense');
    const Account = require('../models/Account');
    const Deposit = require('../models/Deposit');
    const Withdrawal = require('../models/Withdrawal');

    // Build filters for each data type
    const saleFilter = {};
    if (start && end) saleFilter.sel_date = { $gte: start, $lte: end };
    if (userId) saleFilter.userId = userId;

    const purchaseFilter = {};
    if (start && end) purchaseFilter.created_at = { $gte: start, $lte: end };
    if (userId) purchaseFilter.userId = userId;

    const expenseFilter = {};
    if (start && end) expenseFilter.expense_date = { $gte: start, $lte: end };
    if (userId) expenseFilter.userId = userId;

    const accountFilter = {};
    if (userId) accountFilter.userId = userId;

    // Fetch actual data
    const [sales, purchases, expenses, accounts, deposits, withdrawals] = await Promise.all([
      Sale.find(saleFilter).lean(),
      Purchase.find(purchaseFilter).lean(),
      Expense.find(expenseFilter).lean(),
      Account.find(accountFilter).lean(),
      Deposit.find({ userId }).lean(),
      Withdrawal.find({ userId }).lean()
    ]);

    console.log('📊 Data fetched:', { 
      sales: sales.length, 
      purchases: purchases.length, 
      expenses: expenses.length,
      accounts: accounts.length 
    });

    // Generate financial statements using accurate data
    const profitLoss = generateProfitLossStatement(sales, purchases, expenses);
    const balanceSheet = generateBalanceSheet(accounts, sales, purchases, expenses, deposits, withdrawals);
    const cashFlow = generateCashFlowStatement(sales, purchases, expenses, deposits, withdrawals);
    
    // Calculate summary metrics using accurate data
    const summary = calculateFinancialSummary(sales, purchases, expenses, deposits, withdrawals);
    
    // Group data for time series analysis
    const timeSeriesData = groupFinancialDataByTime(sales, purchases, expenses, groupBy);
    
    // Calculate financial ratios
    const financialRatios = calculateFinancialRatios(summary, sales, purchases, expenses);
    
    // Category breakdown
    const categoryBreakdown = calculateCategoryBreakdown(sales, purchases, expenses);
    
    // Comparison data if requested
    let comparisonData = null;
    if (includeComparisons && start && end) {
      try {
        comparisonData = await calculateFinancialComparisonMetrics(
          { userId },
          start,
          end,
          userId
        );
      } catch (comparisonError) {
        console.warn('⚠️  Comparison metrics calculation failed:', comparisonError.message);
        comparisonData = null;
      }
    }
    
    // Forecasting if requested
    let forecastingData = null;
    if (includeForecasting) {
      try {
        forecastingData = generateFinancialForecasting(timeSeriesData);
      } catch (forecastError) {
        console.warn('⚠️  Forecasting calculation failed:', forecastError.message);
        forecastingData = null;
      }
    }

    // Combine all transactions for pagination
    const allTransactions = [
      ...sales.map(s => ({ ...s, type: 'sale', date: s.sel_date || s.created_at })),
      ...purchases.map(p => ({ ...p, type: 'purchase', date: p.created_at })),
      ...expenses.map(e => ({ ...e, type: 'expense', date: e.expense_date || e.created_at })),
      ...deposits.map(d => ({ ...d, type: 'deposit', date: d.created_at })),
      ...withdrawals.map(w => ({ ...w, type: 'withdrawal', date: w.created_at }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Pagination for transactions
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedTransactions = allTransactions.slice(skip, skip + Number(limit));

    // Generate different financial statements based on report type
    let response = {};
    
    if (reportType === 'profit_loss') {
      response = {
        statement_type: 'profit_loss',
        profit_loss: profitLoss,
        time_series: timeSeriesData,
        metadata: {
          report_type: reportType,
          period: { start, end },
          group_by: groupBy,
          generated_at: new Date()
        }
      };
    } else if (reportType === 'balance_sheet') {
      response = {
        statement_type: 'balance_sheet',
        balance_sheet: balanceSheet,
        metadata: {
          report_type: reportType,
          period: { start, end },
          generated_at: new Date()
        }
      };
    } else if (reportType === 'cash_flow') {
      response = {
        statement_type: 'cash_flow',
        cash_flow: cashFlow,
        time_series: timeSeriesData,
        metadata: {
          report_type: reportType,
          period: { start, end },
          group_by: groupBy,
          generated_at: new Date()
        }
      };
    } else {
      // Comprehensive report (default)
      response = {
        statement_type: 'comprehensive',
        summary: {
          ...summary,
          revenue_growth: comparisonData?.growth?.revenue || 0,
          expense_growth: comparisonData?.growth?.expenses || 0,
          profit_growth: comparisonData?.growth?.profit || 0,
          cash_flow_growth: comparisonData?.growth?.cash_flow || 0
        },
        profit_loss: profitLoss,
        balance_sheet: balanceSheet,
        cash_flow: cashFlow,
        time_series: timeSeriesData,
        category_breakdown: categoryBreakdown,
        financial_ratios: financialRatios,
        forecasting: forecastingData,
        transactions: paginatedTransactions,
        comparisons: comparisonData,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: allTransactions.length,
          pages: Math.ceil(allTransactions.length / Number(limit))
        },
        metadata: {
          report_type: reportType,
          period: { start, end },
          group_by: groupBy,
          generated_at: new Date(),
          total_transactions: allTransactions.length
        }
      };
    }

    console.log('✅ Advanced financial report generated successfully');
    res.json({
      success: true,
      data: response
    });

  } catch (err) {
    console.error('❌ Error generating advanced financial report:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial report',
      error: err.message
    });
  }
};

// Advanced Sales Report with Enterprise Features
exports.generateAdvancedSalesReport = async (req, res) => {
  try {
    // Get userId from JWT token - check both userId and id fields
    const userId = req.user.userId || req.user.id;
    console.log('🔍 JWT payload:', req.user);
    console.log('🔍 Extracted userId:', userId);
    
    const { start, end } = parseDateRange(req.query);
    const {
      customer_no,
      store_no,
      product_no,
      status,
      min_amount,
      max_amount,
      payment_status,
      groupBy = 'day', // day, week, month, quarter, year
      metrics = 'basic', // basic, advanced, detailed
      includeItems = true,
      includeComparisons = false,
      page = 1,
      limit = 50,
      sortBy = 'sel_date',
      sortOrder = 'desc'
    } = req.query;

    console.log('🔍 Generating advanced sales report with filters:', {
      userId, start, end, customer_no, store_no, product_no, status, min_amount, max_amount, payment_status, groupBy, metrics
    });

    // Build base filter
    const filter = {};
    if (userId) filter.userId = userId;
    if (start && end) filter.sel_date = { $gte: start, $lte: end };
    if (customer_no) filter.customer_no = Number(customer_no);
    if (store_no) filter.store_no = Number(store_no);
    if (status) filter.status = status;
    if (min_amount || max_amount) {
      filter.amount = {};
      if (min_amount) filter.amount.$gte = Number(min_amount);
      if (max_amount) filter.amount.$lte = Number(max_amount);
    }
    
    // Payment status filter
    if (payment_status) {
      switch (payment_status) {
        case 'paid':
          filter.$expr = { $gte: ['$paid', '$amount'] };
          break;
        case 'partial':
          filter.$expr = { $and: [{ $gt: ['$paid', 0] }, { $lt: ['$paid', '$amount'] }] };
          break;
        case 'unpaid':
          filter.paid = { $lte: 0 };
          break;
      }
    }

    // Get sales with pagination and sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [sales, totalCount] = await Promise.all([
      Sale.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Sale.countDocuments(filter)
    ]);

    console.log(`📊 Found ${sales.length} sales out of ${totalCount} total`);

    // Filter by product if specified
    let filteredSales = sales;
    if (product_no) {
      filteredSales = sales.filter(sale => 
        sale.items && sale.items.some(item => item.product_no === Number(product_no))
      );
    }

    // Get related data for enrichment
    console.log('🔍 Using userId for queries:', userId);
    
    const [customers, stores, accounts, products, allCustomers, allStores] = await Promise.all([
      Customer.find({ userId }).lean(),
      Store.find({ userId }).lean(),
      Account.find({ userId }).lean(),
      Product.find({ userId }).lean(),
      Customer.find({}).lean(), // Get all customers without userId filter for debugging
      Store.find({}).lean()     // Get all stores without userId filter for debugging
    ]);
    
    console.log(`📊 Found related data: ${customers.length} customers, ${stores.length} stores, ${accounts.length} accounts, ${products.length} products`);
    console.log(`📊 Found ALL data: ${allCustomers.length} total customers, ${allStores.length} total stores`);
    console.log(`📊 User ID for filtering: ${userId}`);
    
    // Log sample data for debugging
    if (filteredSales.length > 0) {
      const sampleSale = filteredSales[0];
      console.log('🔍 Sample sale data:', {
        customer_no: sampleSale.customer_no,
        customer_no_type: typeof sampleSale.customer_no,
        store_no: sampleSale.store_no,
        store_no_type: typeof sampleSale.store_no,
        amount: sampleSale.amount,
        userId: sampleSale.userId
      });
    }
    
    if (customers.length > 0) {
      console.log('🔍 Sample customer:', { 
        customer_no: customers[0].customer_no, 
        customer_no_type: typeof customers[0].customer_no,
        name: customers[0].name,
        userId: customers[0].userId
      });
    } else {
      console.log('⚠️ No customers found for userId:', userId);
    }
    
    if (stores.length > 0) {
      console.log('🔍 Sample store:', { 
        store_no: stores[0].store_no, 
        store_no_type: typeof stores[0].store_no,
        store_name: stores[0].store_name,
        userId: stores[0].userId
      });
    } else {
      console.log('⚠️ No stores found for userId:', userId);
    }

    // Create lookup maps with both string and number keys to handle type mismatches
    const customerMap = new Map();
    customers.forEach(c => {
      customerMap.set(c.customer_no, c);
      customerMap.set(String(c.customer_no), c);
      customerMap.set(Number(c.customer_no), c);
    });
    
    const storeMap = new Map();
    stores.forEach(s => {
      storeMap.set(s.store_no, s);
      storeMap.set(String(s.store_no), s);
      storeMap.set(Number(s.store_no), s);
    });
    
    const accountMap = Object.fromEntries(accounts.map(a => [a.account_id, a]));
    const productMap = new Map();
    products.forEach(p => {
      productMap.set(p.product_no, p);
      productMap.set(String(p.product_no), p);
      productMap.set(Number(p.product_no), p);
    });

    // Enrich sales data
    const enrichedSales = filteredSales.map(sale => {
      const customer = customerMap.get(sale.customer_no);
      const store = storeMap.get(sale.store_no);
      const account = accountMap[sale.account_id];
      
      // Calculate derived metrics
      const balanceDue = (sale.amount || 0) - (sale.paid || 0);
      const paymentStatus = balanceDue <= 0 ? 'paid' : (sale.paid > 0 ? 'partial' : 'unpaid');
      const profitMargin = calculateProfitMargin(sale, productMap);
      
      let enrichedItems = [];
      if (includeItems && sale.items) {
        enrichedItems = sale.items.map(item => {
          const product = productMap.get(item.product_no);
          return {
            ...item,
            product_name: product?.product_name || item.product_name || '',
            category: product?.category || '',
            cost_price: product?.cost_price || 0,
            profit: (item.price - (product?.cost_price || 0)) * item.qty,
            margin_percentage: product?.cost_price ? 
              (((item.price - product.cost_price) / item.price) * 100).toFixed(2) : 0
          };
        });
      }

      return {
        ...sale,
        customer_name: customer?.name || `Customer ${sale.customer_no}`,
        customer_email: customer?.email || '',
        customer_phone: customer?.phone || '',
        store_name: store?.store_name || `Store ${sale.store_no}`,
        account_name: account?.name || account?.account_name || '',
        balance_due: balanceDue,
        payment_status: paymentStatus,
        profit_margin: profitMargin,
        items: enrichedItems
      };
    });
    
    // Log enriched data for debugging
    if (enrichedSales.length > 0) {
      const sampleEnriched = enrichedSales[0];
      const customer = customerMap.get(sampleEnriched.customer_no);
      const store = storeMap.get(sampleEnriched.store_no);
      console.log('🔍 Sample enriched sale:', {
        customer_no: sampleEnriched.customer_no,
        customer_name: sampleEnriched.customer_name,
        store_no: sampleEnriched.store_no,
        store_name: sampleEnriched.store_name,
        lookup_customer: customer ? { name: customer.name } : 'NOT FOUND',
        lookup_store: store ? { store_name: store.store_name } : 'NOT FOUND'
      });
    }

    // Calculate summary metrics
    const summary = calculateSalesSummary(enrichedSales, metrics);
    
    // Group data for time series analysis
    const timeSeriesData = groupSalesByTime(enrichedSales, groupBy);
    
    // Top performers analysis
    const topPerformers = calculateTopPerformers(enrichedSales);
    
    // Comparison data if requested
    let comparisonData = null;
    if (includeComparisons && start && end) {
      comparisonData = await calculateComparisonMetrics(filter, start, end, userId);
    }

    // Build response
    const response = {
      success: true,
      data: {
        sales: enrichedSales,
        summary,
        timeSeriesData,
        topPerformers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        },
        filters: {
          period: req.query.period,
          start,
          end,
          customer_no,
          store_no,
          product_no,
          status,
          min_amount,
          max_amount,
          payment_status,
          groupBy,
          metrics,
          includeItems,
          includeComparisons,
          sortBy,
          sortOrder
        },
        metadata: {
          generated_at: new Date(),
          report_type: 'advanced_sales',
          total_transactions: totalCount
        }
      }
    };

    if (comparisonData) {
      response.data.comparisons = comparisonData;
    }

    console.log('✅ Advanced sales report generated successfully');
    res.json(response);
  } catch (err) {
    console.error('❌ Error generating advanced sales report:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate advanced sales report',
      error: err.message
    });
  }
};

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
      let sales = await Sale.find(filter);
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
      let sales = await Sale.find(salesFilter);
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
      // Table rows
      data.rows = products.map(p => ({
        product_no: p.product_no,
        product_name: p.product_name,
        category: p.category,
        stock: p.storing_balance,
        price: p.price,
        status: (p.storing_balance === 0) ? 'Out of Stock' : (p.storing_balance < 10 ? 'Low Stock' : 'In Stock'),
      }));
      // Card value
      const totalStock = products.reduce((sum, p) => sum + (p.storing_balance || 0), 0);
      // Graph data (product name and stock)
      data.graphData = products.map(p => ({
        product_name: p.product_name,
        stock: p.storing_balance
      }));
      // Summary for cards
      data.summary = {
        totalProducts: products.length,
        totalStock,
        outOfStock: products.filter(p => (p.storing_balance || 0) === 0).length,
        lowStock: products.filter(p => (p.storing_balance || 0) < 10 && (p.storing_balance || 0) > 0).length,
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
    } else if (type === 'profit-loss') {
      // Profit & Loss Report
      // Revenue: total sales amount
      // Cost of Goods Sold: total purchase amount
      // Expenses: total expenses
      // Gross Profit: Revenue - COGS
      // Net Profit: Gross Profit - Expenses
      const Purchase = require('../models/Purchase');
      const Expense = require('../models/Expense');
      const filter = {};
      if (start && end) {
        filter.sel_date = { $gte: start, $lte: end };
      }
      if (userId) filter.userId = userId;
      // Sales
      const sales = await Sale.find(filter);
      const revenue = sales.reduce((sum, s) => sum + (s.amount || 0), 0);
      // Purchases (COGS)
      const purchaseFilter = {};
      if (start && end) purchaseFilter.created_at = { $gte: start, $lte: end };
      if (userId) purchaseFilter.userId = userId;
      const purchases = await Purchase.find(purchaseFilter);
      const cogs = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
      // Expenses
      const expenseFilter = {};
      if (start && end) expenseFilter.expense_date = { $gte: start, $lte: end };
      if (userId) expenseFilter.userId = userId;
      const expenses = await Expense.find(expenseFilter);
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - totalExpenses;
      data.summary = {
        revenue,
        cogs,
        grossProfit,
        totalExpenses,
        netProfit,
      };
      data.rows = [
        { label: 'Revenue', value: revenue },
        { label: 'Cost of Goods Sold', value: cogs },
        { label: 'Gross Profit', value: grossProfit },
        { label: 'Total Expenses', value: totalExpenses },
        { label: 'Net Profit', value: netProfit },
      ];
    } else if (type === 'tax') {
      // Tax Report
      // Sum tax collected from sales and tax paid on purchases
      const Purchase = require('../models/Purchase');
      const filter = {};
      if (start && end) filter.sel_date = { $gte: start, $lte: end };
      if (userId) filter.userId = userId;
      const sales = await Sale.find(filter);
      const salesTax = sales.reduce((sum, s) => sum + (s.tax || 0), 0);
      const purchaseFilter = {};
      if (start && end) purchaseFilter.created_at = { $gte: start, $lte: end };
      if (userId) purchaseFilter.userId = userId;
      const purchases = await Purchase.find(purchaseFilter);
      const purchaseTax = purchases.reduce((sum, p) => sum + (p.tax || 0), 0);
      data.summary = {
        salesTax,
        purchaseTax,
        netTax: salesTax - purchaseTax
      };
      data.rows = [
        { label: 'Tax Collected from Sales', value: salesTax },
        { label: 'Tax Paid on Purchases', value: purchaseTax },
        { label: 'Net Tax', value: salesTax - purchaseTax },
      ];
    } else if (type === 'balance-sheet') {
      // Balance Sheet Report
      // Assets: Account balances
      // Liabilities: Not directly tracked, but can include unpaid purchases, etc.
      // Equity: Assets - Liabilities
      const Account = require('../models/Account');
      const Purchase = require('../models/Purchase');
      const Sale = require('../models/Sale');
      const Expense = require('../models/Expense');
      // Assets: all account balances
      const accountFilter = {};
      if (userId) accountFilter.userId = userId;
      const accounts = await Account.find(accountFilter);
      const totalAssets = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
      // Liabilities: unpaid purchases
      const purchaseFilter = {};
      if (start && end) purchaseFilter.created_at = { $gte: start, $lte: end };
      if (userId) purchaseFilter.userId = userId;
      const purchases = await Purchase.find(purchaseFilter);
      const totalLiabilities = purchases.reduce((sum, p) => sum + ((p.amount || 0) - (p.paid || 0)), 0);
      // Equity: Assets - Liabilities
      const equity = totalAssets - totalLiabilities;
      data.summary = {
        totalAssets,
        totalLiabilities,
        equity,
      };
      data.rows = [
        { label: 'Total Assets', value: totalAssets },
        { label: 'Total Liabilities', value: totalLiabilities },
        { label: 'Equity', value: equity },
      ];
    } else if (type === 'customer-sales') {
      // Customer Sales Report: group sales by customer
      const filter = {};
      if (start && end) filter.sel_date = { $gte: start, $lte: end };
      if (userId) filter.userId = userId;
      const sales = await Sale.find(filter);
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

// Helper function to calculate profit margin for a sale
function calculateProfitMargin(sale, productMap) {
  if (!sale.items || !Array.isArray(sale.items)) return 0;
  
  let totalRevenue = 0;
  let totalCost = 0;
  
  sale.items.forEach(item => {
    const product = productMap.get ? productMap.get(item.product_no) : productMap[item.product_no];
    const revenue = (item.price || 0) * (item.qty || 0);
    const cost = (product?.cost_price || 0) * (item.qty || 0);
    
    totalRevenue += revenue;
    totalCost += cost;
  });
  
  if (totalRevenue === 0) return 0;
  return ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(2);
}

// Helper function to calculate comprehensive sales summary
function calculateSalesSummary(sales, metricsLevel) {
  const summary = {
    total_sales: sales.length,
    total_revenue: 0,
    total_paid: 0,
    total_outstanding: 0,
    total_profit: 0,
    average_order_value: 0,
    payment_collection_rate: 0,
    total_items_sold: 0,
    unique_customers: new Set(),
    sales_by_status: {
      draft: 0,
      confirmed: 0,
      delivered: 0,
      cancelled: 0
    },
    payment_status_breakdown: {
      paid: 0,
      partial: 0,
      unpaid: 0
    }
  };

  sales.forEach(sale => {
    summary.total_revenue += sale.amount || 0;
    summary.total_paid += sale.paid || 0;
    summary.total_outstanding += (sale.amount || 0) - (sale.paid || 0);
    summary.unique_customers.add(sale.customer_no);
    
    // Count sales by status
    const status = sale.status || 'draft';
    if (summary.sales_by_status.hasOwnProperty(status)) {
      summary.sales_by_status[status]++;
    }
    
    // Count by payment status
    if (summary.payment_status_breakdown.hasOwnProperty(sale.payment_status)) {
      summary.payment_status_breakdown[sale.payment_status]++;
    }
    
    // Count items
    if (sale.items && Array.isArray(sale.items)) {
      summary.total_items_sold += sale.items.reduce((sum, item) => sum + (item.qty || 0), 0);
    }
    
    // Calculate profit if available
    if (sale.profit_margin && !isNaN(sale.profit_margin)) {
      summary.total_profit += (sale.amount || 0) * (parseFloat(sale.profit_margin) / 100);
    }
  });

  // Calculate derived metrics
  summary.average_order_value = summary.total_sales > 0 ? (summary.total_revenue / summary.total_sales).toFixed(2) : 0;
  summary.payment_collection_rate = summary.total_revenue > 0 ? ((summary.total_paid / summary.total_revenue) * 100).toFixed(2) : 0;
  summary.unique_customers_count = summary.unique_customers.size;
  summary.average_items_per_sale = summary.total_sales > 0 ? (summary.total_items_sold / summary.total_sales).toFixed(2) : 0;
  
  // Remove the Set object for JSON serialization
  delete summary.unique_customers;

  if (metricsLevel === 'advanced' || metricsLevel === 'detailed') {
    summary.profit_margin_percentage = summary.total_revenue > 0 ? ((summary.total_profit / summary.total_revenue) * 100).toFixed(2) : 0;
  }

  return summary;
}

// Helper function to calculate comprehensive purchase summary
function calculatePurchaseSummary(purchases, metricsLevel) {
  const summary = {
    total_purchases: purchases.length,
    total_amount: 0,
    total_paid: 0,
    total_outstanding: 0,
    average_purchase_value: 0,
    payment_completion_rate: 0,
    total_items_purchased: 0,
    unique_suppliers: new Set(),
    purchases_by_status: {
      draft: 0,
      pending: 0,
      approved: 0,
      received: 0,
      cancelled: 0
    },
    payment_status_breakdown: {
      paid: 0,
      partial: 0,
      unpaid: 0
    }
  };

  purchases.forEach(purchase => {
    summary.total_amount += purchase.amount || 0;
    summary.total_paid += purchase.paid || 0;
    summary.total_outstanding += (purchase.amount || 0) - (purchase.paid || 0);
    summary.unique_suppliers.add(purchase.supplier_no);
    
    // Count purchases by status
    const status = purchase.status || 'pending';
    if (summary.purchases_by_status.hasOwnProperty(status)) {
      summary.purchases_by_status[status]++;
    }
    
    // Count by payment status
    if (summary.payment_status_breakdown.hasOwnProperty(purchase.payment_status)) {
      summary.payment_status_breakdown[purchase.payment_status]++;
    }
    
    // Count items
    if (purchase.items && Array.isArray(purchase.items)) {
      summary.total_items_purchased += purchase.items.reduce((sum, item) => sum + (item.qty || 0), 0);
    }
  });

  // Calculate derived metrics
  summary.average_purchase_value = summary.total_purchases > 0 ? (summary.total_amount / summary.total_purchases).toFixed(2) : 0;
  summary.payment_completion_rate = summary.total_amount > 0 ? ((summary.total_paid / summary.total_amount) * 100).toFixed(2) : 0;
  summary.unique_suppliers_count = summary.unique_suppliers.size;
  summary.average_items_per_purchase = summary.total_purchases > 0 ? (summary.total_items_purchased / summary.total_purchases).toFixed(2) : 0;
  
  // Remove the Set object for JSON serialization
  delete summary.unique_suppliers;

  return summary;
}

// Helper function to group purchases by time periods
function groupPurchasesByTime(purchases, groupBy) {
  const groupedData = new Map();
  
  purchases.forEach(purchase => {
    const date = new Date(purchase.created_at);
    let key;
    
    switch (groupBy) {
      case 'hour':
        key = format(date, 'yyyy-MM-dd HH:00');
        break;
      case 'day':
        key = format(date, 'yyyy-MM-dd');
        break;
      case 'week':
        key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        break;
      case 'month':
        key = format(date, 'yyyy-MM');
        break;
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
        break;
      case 'year':
        key = format(date, 'yyyy');
        break;
      default:
        key = format(date, 'yyyy-MM-dd');
    }
    
    if (!groupedData.has(key)) {
      groupedData.set(key, {
        period: key,
        purchase_count: 0,
        total_amount: 0,
        total_paid: 0,
        total_items: 0,
        unique_suppliers: new Set()
      });
    }
    
    const group = groupedData.get(key);
    group.purchase_count++;
    group.total_amount += purchase.amount || 0;
    group.total_paid += purchase.paid || 0;
    group.unique_suppliers.add(purchase.supplier_no);
    
    if (purchase.items && Array.isArray(purchase.items)) {
      group.total_items += purchase.items.reduce((sum, item) => sum + (item.qty || 0), 0);
    }
  });
  
  // Convert to array and calculate derived metrics
  return Array.from(groupedData.values()).map(group => ({
    ...group,
    unique_suppliers_count: group.unique_suppliers.size,
    average_purchase_value: group.purchase_count > 0 ? (group.total_amount / group.purchase_count).toFixed(2) : 0,
    unique_suppliers: undefined // Remove Set for JSON serialization
  })).sort((a, b) => a.period.localeCompare(b.period));
}

// Helper function to calculate purchase top performers
function calculatePurchaseTopPerformers(purchases) {
  const supplierPerformance = new Map();
  const productPerformance = new Map();
  const storePerformance = new Map();
  
  purchases.forEach(purchase => {
    // Supplier performance
    if (!supplierPerformance.has(purchase.supplier_no)) {
      supplierPerformance.set(purchase.supplier_no, {
        supplier_no: purchase.supplier_no,
        supplier_name: purchase.supplier_name,
        total_purchases: 0,
        total_amount: 0,
        total_orders: 0,
        last_order_date: null
      });
    }
    
    const supplier = supplierPerformance.get(purchase.supplier_no);
    supplier.total_orders++;
    supplier.total_amount += purchase.amount || 0;
    const orderDate = new Date(purchase.created_at);
    if (!supplier.last_order_date || orderDate > supplier.last_order_date) {
      supplier.last_order_date = orderDate;
    }
    
    // Store performance
    if (!storePerformance.has(purchase.store_no)) {
      storePerformance.set(purchase.store_no, {
        store_no: purchase.store_no,
        store_name: purchase.store_name,
        total_purchases: 0,
        total_amount: 0,
        total_orders: 0
      });
    }
    
    const store = storePerformance.get(purchase.store_no);
    store.total_orders++;
    store.total_amount += purchase.amount || 0;
    
    // Product performance - handle both single product purchases and items array
    if (purchase.items && Array.isArray(purchase.items)) {
      purchase.items.forEach(item => {
        if (!productPerformance.has(item.product_no)) {
          productPerformance.set(item.product_no, {
            product_no: item.product_no,
            product_name: item.product_name,
            total_qty_purchased: 0,
            total_amount: 0,
            total_orders: 0
          });
        }
        
        const product = productPerformance.get(item.product_no);
        product.total_qty_purchased += item.qty || 0;
        product.total_amount += (item.price || 0) * (item.qty || 0);
        product.total_orders++;
      });
    } else if (purchase.product_no) {
      // Handle single product purchases
      if (!productPerformance.has(purchase.product_no)) {
        productPerformance.set(purchase.product_no, {
          product_no: purchase.product_no,
          product_name: purchase.product_name,
          total_qty_purchased: 0,
          total_amount: 0,
          total_orders: 0
        });
      }
      
      const product = productPerformance.get(purchase.product_no);
      product.total_qty_purchased += purchase.qty || 0;
      product.total_amount += purchase.amount || 0;
      product.total_orders++;
    }
  });
  
  return {
    top_suppliers: Array.from(supplierPerformance.values())
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 10),
    top_products: Array.from(productPerformance.values())
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 10),
    top_stores: Array.from(storePerformance.values())
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 10)
  };
}

// Helper function to calculate purchase comparison metrics
async function calculatePurchaseComparisonMetrics(baseFilter, currentStart, currentEnd, userId) {
  const timeDiff = currentEnd - currentStart;
  const previousStart = new Date(currentStart.getTime() - timeDiff);
  const previousEnd = new Date(currentEnd.getTime() - timeDiff);
  
  const previousFilter = {
    ...baseFilter,
    created_at: { $gte: previousStart, $lte: previousEnd }
  };
  
  const [currentPurchases, previousPurchases] = await Promise.all([
    Purchase.find(baseFilter).lean(),
    Purchase.find(previousFilter).lean()
  ]);
  
  const currentMetrics = calculatePurchaseSummary(currentPurchases, 'basic');
  const previousMetrics = calculatePurchaseSummary(previousPurchases, 'basic');
  
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(2);
  };
  
  return {
    current: currentMetrics,
    previous: previousMetrics,
    growth: {
      amount: calculateGrowth(currentMetrics.total_amount, previousMetrics.total_amount),
      purchase_count: calculateGrowth(currentMetrics.total_purchases, previousMetrics.total_purchases),
      average_purchase_value: calculateGrowth(parseFloat(currentMetrics.average_purchase_value), parseFloat(previousMetrics.average_purchase_value)),
      payment_completion_rate: calculateGrowth(parseFloat(currentMetrics.payment_completion_rate), parseFloat(previousMetrics.payment_completion_rate))
    }
  };
}

// Helper function to calculate comprehensive inventory summary
function calculateInventorySummary(inventory, metricsLevel, allStores = []) {
  const summary = {
    total_products: inventory.length,
    total_stock_units: 0,
    total_cost_value: 0,
    total_retail_value: 0,
    total_potential_profit: 0,
    average_margin_percentage: 0,
    stock_status_breakdown: {
      out_of_stock: 0,
      low_stock: 0,
      in_stock: 0,
      overstocked: 0
    },
    categories: new Set(),
    stores: new Set()
  };

  let totalMarginSum = 0;
  let productsWithMargin = 0;

  inventory.forEach(item => {
    summary.total_stock_units += item.storing_balance || 0;
    summary.total_cost_value += item.total_cost_value || 0;
    summary.total_retail_value += item.total_retail_value || 0;
    summary.total_potential_profit += item.potential_profit || 0;
    
    // Count by stock status
    if (summary.stock_status_breakdown.hasOwnProperty(item.stock_status)) {
      summary.stock_status_breakdown[item.stock_status]++;
    }
    
    // Track categories and stores
    if (item.category) summary.categories.add(item.category);
    
    // Calculate average margin
    const margin = parseFloat(item.margin_percentage);
    if (!isNaN(margin)) {
      totalMarginSum += margin;
      productsWithMargin++;
    }
    
    // Track stores from breakdown
    if (item.store_breakdown && Array.isArray(item.store_breakdown)) {
      item.store_breakdown.forEach(store => {
        summary.stores.add(store.store_no);
      });
    }
  });

  // If no store breakdown data, use all stores count
  if (summary.stores.size === 0 && allStores.length > 0) {
    summary.total_stores = allStores.length;
  } else {
    summary.total_stores = summary.stores.size;
  }

  // Calculate derived metrics
  summary.average_margin_percentage = productsWithMargin > 0 ? (totalMarginSum / productsWithMargin).toFixed(2) : 0;
  summary.inventory_turnover_ratio = 0; // Would need sales data to calculate properly
  summary.total_categories = summary.categories.size;
  summary.stock_efficiency = summary.total_products > 0 ? 
    ((summary.stock_status_breakdown.in_stock + summary.stock_status_breakdown.overstocked) / summary.total_products * 100).toFixed(2) : 0;
  
  // Remove Set objects for JSON serialization
  delete summary.categories;
  delete summary.stores;

  return summary;
}

// Helper function to group inventory data
function groupInventoryData(inventory, groupBy) {
  const groupedData = new Map();
  
  inventory.forEach(item => {
    let key;
    
    switch (groupBy) {
      case 'category':
        key = item.category || 'Uncategorized';
        break;
      case 'status':
        key = item.stock_status || 'unknown';
        break;
      case 'store':
        // Group by primary store or 'Multiple' if in multiple stores
        if (item.store_breakdown && item.store_breakdown.length > 0) {
          key = item.store_breakdown.length === 1 ? 
            item.store_breakdown[0].store_name : 'Multiple Stores';
        } else {
          key = 'No Store Data';
        }
        break;
      default:
        key = item.category || 'Uncategorized';
    }
    
    if (!groupedData.has(key)) {
      groupedData.set(key, {
        group_name: key,
        product_count: 0,
        total_stock_units: 0,
        total_cost_value: 0,
        total_retail_value: 0,
        total_potential_profit: 0,
        average_margin: 0
      });
    }
    
    const group = groupedData.get(key);
    group.product_count++;
    group.total_stock_units += item.storing_balance || 0;
    group.total_cost_value += item.total_cost_value || 0;
    group.total_retail_value += item.total_retail_value || 0;
    group.total_potential_profit += item.potential_profit || 0;
  });
  
  // Calculate average margins for each group
  return Array.from(groupedData.values()).map(group => {
    group.average_margin = group.total_retail_value > 0 ? 
      (((group.total_retail_value - group.total_cost_value) / group.total_retail_value) * 100).toFixed(2) : 0;
    return group;
  }).sort((a, b) => b.total_retail_value - a.total_retail_value);
}

// Helper function to calculate inventory top performers
function calculateInventoryTopPerformers(inventory) {
  return {
    highest_value_products: inventory
      .sort((a, b) => (b.total_retail_value || 0) - (a.total_retail_value || 0))
      .slice(0, 10)
      .map(item => ({
        product_no: item.product_no,
        product_name: item.product_name,
        category: item.category,
        stock_units: item.storing_balance,
        retail_value: item.total_retail_value,
        margin_percentage: item.margin_percentage
      })),
    highest_margin_products: inventory
      .filter(item => parseFloat(item.margin_percentage) > 0)
      .sort((a, b) => parseFloat(b.margin_percentage) - parseFloat(a.margin_percentage))
      .slice(0, 10)
      .map(item => ({
        product_no: item.product_no,
        product_name: item.product_name,
        category: item.category,
        margin_percentage: item.margin_percentage,
        potential_profit: item.potential_profit
      })),
    low_stock_alerts: inventory
      .filter(item => item.stock_status === 'low_stock' || item.stock_status === 'out_of_stock')
      .sort((a, b) => (a.storing_balance || 0) - (b.storing_balance || 0))
      .slice(0, 10)
      .map(item => ({
        product_no: item.product_no,
        product_name: item.product_name,
        category: item.category,
        current_stock: item.storing_balance,
        stock_status: item.stock_status
      }))
  };
}

// Helper function to group sales by time periods
function groupSalesByTime(sales, groupBy) {
  const groupedData = new Map();
  
  sales.forEach(sale => {
    const date = new Date(sale.sel_date || sale.created_at);
    let key;
    
    switch (groupBy) {
      case 'hour':
        key = format(date, 'yyyy-MM-dd HH:00');
        break;
      case 'day':
        key = format(date, 'yyyy-MM-dd');
        break;
      case 'week':
        key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        break;
      case 'month':
        key = format(date, 'yyyy-MM');
        break;
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
        break;
      case 'year':
        key = format(date, 'yyyy');
        break;
      default:
        key = format(date, 'yyyy-MM-dd');
    }
    
    if (!groupedData.has(key)) {
      groupedData.set(key, {
        period: key,
        sales_count: 0,
        total_revenue: 0,
        total_paid: 0,
        total_items: 0,
        unique_customers: new Set()
      });
    }
    
    const group = groupedData.get(key);
    group.sales_count++;
    group.total_revenue += sale.amount || 0;
    group.total_paid += sale.paid || 0;
    group.unique_customers.add(sale.customer_no);
    
    if (sale.items && Array.isArray(sale.items)) {
      group.total_items += sale.items.reduce((sum, item) => sum + (item.qty || 0), 0);
    }
  });
  
  // Convert to array and calculate derived metrics
  return Array.from(groupedData.values()).map(group => ({
    ...group,
    unique_customers_count: group.unique_customers.size,
    average_order_value: group.sales_count > 0 ? (group.total_revenue / group.sales_count).toFixed(2) : 0,
    unique_customers: undefined // Remove Set for JSON serialization
  })).sort((a, b) => a.period.localeCompare(b.period));
}

// Helper function to calculate top performers
function calculateTopPerformers(sales) {
  const customerPerformance = new Map();
  const productPerformance = new Map();
  const storePerformance = new Map();
  
  sales.forEach(sale => {
    // Customer performance
    if (!customerPerformance.has(sale.customer_no)) {
      customerPerformance.set(sale.customer_no, {
        customer_no: sale.customer_no,
        customer_name: sale.customer_name,
        total_sales: 0,
        total_revenue: 0,
        total_orders: 0,
        last_order_date: null
      });
    }
    
    const customer = customerPerformance.get(sale.customer_no);
    customer.total_orders++;
    customer.total_revenue += sale.amount || 0;
    const orderDate = new Date(sale.sel_date || sale.created_at);
    if (!customer.last_order_date || orderDate > customer.last_order_date) {
      customer.last_order_date = orderDate;
    }
    
    // Store performance
    if (!storePerformance.has(sale.store_no)) {
      storePerformance.set(sale.store_no, {
        store_no: sale.store_no,
        store_name: sale.store_name,
        total_sales: 0,
        total_revenue: 0,
        total_orders: 0
      });
    }
    
    const store = storePerformance.get(sale.store_no);
    store.total_orders++;
    store.total_revenue += sale.amount || 0;
    
    // Product performance
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        if (!productPerformance.has(item.product_no)) {
          productPerformance.set(item.product_no, {
            product_no: item.product_no,
            product_name: item.product_name,
            total_qty_sold: 0,
            total_revenue: 0,
            total_orders: 0
          });
        }
        
        const product = productPerformance.get(item.product_no);
        product.total_qty_sold += item.qty || 0;
        product.total_revenue += (item.price || 0) * (item.qty || 0);
        product.total_orders++;
      });
    }
  });
  
  return {
    top_customers: Array.from(customerPerformance.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 10),
    top_products: Array.from(productPerformance.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 10),
    top_stores: Array.from(storePerformance.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 10)
  };
}

// Helper function to calculate comparison metrics
async function calculateComparisonMetrics(baseFilter, currentStart, currentEnd, userId) {
  const timeDiff = currentEnd - currentStart;
  const previousStart = new Date(currentStart.getTime() - timeDiff);
  const previousEnd = new Date(currentEnd.getTime() - timeDiff);
  
  const previousFilter = {
    ...baseFilter,
    sel_date: { $gte: previousStart, $lte: previousEnd }
  };
  
  const [currentSales, previousSales] = await Promise.all([
    Sale.find(baseFilter).lean(),
    Sale.find(previousFilter).lean()
  ]);
  
  const currentMetrics = calculateSalesSummary(currentSales, 'basic');
  const previousMetrics = calculateSalesSummary(previousSales, 'basic');
  
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(2);
  };
  
  return {
    current: currentMetrics,
    previous: previousMetrics,
    growth: {
      revenue: calculateGrowth(currentMetrics.total_revenue, previousMetrics.total_revenue),
      sales_count: calculateGrowth(currentMetrics.total_sales, previousMetrics.total_sales),
      average_order_value: calculateGrowth(parseFloat(currentMetrics.average_order_value), parseFloat(previousMetrics.average_order_value)),
      payment_collection_rate: calculateGrowth(parseFloat(currentMetrics.payment_collection_rate), parseFloat(previousMetrics.payment_collection_rate))
    }
  };
}

// Sales Analytics Dashboard Endpoint
exports.getSalesAnalytics = async (req, res) => {
  try {
    const userId = req.user && req.user.userId ? req.user.userId : req.user && req.user._id ? req.user._id : undefined;
    const { period = 'last_30_days' } = req.query;
    const { start, end } = parseDateRange({ period });
    
    const filter = {};
    if (userId) filter.userId = userId;
    if (start && end) filter.sel_date = { $gte: start, $lte: end };
    
    const sales = await Sale.find(filter).lean();
    
    // Calculate key metrics
    const analytics = {
      overview: calculateSalesSummary(sales, 'advanced'),
      trends: groupSalesByTime(sales, 'day'),
      performance: calculateTopPerformers(sales),
      period: period,
      date_range: { start, end }
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (err) {
    console.error('Error generating sales analytics:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics',
      error: err.message
    });
  }
};

// Sales Export Endpoint
exports.exportSalesReport = async (req, res) => {
  try {
    // Get userId from JWT token - check both userId and id fields
    const userId = req.user.userId || req.user.id;
    const { format = 'csv' } = req.query;
    const { start, end } = parseDateRange(req.query);
    
    const filter = {};
    if (userId) filter.userId = userId;
    if (start && end) filter.sel_date = { $gte: start, $lte: end };
    
    // Get sales data
    const sales = await Sale.find(filter).lean();
    
    // Get related data for enrichment
    const [customers, stores, products] = await Promise.all([
      Customer.find({ userId }).lean(),
      Store.find({ userId }).lean(),
      Product.find({ userId }).lean()
    ]);
    
    // Create lookup maps
    const customerMap = Object.fromEntries(customers.map(c => [c.customer_no, c]));
    const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s]));
    const productMap = Object.fromEntries(products.map(p => [p.product_no, p]));
    
    // Flatten sales data for export
    const exportData = [];
    sales.forEach(sale => {
      const customer = customerMap[sale.customer_no];
      const store = storeMap[sale.store_no];
      
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach(item => {
          const product = productMap[item.product_no];
          exportData.push({
            sale_no: sale.sel_no,
            date: sale.sel_date ? sale.sel_date.toISOString().split('T')[0] : '',
            customer_name: customer?.name || customer?.customer_name || '',
            store_name: store?.store_name || '',
            product_name: product?.product_name || item.product_name || '',
            quantity: item.qty || 0,
            unit_price: item.price || 0,
            total_amount: (item.qty || 0) * (item.price || 0),
            discount: sale.discount || 0,
            tax: sale.tax || 0,
            grand_total: sale.amount || 0,
            paid_amount: sale.paid || 0,
            balance_due: (sale.amount || 0) - (sale.paid || 0),
            payment_status: (sale.amount || 0) - (sale.paid || 0) <= 0 ? 'Paid' : (sale.paid > 0 ? 'Partial' : 'Unpaid'),
            status: sale.status || 'confirmed'
          });
        });
      } else {
        // Handle sales without items
        exportData.push({
          sale_no: sale.sel_no,
          date: sale.sel_date ? sale.sel_date.toISOString().split('T')[0] : '',
          customer_name: customer?.name || customer?.customer_name || '',
          store_name: store?.store_name || '',
          product_name: '',
          quantity: 0,
          unit_price: 0,
          total_amount: 0,
          discount: sale.discount || 0,
          tax: sale.tax || 0,
          grand_total: sale.amount || 0,
          paid_amount: sale.paid || 0,
          balance_due: (sale.amount || 0) - (sale.paid || 0),
          payment_status: (sale.amount || 0) - (sale.paid || 0) <= 0 ? 'Paid' : (sale.paid > 0 ? 'Partial' : 'Unpaid'),
          status: sale.status || 'confirmed'
        });
      }
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'csv') {
      const csvHeaders = Object.keys(exportData[0] || {});
      const csvContent = [
        csvHeaders.join(','),
        ...exportData.map(row => 
          csvHeaders.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sales_report_${timestamp}.csv"`);
      res.send(csvContent);
    } else if (format === 'excel' || format === 'xlsx') {
      const XLSX = require('xlsx');
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="sales_report_${timestamp}.xlsx"`);
      res.send(buffer);
    } else if (format === 'pdf') {
      // For PDF, we'll return the data as JSON and let frontend handle PDF generation
      // This avoids server-side PDF generation issues
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="sales_report_${timestamp}.json"`);
      res.json({
        type: 'pdf_data',
        title: 'Sales Report',
        generated_at: new Date().toLocaleDateString(),
        period: start && end ? `${start.toLocaleDateString()} - ${end.toLocaleDateString()}` : 'All time',
        headers: [
          'Sale No', 'Date', 'Customer', 'Store', 'Product', 
          'Qty', 'Unit Price', 'Total', 'Status'
        ],
        data: exportData.map(row => ([
          row.sale_no || '',
          row.date || '',
          row.customer_name || '',
          row.store_name || '',
          row.product_name || '',
          row.quantity || 0,
          `$${(row.unit_price || 0).toFixed(2)}`,
          `$${(row.total_amount || 0).toFixed(2)}`,
          row.payment_status || ''
        ]))
      });
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="sales_report_${timestamp}.json"`);
      res.json(exportData);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported export format. Use csv, excel, xlsx, pdf, or json.'
      });
    }
  } catch (err) {
    console.error('Error exporting sales report:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to export sales report',
      error: err.message
    });
  }
};

// Purchase Export Endpoint
exports.exportPurchaseReport = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { format = 'csv' } = req.query;
    const { start, end } = parseDateRange(req.query);
    
    const filter = {};
    if (userId) filter.userId = userId;
    if (start && end) filter.created_at = { $gte: start, $lte: end };
    
    // Get purchases data
    const purchases = await Purchase.find(filter).lean();
    
    // Get related data for enrichment
    const [suppliers, stores, products] = await Promise.all([
      Supplier.find({ userId }).lean(),
      Store.find({ userId }).lean(),
      Product.find({ userId }).lean()
    ]);
    
    // Create lookup maps
    const supplierMap = Object.fromEntries(suppliers.map(s => [s.supplier_no, s]));
    const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s]));
    const productMap = Object.fromEntries(products.map(p => [p.product_no, p]));
    
    // Flatten purchase data for export
    const exportData = [];
    purchases.forEach(purchase => {
      const supplier = supplierMap[purchase.supplier_no];
      const store = storeMap[purchase.store_no];
      
      if (purchase.items && purchase.items.length > 0) {
        purchase.items.forEach(item => {
          const product = productMap[item.product_no];
          exportData.push({
            purchase_no: purchase.purchase_no,
            date: purchase.created_at ? purchase.created_at.toISOString().split('T')[0] : '',
            supplier_name: supplier?.supplier_name || '',
            store_name: store?.store_name || '',
            product_name: product?.product_name || item.product_name || '',
            quantity: item.qty || 0,
            unit_cost: item.cost || 0,
            total_amount: (item.qty || 0) * (item.cost || 0),
            discount: purchase.discount || 0,
            tax: purchase.tax || 0,
            grand_total: purchase.amount || 0,
            paid_amount: purchase.paid || 0,
            balance_due: (purchase.amount || 0) - (purchase.paid || 0),
            payment_status: (purchase.amount || 0) - (purchase.paid || 0) <= 0 ? 'Paid' : (purchase.paid > 0 ? 'Partial' : 'Unpaid'),
            status: purchase.status || 'confirmed'
          });
        });
      } else {
        exportData.push({
          purchase_no: purchase.purchase_no,
          date: purchase.created_at ? purchase.created_at.toISOString().split('T')[0] : '',
          supplier_name: supplier?.supplier_name || '',
          store_name: store?.store_name || '',
          product_name: '',
          quantity: 0,
          unit_cost: 0,
          total_amount: 0,
          discount: purchase.discount || 0,
          tax: purchase.tax || 0,
          grand_total: purchase.amount || 0,
          paid_amount: purchase.paid || 0,
          balance_due: (purchase.amount || 0) - (purchase.paid || 0),
          payment_status: (purchase.amount || 0) - (purchase.paid || 0) <= 0 ? 'Paid' : (purchase.paid > 0 ? 'Partial' : 'Unpaid'),
          status: purchase.status || 'confirmed'
        });
      }
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (exportData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No purchase data found for export'
      });
    }

    if (format === 'csv') {
      const csvHeaders = Object.keys(exportData[0]);
      const csvContent = [
        csvHeaders.join(','),
        ...exportData.map(row => 
          csvHeaders.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="purchase_report_${timestamp}.csv"`);
      res.send(csvContent);
    } else if (format === 'excel' || format === 'xlsx') {
      const XLSX = require('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Purchase Report');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="purchase_report_${timestamp}.xlsx"`);
      res.send(buffer);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="purchase_report_${timestamp}.json"`);
      res.json(exportData);
    } else if (format === 'pdf') {
      // PDF format not supported for purchase export - return error
      res.status(400).json({
        success: false,
        message: 'PDF export not supported for purchase reports. Please use CSV, Excel, or JSON format.'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported export format. Use csv, excel, xlsx, or json.'
      });
    }
    
  } catch (err) {
    console.error('Purchase export error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export purchase report', 
      error: err.message 
    });
  }
};

// Inventory Export Endpoint
exports.exportInventoryReport = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { format = 'csv' } = req.query;
    
    // Get inventory data using the same logic as advanced inventory report
    const [stores, products, storeProducts] = await Promise.all([
      Store.find({ userId }).lean(),
      Product.find({ userId }).lean(),
      StoreProduct.find({ userId }).lean()
    ]);
    
    // Create lookup maps
    const storeMap = Object.fromEntries(stores.map(s => [s.store_no, s]));
    const productMap = Object.fromEntries(products.map(p => [p.product_no, p]));
    
    // Build inventory data
    const exportData = storeProducts.map(sp => {
      const store = storeMap[sp.store_no];
      const product = productMap[sp.product_no];
      
      const currentStock = sp.qty || 0;
      const retailPrice = sp.retail_price || 0;
      const costPrice = sp.cost_price || 0;
      const totalRetailValue = currentStock * retailPrice;
      const totalCostValue = currentStock * costPrice;
      const potentialProfit = totalRetailValue - totalCostValue;
      
      return {
        store_name: store?.store_name || '',
        product_name: product?.product_name || '',
        category: product?.category || '',
        current_stock: currentStock,
        min_stock: sp.min_stock || 0,
        max_stock: sp.max_stock || 0,
        cost_price: costPrice,
        retail_price: retailPrice,
        total_cost_value: totalCostValue,
        total_retail_value: totalRetailValue,
        potential_profit: potentialProfit,
        profit_margin: retailPrice > 0 ? (((retailPrice - costPrice) / retailPrice) * 100).toFixed(2) : 0,
        stock_status: currentStock <= (sp.min_stock || 0) ? 'Low Stock' : 
                     currentStock >= (sp.max_stock || 999999) ? 'Overstock' : 'Normal',
        last_updated: sp.updated_at ? sp.updated_at.toISOString().split('T')[0] : ''
      };
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (exportData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No inventory data found for export'
      });
    }

    if (format === 'csv') {
      const csvHeaders = Object.keys(exportData[0]);
      const csvContent = [
        csvHeaders.join(','),
        ...exportData.map(row => 
          csvHeaders.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="inventory_report_${timestamp}.csv"`);
      res.send(csvContent);
    } else if (format === 'excel' || format === 'xlsx') {
      const XLSX = require('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Report');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="inventory_report_${timestamp}.xlsx"`);
      res.send(buffer);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="inventory_report_${timestamp}.json"`);
      res.json(exportData);
    } else if (format === 'pdf') {
      // PDF format not supported for inventory export - return error
      res.status(400).json({
        success: false,
        message: 'PDF export not supported for inventory reports. Please use CSV, Excel, or JSON format.'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported export format. Use csv, excel, xlsx, or json.'
      });
    }
    
  } catch (err) {
    console.error('Inventory export error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export inventory report', 
      error: err.message 
    });
  }
};

// Advanced Financial Report with Enterprise Features
exports.generateAdvancedFinancialReport = async (req, res) => {
  try {
    // Get userId from JWT token - check both userId and id fields
    const userId = req.user.userId || req.user.id;
    console.log('🔍 JWT payload:', req.user);
    console.log('🔍 Extracted userId:', userId);
    
    const { start, end } = parseDateRange(req.query);
    const {
      account_type,
      category,
      min_amount,
      max_amount,
      groupBy = 'month',
      includeComparisons = true,
      includeForecasting = true,
      reportType = 'comprehensive',
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build base filter
    const baseFilter = {};
    if (userId) baseFilter.userId = userId;
    if (start && end) baseFilter.created_at = { $gte: start, $lte: end };

    // Get all financial data
    const [sales, purchases, expenses, accounts, deposits, withdrawals, suppliers, payments, paymentOuts] = await Promise.all([
      Sale.find(baseFilter).lean(),
      Purchase.find(baseFilter).lean(),
      Expense.find(baseFilter).lean(),
      Account.find(userId ? { userId } : {}).lean(),
      require('../models/Deposit').find(baseFilter).lean().catch(() => []),
      require('../models/Withdrawal').find(baseFilter).lean().catch(() => []),
      require('../models/Supplier').find(userId ? { userId } : {}).lean().catch(() => []),
      require('../models/Payment').find(baseFilter).lean().catch(() => []),
      require('../models/PaymentOut').find(baseFilter).lean().catch(() => [])
    ]);

    // Generate different financial statements based on report type
    let response = {};
    
    if (reportType === 'profit_loss') {
      const profitLoss = generateProfitLossStatement(sales, purchases, expenses);
      const timeSeries = groupFinancialDataByTime(sales, purchases, expenses, groupBy);
      
      response = {
        statement_type: 'profit_loss',
        profit_loss: profitLoss,
        time_series: timeSeries,
        metadata: {
          report_type: reportType,
          period: { start, end },
          group_by: groupBy,
          generated_at: new Date()
        }
      };
    } else if (reportType === 'balance_sheet') {
      const balanceSheet = generateBalanceSheet(accounts, sales, purchases, expenses, deposits, withdrawals, suppliers, payments, paymentOuts);
      
      response = {
        statement_type: 'balance_sheet',
        balance_sheet: balanceSheet,
        metadata: {
          report_type: reportType,
          period: { start, end },
          generated_at: new Date()
        }
      };
    } else if (reportType === 'cash_flow') {
      const cashFlow = generateCashFlowStatement(sales, purchases, expenses, deposits, withdrawals);
      const timeSeries = groupFinancialDataByTime(sales, purchases, expenses, groupBy);
      
      response = {
        statement_type: 'cash_flow',
        cash_flow: cashFlow,
        time_series: timeSeries,
        metadata: {
          report_type: reportType,
          period: { start, end },
          group_by: groupBy,
          generated_at: new Date()
        }
      };
    } else {
      // Comprehensive report (default)
      const profitLoss = generateProfitLossStatement(sales, purchases, expenses);
      const balanceSheet = generateBalanceSheet(accounts, sales, purchases, expenses, deposits, withdrawals, suppliers, payments, paymentOuts);
      const cashFlow = generateCashFlowStatement(sales, purchases, expenses, deposits, withdrawals);
      const timeSeries = groupFinancialDataByTime(sales, purchases, expenses, groupBy);
      const categoryBreakdown = calculateCategoryBreakdown(sales, purchases, expenses);
      
      // Calculate summary first before using it
      const summary = calculateFinancialSummary(sales, purchases, expenses, deposits, withdrawals);
      const financialRatios = calculateFinancialRatios(summary, sales, purchases, expenses);
      
      let forecasting = null;
      if (includeForecasting) {
        forecasting = generateFinancialForecasting(timeSeries);
      }
      
      let comparisons = null;
      if (includeComparisons && start && end) {
        comparisons = await calculateFinancialComparisonMetrics(baseFilter, start, end, userId);
      }

      const transactions = compileAllTransactions(sales, purchases, expenses, deposits, withdrawals);

      response = {
        statement_type: 'comprehensive',
        profit_loss: profitLoss,
        balance_sheet: balanceSheet,
        cash_flow: cashFlow,
        summary: {
          ...summary,
          revenue_growth: comparisons?.growth?.revenue || 0,
          expense_growth: comparisons?.growth?.expenses || 0,
          profit_growth: comparisons?.growth?.profit || 0,
          cash_flow_growth: comparisons?.growth?.cash_flow || 0
        },
        time_series: timeSeries,
        category_breakdown: categoryBreakdown,
        financial_ratios: financialRatios,
        forecasting,
        transactions: transactions.slice(0, 1000),
        comparisons,
        metadata: {
          report_type: reportType,
          period: { start, end },
          group_by: groupBy,
          generated_at: new Date(),
          total_transactions: transactions.length
        }
      };
    }

    console.log('✅ Advanced financial report generated successfully');
    res.json({
      success: true,
      data: response
    });

  } catch (err) {
    console.error('❌ Error generating advanced financial report:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial report',
      error: err.message
    });
  }
};

// Sales Forecasting Endpoint (Simple prediction based on historical data)
exports.getSalesForecasting = async (req, res) => {
  try {
    const userId = req.user && req.user.userId ? req.user.userId : req.user && req.user._id ? req.user._id : undefined;
    const { months = 3 } = req.query;
    
    // Get last 6 months of data for forecasting
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const filter = {
      sel_date: { $gte: sixMonthsAgo, $lte: new Date() }
    };
    if (userId) filter.userId = userId;
    
    const sales = await Sale.find(filter).lean();
    
    // Group by month
    const monthlyData = {};
    sales.forEach(sale => {
      const monthKey = sale.sel_date ? format(sale.sel_date, 'yyyy-MM') : '';
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, count: 0 };
      }
      monthlyData[monthKey].revenue += sale.amount || 0;
      monthlyData[monthKey].count += 1;
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const monthlyRevenues = sortedMonths.map(month => monthlyData[month].revenue);
    
    // Simple linear trend forecasting
    const forecastData = [];
    if (monthlyRevenues.length >= 2) {
      // Calculate trend
      const n = monthlyRevenues.length;
      const sumX = (n * (n + 1)) / 2;
      const sumY = monthlyRevenues.reduce((a, b) => a + b, 0);
      const sumXY = monthlyRevenues.reduce((sum, revenue, index) => sum + revenue * (index + 1), 0);
      const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // Generate forecast
      for (let i = 1; i <= months; i++) {
        const forecastValue = intercept + slope * (n + i);
        const forecastDate = new Date();
        forecastDate.setMonth(forecastDate.getMonth() + i);
        
        forecastData.push({
          period: format(forecastDate, 'yyyy-MM'),
          predicted_revenue: Math.max(0, Math.round(forecastValue * 100) / 100),
          confidence: Math.max(0.5, 1 - (i * 0.1)) // Decreasing confidence over time
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        historical_data: sortedMonths.map(month => ({
          period: month,
          actual_revenue: monthlyData[month].revenue,
          order_count: monthlyData[month].count
        })),
        forecast: forecastData,
        metadata: {
          forecast_months: months,
          historical_months: sortedMonths.length,
          generated_at: new Date()
        }
      }
    });
  } catch (err) {
    console.error('Error generating sales forecast:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sales forecast',
      error: err.message
    });
  }
};

// Advanced Purchase Report with Enterprise Features
exports.generateAdvancedPurchaseReport = async (req, res) => {
  try {
    // Get userId from JWT token - check both userId and id fields
    const userId = req.user.userId || req.user.id;
    console.log('🔍 JWT payload:', req.user);
    console.log('🔍 Extracted userId:', userId);
    
    const { start, end } = parseDateRange(req.query);
    const {
      supplier_no,
      store_no,
      product_no,
      status,
      min_amount,
      max_amount,
      payment_status,
      groupBy = 'day', // day, week, month, quarter, year
      metrics = 'basic', // basic, advanced, detailed
      includeItems = true,
      includeComparisons = false,
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    console.log('🔍 Generating advanced purchase report with filters:', {
      userId, start, end, supplier_no, store_no, product_no, status, min_amount, max_amount, payment_status, groupBy, metrics
    });

    // Build base filter
    const filter = {};
    if (userId) filter.userId = userId;
    if (start && end) filter.created_at = { $gte: start, $lte: end };
    if (supplier_no) filter.supplier_no = Number(supplier_no);
    if (store_no) filter.store_no = Number(store_no);
    if (status) filter.status = status;
    if (min_amount || max_amount) {
      filter.amount = {};
      if (min_amount) filter.amount.$gte = Number(min_amount);
      if (max_amount) filter.amount.$lte = Number(max_amount);
    }
    
    // Payment status filter
    if (payment_status) {
      switch (payment_status) {
        case 'paid':
          filter.$expr = { $gte: ['$paid', '$amount'] };
          break;
        case 'partial':
          filter.$expr = { $and: [{ $gt: ['$paid', 0] }, { $lt: ['$paid', '$amount'] }] };
          break;
        case 'unpaid':
          filter.paid = { $lte: 0 };
          break;
      }
    }

    // Get purchases with pagination and sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [purchases, totalCount] = await Promise.all([
      Purchase.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Purchase.countDocuments(filter)
    ]);

    console.log(`📊 Found ${purchases.length} purchases out of ${totalCount} total`);

    // Filter by product if specified
    let filteredPurchases = purchases;
    if (product_no) {
      filteredPurchases = purchases.filter(purchase => 
        purchase.items && purchase.items.some(item => item.product_no === Number(product_no))
      );
    }

    // Get related data for enrichment
    console.log('🔍 Using userId for queries:', userId);
    
    const Supplier = require('../models/Supplier');
    const [suppliers, stores, accounts, products] = await Promise.all([
      Supplier.find({ userId }).lean(),
      Store.find({ userId }).lean(),
      Account.find({ userId }).lean(),
      Product.find({ userId }).lean()
    ]);
    
    console.log(`📊 Found related data: ${suppliers.length} suppliers, ${stores.length} stores, ${accounts.length} accounts, ${products.length} products`);

    // Create lookup maps with both string and number keys to handle type mismatches
    const supplierMap = new Map();
    suppliers.forEach(s => {
      supplierMap.set(s.supplier_no, s);
      supplierMap.set(String(s.supplier_no), s);
      supplierMap.set(Number(s.supplier_no), s);
    });
    
    const storeMap = new Map();
    stores.forEach(s => {
      storeMap.set(s.store_no, s);
      storeMap.set(String(s.store_no), s);
      storeMap.set(Number(s.store_no), s);
    });
    
    const accountMap = Object.fromEntries(accounts.map(a => [a.account_id, a]));
    const productMap = new Map();
    products.forEach(p => {
      productMap.set(p.product_no, p);
      productMap.set(String(p.product_no), p);
      productMap.set(Number(p.product_no), p);
    });

    // Enrich purchase data
    const enrichedPurchases = filteredPurchases.map(purchase => {
      const supplier = supplierMap.get(purchase.supplier_no);
      const store = storeMap.get(purchase.store_no);
      const account = accountMap[purchase.account_id];
      
      // Calculate derived metrics
      const balanceDue = (purchase.amount || 0) - (purchase.paid || 0);
      const paymentStatus = balanceDue <= 0 ? 'paid' : (purchase.paid > 0 ? 'partial' : 'unpaid');
      
      let enrichedItems = [];
      if (includeItems && purchase.items) {
        enrichedItems = purchase.items.map(item => {
          const product = productMap.get(item.product_no);
          return {
            ...item,
            product_name: product?.product_name || '',
            category: product?.category || '',
            current_stock: product?.storing_balance || 0,
            total_cost: (item.price || 0) * (item.qty || 0)
          };
        });
      }

      return {
        ...purchase,
        supplier_name: supplier?.name || supplier?.supplier_name || `Supplier ${purchase.supplier_no}`,
        supplier_email: supplier?.email || '',
        supplier_phone: supplier?.phone || '',
        store_name: store?.store_name || `Store ${purchase.store_no}`,
        account_name: account?.name || account?.account_name || '',
        balance_due: balanceDue,
        payment_status: paymentStatus,
        items: enrichedItems
      };
    });

    // Calculate summary metrics
    const summary = calculatePurchaseSummary(enrichedPurchases, metrics);
    
    // Group data for time series analysis
    const timeSeriesData = groupPurchasesByTime(enrichedPurchases, groupBy);
    
    // Top performers analysis
    const topPerformers = calculatePurchaseTopPerformers(enrichedPurchases);
    
    // Comparison data if requested
    let comparisonData = null;
    if (includeComparisons && start && end) {
      comparisonData = await calculatePurchaseComparisonMetrics(filter, start, end, userId);
    }

    // Build response
    const response = {
      success: true,
      data: {
        purchases: enrichedPurchases,
        summary,
        timeSeriesData,
        topPerformers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        },
        filters: {
          period: req.query.period,
          start,
          end,
          supplier_no,
          store_no,
          product_no,
          status,
          payment_status,
          min_amount,
          max_amount
        },
        metadata: {
          generated_at: new Date(),
          report_type: 'advanced_purchase',
          metrics_level: metrics,
          total_suppliers: suppliers.length,
          total_stores: stores.length,
          total_products: products.length
        }
      }
    };

    if (comparisonData) {
      response.data.comparisons = comparisonData;
    }

    console.log('✅ Advanced purchase report generated successfully');
    res.json(response);
    
  } catch (err) {
    console.error('❌ Error generating advanced purchase report:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate purchase report', 
      error: err.message 
    });
  }
};

// Advanced Inventory Report with Enterprise Features
exports.generateAdvancedInventoryReport = async (req, res) => {
  try {
    // Get userId from JWT token - check both userId and id fields
    const userId = req.user.userId || req.user.id;
    console.log('🔍 JWT payload:', req.user);
    console.log('🔍 Extracted userId:', userId);
    
    const {
      store_no,
      category,
      min_stock,
      max_stock,
      stock_status, // low_stock, out_of_stock, in_stock, overstocked
      min_value,
      max_value,
      groupBy = 'category', // category, store, status
      metrics = 'basic', // basic, advanced, detailed
      includeMovements = false,
      includeValuation = true,
      page = 1,
      limit = 50,
      sortBy = 'storing_balance',
      sortOrder = 'desc'
    } = req.query;

    console.log('🔍 Generating advanced inventory report with filters:', {
      userId, store_no, category, min_stock, max_stock, stock_status, min_value, max_value, groupBy, metrics
    });

    // Build base filter for products
    const filter = {};
    if (userId) filter.userId = userId;
    if (category) filter.category = category;
    if (min_stock || max_stock) {
      filter.storing_balance = {};
      if (min_stock) filter.storing_balance.$gte = Number(min_stock);
      if (max_stock) filter.storing_balance.$lte = Number(max_stock);
    }

    // Stock status filter
    if (stock_status) {
      switch (stock_status) {
        case 'out_of_stock':
          filter.storing_balance = { $lte: 0 };
          break;
        case 'low_stock':
          filter.storing_balance = { $gt: 0, $lte: 10 }; // Configurable threshold
          break;
        case 'in_stock':
          filter.storing_balance = { $gt: 10, $lte: 100 }; // Normal range
          break;
        case 'overstocked':
          filter.storing_balance = { $gt: 100 }; // High stock
          break;
      }
    }

    // Get products with pagination and sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);

    console.log(`📊 Found ${products.length} products out of ${totalCount} total`);

    // Get store products for detailed store-wise inventory
    const StoreProduct = require('../models/StoreProduct');
    // Always fetch store products to ensure store information is available
    // Only filter by specific store if store_no is provided
    const storeFilter = { userId };
    if (store_no) storeFilter.store_no = Number(store_no);
    
    const storeProducts = await StoreProduct.find(storeFilter).lean();

    // Get related data for enrichment
    const stores = await Store.find({ userId }).lean();
    const storeMap = new Map();
    stores.forEach(s => {
      storeMap.set(s.store_no, s);
      storeMap.set(String(s.store_no), s);
      storeMap.set(Number(s.store_no), s);
    });

    // Create store product lookup
    const storeProductMap = new Map();
    storeProducts.forEach(sp => {
      const key = `${sp.product_no}-${sp.store_no}`;
      storeProductMap.set(key, sp);
    });

    // Create a map of all store products by product_no for quick lookup
    const allStoreProductsMap = new Map();
    if (!store_no) {
      // If no specific store filter, get all store products for accurate store information
      const allStoreProducts = await StoreProduct.find({ userId }).lean();
      allStoreProducts.forEach(sp => {
        if (!allStoreProductsMap.has(sp.product_no)) {
          allStoreProductsMap.set(sp.product_no, []);
        }
        allStoreProductsMap.get(sp.product_no).push(sp);
      });
    }

    // Enrich inventory data
    const enrichedInventory = products.map(product => {
      // Calculate stock status
      const stock = product.storing_balance || 0;
      let stockStatus = 'in_stock';
      if (stock <= 0) stockStatus = 'out_of_stock';
      else if (stock <= 10) stockStatus = 'low_stock';
      else if (stock > 100) stockStatus = 'overstocked';

      // Calculate inventory value
      const unitCost = product.cost || 0;
      const unitPrice = product.price || 0;
      const totalCostValue = stock * unitCost;
      const totalRetailValue = stock * unitPrice;
      const potentialProfit = totalRetailValue - totalCostValue;

      // Get store-wise breakdown
      let storeBreakdown = [];
      if (store_no) {
        // If specific store is filtered, use the pre-fetched store products
        storeBreakdown = storeProducts
          .filter(sp => sp.product_no === product.product_no)
          .map(sp => {
            const store = storeMap.get(sp.store_no);
            return {
              store_no: sp.store_no,
              store_name: store?.store_name || `Store ${sp.store_no}`,
              qty: sp.qty || 0,
              last_updated: sp.updated_at
            };
          });
      } else {
        // If no specific store filter, get all stores for this product
        const productStoreEntries = allStoreProductsMap.get(product.product_no) || [];
        storeBreakdown = productStoreEntries.map(sp => {
          const store = storeMap.get(sp.store_no);
          return {
            store_no: sp.store_no,
            store_name: store?.store_name || `Store ${sp.store_no}`,
            qty: sp.qty || 0,
            last_updated: sp.updated_at
          };
        });
      }

      return {
        ...product,
        stock_status: stockStatus,
        total_cost_value: totalCostValue,
        total_retail_value: totalRetailValue,
        potential_profit: potentialProfit,
        margin_percentage: unitPrice > 0 ? (((unitPrice - unitCost) / unitPrice) * 100).toFixed(2) : 0,
        turnover_ratio: 0, // Would need sales data to calculate
        store_breakdown: storeBreakdown
      };
    });

    // Filter by value if specified
    let filteredInventory = enrichedInventory;
    if (min_value || max_value) {
      filteredInventory = enrichedInventory.filter(item => {
        const value = item.total_retail_value;
        if (min_value && value < Number(min_value)) return false;
        if (max_value && value > Number(max_value)) return false;
        return true;
      });
    }

    // Calculate summary metrics
    const summary = calculateInventorySummary(filteredInventory, metrics, stores);
    
    // Group data for analysis
    const groupedData = groupInventoryData(filteredInventory, groupBy);
    
    // Top performers analysis
    const topPerformers = calculateInventoryTopPerformers(filteredInventory);

    // Build response
    const response = {
      success: true,
      data: {
        inventory: filteredInventory,
        summary,
        groupedData,
        topPerformers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        },
        filters: {
          store_no,
          category,
          min_stock,
          max_stock,
          stock_status,
          min_value,
          max_value
        },
        metadata: {
          generated_at: new Date(),
          report_type: 'advanced_inventory',
          metrics_level: metrics,
          total_categories: [...new Set(products.map(p => p.category).filter(Boolean))].length
        }
      }
    };

    console.log('✅ Advanced inventory report generated successfully');
    res.json(response);
    
  } catch (err) {
    console.error('❌ Error generating advanced sales report:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate advanced sales report',
      error: err.message
    });
  }
};
