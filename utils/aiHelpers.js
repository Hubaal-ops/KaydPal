const Account = require('../models/Account');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const StoreProduct = require('../models/StoreProduct');

/**
 * Enhanced AI Helper Functions for KaydPal
 * Provides advanced query understanding, analytics integration, and business insights
 */

// Enhanced query intent detection with better NLP
function analyzeQueryIntent(message) {
  const content = message.toLowerCase();
  
  // Define intent patterns with confidence scoring for both English and Somali
  const intentPatterns = {
    // Financial queries
    financial: {
      keywords: [
        'profit', 'loss', 'revenue', 'income', 'expense', 'cash flow', 'balance sheet', 'financial report',
        'faaide', 'khasaarat', 'dakhliga', 'kharash', 'lacagta', 'warbixinta maaliyadda',
        'haray', 'lacag', 'bilansh', 'bilansiga', 'faayida',
        'faa\'iido', 'khasaaro', 'dakhli', 'dakhliga', 'lacag soo-gal', 'kharash', 
        'socodka lacagta', 'qulqulka lacagta', 'xaashida xisaabeed', 'balansiga', 'warbixinta maaliyadeed',
        'hadhaag', 'maalgelin', 'hanti lacageed'
      ],
      confidence: 0
    },
    // Account queries
    accounts: {
      keywords: [
        'account', 'balance', 'money', 'bank', 'cash', 'funds',
        'akoon', 'balans', 'lacag', 'bangi', 'kharash', 'haray', 'bilansh', 'bilansiga',
        'xisaab', 'hadhaag', 'lacag', 'bangi', 'kharash', 'hadhaagga'
      ],
      confidence: 0
    },
    // Inventory queries
    inventory: {
      keywords: [
        'product', 'inventory', 'stock', 'item', 'goods', 'storing', 'warehouse',
        'alaab', 'kaydka', 'kaydinta', 'alabta', 'alab', 'kaydin', 'bakoor',
        'alabtaada', 'alabtayda', 'kaydkaaga', 'kaydkayga',
        'badeecad', 'kayd', 'kayd badeeco', 'badeeco', 'kaydin', 'bakhaar',
        'badeecadaada', 'badeecadayda', 'kaydkaaga', 'kaydkayga',
        'sahay', 'shay', 'qodob', 'alaab', 'sahay yari', 'kayd la\'aan', 'alaab ka dhammaatay'
      ],
      confidence: 0
    },
    // Sales queries
    sales: {
      keywords: [
        'sale', 'sell', 'revenue', 'transaction', 'order', 'invoice', 'customer order',
        'iibka', 'iibi', 'dakhliga', 'wareejinta', 'dalabka', 'fatora', 'dalabka macmiilka',
        'iibkaaga', 'iibkayga', 'iibka bishii', 'iibka sanan', 'dakhligaada',
        'iib', 'iibka', 'iibin', 'dakhli', 'dakhliga', 'hawlgal maaliyadeed', 'dalab', 'qaansheegad',
        'iibkaaga', 'iibkayga', 'iibka bishan', 'iibka bishii', 'iibka bishii hore', 'iibka sanadkan'
      ],
      confidence: 0
    },
    // Purchase queries
    purchases: {
      keywords: [
        'purchase', 'buy', 'procurement', 'supplier order', 'vendor', 'cost',
        'iibsasho', 'iibso', 'dalabka', 'dalabka dhaqdhaqaaqa', 'kharash',
        'iibsashada', 'iibsashadayda', 'dalabkaaga', 'dalabkayga',
        'iibsasho', 'iibso', 'dalabka alaab-qeybiye', 'kharash', 'soo iibsi', 'qandaraas',
        'iibsashada', 'iibsashadayda', 'dalabkaaga', 'dalabkayga'
      ],
      confidence: 0
    },
    // Customer queries
    customers: {
      keywords: [
        'customer', 'client', 'buyer', 'consumer', 'customer debt', 'receivable',
        'macmiil', 'macmil', 'iibiyaha', 'deynka macmiilka', 'lacashta',
        'macmiilkaaga', 'macmiilkayga', 'deynka', 'deynkayga', 'deynkaaga',
        'macaamiil', 'macmil', 'iibiyaha', 'daynka macaamiilka', 'lacashta',
        'macaamiilkaaga', 'macaamiilkayga', 'daynka', 'daynkayga', 'daynkaaga',
        'lacagta daynta kuma maqan', 'daynta kuma maqan', 'lacag la sugayo', 'la qaabilo'
      ],
      confidence: 0
    },
    // Supplier queries
    suppliers: {
      keywords: [
        'supplier', 'vendor', 'provider', 'supplier debt', 'payable',
        'dhaqdhaqaaq', 'iibiyaha', 'bixinta', 'deynka dhaqdhaqaaqa',
        'dhaqdhaqaaqaaga', 'dhaqdhaqaaqayga', 'deynkaaga', 'deynkayga',
        'alaab-qeybiye', 'alaab-qeybiyaha', 'bixinta', 'daynka alaab-qeybiye',
        'alaab-qeybiye-kaaga', 'alaab-qeybiye-kayga',
        'lacagta daynta kuma maqan', 'daynta kuma maqan', 'lacag la bixinayo'
      ],
      confidence: 0
    },
    // Analytics queries
    analytics: {
      keywords: [
        'trend', 'analysis', 'compare', 'growth', 'performance', 'metric', 'kpi', 'insight',
        'horumar', 'falcelinta', 'isma la', 'koritaanka', 'waxqabadka', 'tilmaamaha',
        'horumarka', 'koritaanka', 'waxqabadkaaga', 'waxqabadkayga',
        'isbeddel', 'falanqayn', 'is barbar dhig', 'isma la', 'koritaanka', 'waxqabad', 'tilmaamaha',
        'jihada socdka', 'jihadaha', 'koboc', 'horumar', 'cabbir', 'kpi', 'tilmaame muhiim ah', 
        'faham', 'aragti ganacsi'
      ],
      confidence: 0
    },
    // Report queries
    reports: {
      keywords: [
        'report', 'summary', 'overview', 'dashboard', 'export', 'statement',
        'warbixinta', 'soo koobay', 'guud', 'dashboard', 'dhoofinta', 'bayaanka',
        'warbixintayda', 'warbixintaaga', 'soo koobinta', 'bayaankaaga',
        'warbixin', 'soo koobid', 'guudmar', 'jaantus xogeed', 'dhoofin', 'bayaanka', 'xisaab celin'
      ],
      confidence: 0
    }
  };

  // Calculate confidence scores
  Object.keys(intentPatterns).forEach(intent => {
    const pattern = intentPatterns[intent];
    pattern.confidence = pattern.keywords.reduce((score, keyword) => {
      if (content.includes(keyword)) {
        // Give higher score for exact matches and context
        const contextBonus = content.includes(`${keyword} report`) || 
                           content.includes(`${keyword} analysis`) || 
                           content.includes(`${keyword} warbixinta`) || 
                           content.includes(`${keyword} falcelinta`) ? 0.2 : 0;
        return score + 1 + contextBonus;
      }
      return score;
    }, 0) / pattern.keywords.length;
  });

  // Find the intent with highest confidence
  const topIntent = Object.entries(intentPatterns)
    .sort(([,a], [,b]) => b.confidence - a.confidence)[0];

  return {
    intent: topIntent[0],
    confidence: topIntent[1].confidence,
    allIntents: intentPatterns
  };
}

// Enhanced time period extraction
function extractTimeContext(content) {
  const contentLower = content.toLowerCase();
  
  const timePatterns = {
    today: ['today', 'this day', 'maanta', 'maantadan'],
    yesterday: ['yesterday', 'shalay', 'shalaydan'],
    thisWeek: ['this week', 'current week', 'usbuucan', 'usbuucan hadda'],
    lastWeek: ['last week', 'previous week', 'usbuucii hore', 'usbuucii la soo dhaafay'],
    thisMonth: ['this month', 'current month', 'bishaan', 'bisha hadda'],
    lastMonth: ['last month', 'previous month', 'bisha la soo dhaafay', 'bisha hore'],
    thisQuarter: ['this quarter', 'current quarter', 'rubaca'],
    thisYear: ['this year', 'current year', '2024', '2025', 'sanan hadda'],
    lastYear: ['last year', 'previous year', 'sanan hore'],
    ytd: ['year to date', 'ytd', 'sanadkan ilaa hadda'],
    mtd: ['month to date', 'mtd', 'bishan ilaa hadda']
  };

  for (const [period, patterns] of Object.entries(timePatterns)) {
    if (patterns.some(pattern => contentLower.includes(pattern))) {
      return period;
    }
  }

  return 'all';
}

// Enhanced data aggregation with business insights
async function getBusinessInsights(userId, intent, timeContext = 'all') {
  const insights = {
    summary: {},
    trends: {},
    recommendations: [],
    alerts: []
  };

  try {
    // Get comprehensive business data
    const [accounts, products, sales, purchases, customers, suppliers] = await Promise.all([
      Account.find({ userId }),
      Product.find({ userId }),
      getSalesWithTimeFilter(userId, timeContext),
      getPurchasesWithTimeFilter(userId, timeContext),
      Customer.find({ userId }),
      Supplier.find({ userId })
    ]);

    // Calculate key metrics
    insights.summary = {
      totalAccounts: accounts.length,
      totalBalance: accounts.reduce((sum, acc) => sum + acc.balance, 0),
      totalProducts: products.length,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.amount, 0),
      totalPurchases: purchases.length,
      totalPurchaseAmount: purchases.reduce((sum, purchase) => sum + purchase.amount, 0),
      totalCustomers: customers.length,
      customerDebt: customers.reduce((sum, customer) => sum + customer.bal, 0),
      totalSuppliers: suppliers.length,
      supplierDebt: suppliers.reduce((sum, supplier) => sum + supplier.balance, 0)
    };

    // Calculate profit margin
    insights.summary.grossProfit = insights.summary.totalRevenue - insights.summary.totalPurchaseAmount;
    insights.summary.profitMargin = insights.summary.totalRevenue > 0 
      ? (insights.summary.grossProfit / insights.summary.totalRevenue) * 100 
      : 0;

    // Generate recommendations based on data
    generateBusinessRecommendations(insights, { accounts, products, sales, purchases, customers, suppliers });

    // Generate alerts
    generateBusinessAlerts(insights, { accounts, products, sales, purchases, customers, suppliers });

    return insights;
  } catch (error) {
    console.error('Error generating business insights:', error);
    return insights;
  }
}

// Generate business recommendations
function generateBusinessRecommendations(insights, data) {
  const { accounts, products, sales, purchases, customers, suppliers } = data;

  // Low stock alerts
  const lowStockProducts = products.filter(p => p.quantity < 10);
  if (lowStockProducts.length > 0) {
    insights.recommendations.push({
      type: 'inventory',
      priority: 'high',
      message: `${lowStockProducts.length} products have low stock levels. Consider restocking soon.`,
      action: 'Review inventory levels'
    });
  }

  // High customer debt
  const highDebtCustomers = customers.filter(c => c.bal > 1000);
  if (highDebtCustomers.length > 0) {
    insights.recommendations.push({
      type: 'financial',
      priority: 'medium',
      message: `${highDebtCustomers.length} customers have outstanding balances over $1,000.`,
      action: 'Follow up on collections'
    });
  }

  // Profit margin analysis
  if (insights.summary.profitMargin < 20) {
    insights.recommendations.push({
      type: 'financial',
      priority: 'high',
      message: `Current profit margin is ${insights.summary.profitMargin.toFixed(1)}%. Consider reviewing pricing strategy.`,
      action: 'Analyze pricing and costs'
    });
  }

  // Cash flow analysis
  const totalCash = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalDebt = suppliers.reduce((sum, sup) => sum + sup.balance, 0);
  if (totalCash < totalDebt) {
    insights.recommendations.push({
      type: 'financial',
      priority: 'high',
      message: 'Cash position is lower than supplier debt. Monitor cash flow closely.',
      action: 'Review payment schedules'
    });
  }
}

// Generate business alerts
function generateBusinessAlerts(insights, data) {
  const { accounts, products } = data;

  // Negative account balances
  const negativeAccounts = accounts.filter(acc => acc.balance < 0);
  if (negativeAccounts.length > 0) {
    insights.alerts.push({
      type: 'warning',
      message: `${negativeAccounts.length} accounts have negative balances.`
    });
  }

  // Out of stock products
  const outOfStock = products.filter(p => p.quantity === 0);
  if (outOfStock.length > 0) {
    insights.alerts.push({
      type: 'warning',
      message: `${outOfStock.length} products are out of stock.`
    });
  }
}

// Enhanced sales data with time filtering
async function getSalesWithTimeFilter(userId, timeContext) {
  const query = { userId };
  const dateFilter = getDateFilter(timeContext);
  
  if (dateFilter) {
    query.sel_date = dateFilter;
  }
  
  return await Sale.find(query);
}

// Enhanced purchase data with time filtering
async function getPurchasesWithTimeFilter(userId, timeContext) {
  const query = { userId };
  const dateFilter = getDateFilter(timeContext);
  
  if (dateFilter) {
    query.created_at = dateFilter;
  }
  
  return await Purchase.find(query);
}

// Get date filter based on time context
function getDateFilter(timeContext) {
  const now = new Date();
  let startDate;

  switch (timeContext) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'yesterday':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return { $gte: startDate, $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
    case 'thisWeek':
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      break;
    case 'lastWeek':
      const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7);
      const lastWeekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      return { $gte: lastWeekStart, $lt: lastWeekEnd };
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
      return { $gte: startDate, $lt: lastMonthEnd };
    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'lastYear':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear(), 0, 1);
      return { $gte: startDate, $lt: lastYearEnd };
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'mtd':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      return null;
  }

  return { $gte: startDate };
}

// Enhanced response formatting with business context
function formatEnhancedResponse(data, intent, insights) {
  let response = '';

  // Add context-aware greeting
  const timeOfDay = new Date().getHours();
  const greeting = timeOfDay < 12 ? 'Good morning' : timeOfDay < 18 ? 'Good afternoon' : 'Good evening';
  
  response += `${greeting}! Here's your business information:\n\n`;

  // Format based on intent
  switch (intent) {
    case 'financial':
      response += formatFinancialSummary(insights);
      break;
    case 'sales':
      response += formatSalesSummary(data, insights);
      break;
    case 'inventory':
      response += formatInventorySummary(data, insights);
      break;
    default:
      response += formatGeneralSummary(insights);
  }

  // Add recommendations
  if (insights.recommendations.length > 0) {
    response += '\n📊 Business Recommendations:\n';
    insights.recommendations.forEach(rec => {
      const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      response += `${priority} ${rec.message}\n`;
    });
  }

  // Add alerts
  if (insights.alerts.length > 0) {
    response += '\n⚠️ Alerts:\n';
    insights.alerts.forEach(alert => {
      response += `• ${alert.message}\n`;
    });
  }

  return response;
}

function formatFinancialSummary(insights) {
  const { summary } = insights;
  return `💰 Financial Overview:
- Total Revenue: $${summary.totalRevenue.toFixed(2)}
- Total Expenses: $${summary.totalPurchaseAmount.toFixed(2)}
- Gross Profit: $${summary.grossProfit.toFixed(2)}
- Profit Margin: ${summary.profitMargin.toFixed(1)}%
- Account Balance: $${summary.totalBalance.toFixed(2)}
- Customer Receivables: $${summary.customerDebt.toFixed(2)}
- Supplier Payables: $${summary.supplierDebt.toFixed(2)}`;
}

function formatSalesSummary(data, insights) {
  const { summary } = insights;
  return `📈 Sales Overview:
- Total Sales: ${summary.totalSales} transactions
- Total Revenue: $${summary.totalRevenue.toFixed(2)}
- Average Sale: $${summary.totalSales > 0 ? (summary.totalRevenue / summary.totalSales).toFixed(2) : '0.00'}
- Active Customers: ${summary.totalCustomers}`;
}

function formatInventorySummary(data, insights) {
  const { summary } = insights;
  return `📦 Inventory Overview:
- Total Products: ${summary.totalProducts}
- Low Stock Items: ${insights.recommendations.filter(r => r.type === 'inventory').length}
- Out of Stock: ${insights.alerts.filter(a => a.message.includes('out of stock')).length}`;
}

function formatGeneralSummary(insights) {
  const { summary } = insights;
  return `🏢 Business Overview:
- Accounts: ${summary.totalAccounts} (Balance: $${summary.totalBalance.toFixed(2)})
- Products: ${summary.totalProducts}
- Sales: ${summary.totalSales} ($${summary.totalRevenue.toFixed(2)})
- Customers: ${summary.totalCustomers}
- Suppliers: ${summary.totalSuppliers}
- Profit Margin: ${summary.profitMargin.toFixed(1)}%`;
}

module.exports = {
  analyzeQueryIntent,
  extractTimeContext,
  getBusinessInsights,
  formatEnhancedResponse,
  getSalesWithTimeFilter,
  getPurchasesWithTimeFilter
};