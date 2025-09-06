const Account = require('../models/Account');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');

/**
 * Proactive Business Alerts System
 * Monitors business data and generates intelligent alerts
 */

// Generate proactive business alerts
async function generateBusinessAlerts(userId) {
  const alerts = {
    critical: [],
    warning: [],
    info: [],
    recommendations: []
  };

  try {
    // Get all business data
    const [accounts, products, sales, customers, suppliers, purchases] = await Promise.all([
      Account.find({ userId }),
      Product.find({ userId }),
      Sale.find({ userId, sel_date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }), // Last 30 days
      Customer.find({ userId }),
      Supplier.find({ userId }),
      Purchase.find({ userId, created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }) // Last 30 days
    ]);

    // Critical Alerts
    await generateCriticalAlerts(alerts, { accounts, products, customers, suppliers });
    
    // Warning Alerts
    await generateWarningAlerts(alerts, { accounts, products, sales, purchases, customers, suppliers });
    
    // Info Alerts
    await generateInfoAlerts(alerts, { sales, purchases, customers, suppliers });
    
    // Business Recommendations
    await generateRecommendations(alerts, { accounts, products, sales, purchases, customers, suppliers });

    return alerts;
  } catch (error) {
    console.error('Error generating business alerts:', error);
    return alerts;
  }
}

// Generate critical alerts (require immediate attention)
async function generateCriticalAlerts(alerts, data) {
  const { accounts, products, customers, suppliers } = data;

  // Negative account balances
  const negativeAccounts = accounts.filter(acc => acc.balance < 0);
  if (negativeAccounts.length > 0) {
    alerts.critical.push({
      type: 'cash_flow',
      title: 'Negative Account Balance',
      message: `${negativeAccounts.length} account(s) have negative balances`,
      details: negativeAccounts.map(acc => `${acc.name}: $${acc.balance.toFixed(2)}`),
      priority: 'high',
      action: 'Review cash flow and deposit funds'
    });
  }

  // Out of stock critical products
  const outOfStock = products.filter(p => p.quantity === 0 && p.price > 100); // High-value products
  if (outOfStock.length > 0) {
    alerts.critical.push({
      type: 'inventory',
      title: 'High-Value Products Out of Stock',
      message: `${outOfStock.length} high-value product(s) are out of stock`,
      details: outOfStock.map(p => `${p.product_name}: $${p.price.toFixed(2)}`),
      priority: 'high',
      action: 'Restock immediately to avoid lost sales'
    });
  }

  // Very high customer debt (over $5000)
  const highDebtCustomers = customers.filter(c => c.bal > 5000);
  if (highDebtCustomers.length > 0) {
    alerts.critical.push({
      type: 'collections',
      title: 'High Customer Debt',
      message: `${highDebtCustomers.length} customer(s) owe over $5,000`,
      details: highDebtCustomers.map(c => `${c.name}: $${c.bal.toFixed(2)}`),
      priority: 'high',
      action: 'Immediate collection action required'
    });
  }
}

// Generate warning alerts (need attention soon)
async function generateWarningAlerts(alerts, data) {
  const { accounts, products, sales, purchases, customers, suppliers } = data;

  // Low cash position
  const totalCash = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalSupplierDebt = suppliers.reduce((sum, sup) => sum + sup.balance, 0);
  
  if (totalCash < totalSupplierDebt * 0.5) {
    alerts.warning.push({
      type: 'cash_flow',
      title: 'Low Cash Position',
      message: `Cash position ($${totalCash.toFixed(2)}) is low relative to supplier debt ($${totalSupplierDebt.toFixed(2)})`,
      priority: 'medium',
      action: 'Monitor cash flow and plan payments'
    });
  }

  // Low stock warnings
  const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 10);
  if (lowStock.length > 0) {
    alerts.warning.push({
      type: 'inventory',
      title: 'Low Stock Alert',
      message: `${lowStock.length} product(s) have low stock levels`,
      details: lowStock.slice(0, 5).map(p => `${p.product_name}: ${p.quantity} units`),
      priority: 'medium',
      action: 'Plan restocking for these items'
    });
  }

  // Declining sales trend
  const currentMonth = new Date();
  const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  const currentMonthSales = sales.filter(s => s.sel_date >= new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
  const lastMonthSales = sales.filter(s => s.sel_date >= lastMonth && s.sel_date < new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
  
  const currentRevenue = currentMonthSales.reduce((sum, s) => sum + s.amount, 0);
  const lastRevenue = lastMonthSales.reduce((sum, s) => sum + s.amount, 0);
  
  if (lastRevenue > 0 && currentRevenue < lastRevenue * 0.8) {
    alerts.warning.push({
      type: 'sales',
      title: 'Declining Sales Trend',
      message: `Current month sales ($${currentRevenue.toFixed(2)}) are 20% lower than last month ($${lastRevenue.toFixed(2)})`,
      priority: 'medium',
      action: 'Review sales strategy and customer engagement'
    });
  }

  // Overdue customer payments
  const overdueCustomers = customers.filter(c => c.bal > 1000);
  if (overdueCustomers.length > 0) {
    alerts.warning.push({
      type: 'collections',
      title: 'Overdue Customer Payments',
      message: `${overdueCustomers.length} customer(s) have balances over $1,000`,
      priority: 'medium',
      action: 'Follow up on outstanding invoices'
    });
  }
}

// Generate informational alerts
async function generateInfoAlerts(alerts, data) {
  const { sales, purchases, customers, suppliers } = data;

  // Sales performance summary
  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalTransactions = sales.length;
  
  if (totalTransactions > 0) {
    alerts.info.push({
      type: 'performance',
      title: 'Monthly Sales Summary',
      message: `${totalTransactions} transactions totaling $${totalSales.toFixed(2)} this month`,
      priority: 'low',
      action: 'Review detailed sales reports for insights'
    });
  }

  // New customers this month
  const thisMonth = new Date();
  const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
  const newCustomers = customers.filter(c => c.created_at >= monthStart);
  
  if (newCustomers.length > 0) {
    alerts.info.push({
      type: 'growth',
      title: 'New Customers',
      message: `${newCustomers.length} new customer(s) added this month`,
      priority: 'low',
      action: 'Welcome new customers and ensure good service'
    });
  }
}

// Generate business recommendations
async function generateRecommendations(alerts, data) {
  const { accounts, products, sales, purchases, customers, suppliers } = data;

  // Profit margin analysis
  const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalCosts = purchases.reduce((sum, p) => sum + p.amount, 0);
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

  if (profitMargin < 20 && totalRevenue > 0) {
    alerts.recommendations.push({
      type: 'profitability',
      title: 'Improve Profit Margins',
      message: `Current profit margin is ${profitMargin.toFixed(1)}%. Consider optimizing pricing or reducing costs`,
      priority: 'medium',
      action: 'Analyze product pricing and supplier costs'
    });
  }

  // Inventory optimization
  const highValueLowTurnover = products.filter(p => p.price > 200 && p.quantity > 50);
  if (highValueLowTurnover.length > 0) {
    alerts.recommendations.push({
      type: 'inventory',
      title: 'Optimize High-Value Inventory',
      message: `${highValueLowTurnover.length} high-value products have high stock levels`,
      priority: 'low',
      action: 'Consider promotions or adjust ordering patterns'
    });
  }

  // Customer relationship opportunities
  const topCustomers = customers
    .sort((a, b) => b.bal - a.bal)
    .slice(0, 5)
    .filter(c => c.bal > 500);
    
  if (topCustomers.length > 0) {
    alerts.recommendations.push({
      type: 'customer_relations',
      title: 'VIP Customer Opportunities',
      message: `${topCustomers.length} customers have high transaction volumes`,
      priority: 'low',
      action: 'Consider loyalty programs or special offers'
    });
  }

  // Supplier relationship optimization
  const majorSuppliers = suppliers
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 3)
    .filter(s => s.balance > 1000);
    
  if (majorSuppliers.length > 0) {
    alerts.recommendations.push({
      type: 'supplier_relations',
      title: 'Supplier Relationship Review',
      message: `Review terms with ${majorSuppliers.length} major suppliers`,
      priority: 'low',
      action: 'Negotiate better payment terms or bulk discounts'
    });
  }
}

// Get alert summary for AI responses
function formatAlertsForAI(alerts) {
  let summary = '';
  
  if (alerts.critical.length > 0) {
    summary += `🚨 Critical Alerts (${alerts.critical.length}):\n`;
    alerts.critical.forEach(alert => {
      summary += `- ${alert.title}: ${alert.message}\n`;
    });
    summary += '\n';
  }
  
  if (alerts.warning.length > 0) {
    summary += `⚠️ Warnings (${alerts.warning.length}):\n`;
    alerts.warning.forEach(alert => {
      summary += `- ${alert.title}: ${alert.message}\n`;
    });
    summary += '\n';
  }
  
  if (alerts.recommendations.length > 0) {
    summary += `💡 Recommendations (${alerts.recommendations.length}):\n`;
    alerts.recommendations.slice(0, 3).forEach(alert => {
      summary += `- ${alert.title}: ${alert.message}\n`;
    });
  }
  
  return summary;
}

module.exports = {
  generateBusinessAlerts,
  formatAlertsForAI
};
