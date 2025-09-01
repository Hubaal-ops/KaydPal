const { format, startOfWeek, startOfDay, endOfDay } = require('date-fns');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');

// Helper function to calculate growth percentage
function calculateGrowth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous * 100).toFixed(2);
}

// Generate Profit & Loss Statement - Updated to match working reports
function generateProfitLossStatement(sales, purchases, expenses) {
  const revenue = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
  const cogs = purchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - totalExpenses;
  
  // Categorize operating expenses
  const operatingExpenses = {
    salaries: 0,
    rent: 0,
    utilities: 0,
    marketing: 0,
    administrative: 0,
    other: 0
  };
  
  let totalOperatingExpenses = 0;
  expenses.forEach(expense => {
    const amount = expense.amount || 0;
    totalOperatingExpenses += amount;
    
    const category = (expense.category || '').toLowerCase();
    if (category.includes('salary') || category.includes('wage')) {
      operatingExpenses.salaries += amount;
    } else if (category.includes('rent') || category.includes('lease')) {
      operatingExpenses.rent += amount;
    } else if (category.includes('utility') || category.includes('electric') || category.includes('water')) {
      operatingExpenses.utilities += amount;
    } else if (category.includes('marketing') || category.includes('advertising')) {
      operatingExpenses.marketing += amount;
    } else if (category.includes('admin') || category.includes('office')) {
      operatingExpenses.administrative += amount;
    } else {
      operatingExpenses.other += amount;
    }
  });
  
  return {
    revenue,
    cogs,
    grossProfit,
    totalExpenses,
    netProfit,
    
    // Additional metrics for compatibility
    cost_of_goods_sold: cogs,
    gross_profit: grossProfit,
    operating_expenses: {
      salaries: operatingExpenses.salaries,
      rent: operatingExpenses.rent,
      utilities: operatingExpenses.utilities,
      marketing: operatingExpenses.marketing,
      administrative: operatingExpenses.administrative,
      other: operatingExpenses.other,
      total: totalOperatingExpenses
    },
    operating_income: grossProfit - totalOperatingExpenses,
    net_income: netProfit,
    
    // Ratios
    gross_margin: revenue > 0 ? (grossProfit / revenue * 100).toFixed(2) : 0,
    operating_margin: revenue > 0 ? ((grossProfit - totalOperatingExpenses) / revenue * 100).toFixed(2) : 0,
    net_margin: revenue > 0 ? (netProfit / revenue * 100).toFixed(2) : 0
  };
}

// Generate Balance Sheet - Updated to match working reports
function generateBalanceSheet(accounts, sales, purchases, expenses, deposits, withdrawals) {
  // Use the same approach as working balance sheet report
  const totalAssets = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalLiabilities = purchases.reduce((sum, p) => sum + ((p.amount || 0) - (p.paid || 0)), 0);
  const equity = totalAssets - totalLiabilities;
  
  // Enhanced breakdown for advanced reporting
  const cash = deposits.reduce((sum, d) => sum + (d.amount || 0), 0) - 
               withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
  
  const accountsReceivable = sales.filter(s => s.payment_status === 'pending')
                                 .reduce((sum, s) => sum + (s.amount || 0), 0);
  
  const inventory = purchases.reduce((sum, p) => sum + (p.amount || 0), 0) * 0.7;
  const currentAssets = cash + accountsReceivable + inventory;
  const fixedAssets = totalAssets - currentAssets;
  
  const accountsPayable = purchases.filter(p => p.payment_status === 'pending')
                                  .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const currentLiabilities = accountsPayable;
  const longTermDebt = totalLiabilities - currentLiabilities;
  
  const retainedEarnings = sales.reduce((sum, s) => sum + (s.amount || 0), 0) - 
                          expenses.reduce((sum, e) => sum + (e.amount || 0), 0) -
                          purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const ownerEquity = equity - retainedEarnings;
  
  return {
    assets: {
      current_assets: {
        cash,
        accounts_receivable: accountsReceivable,
        inventory,
        total: currentAssets
      },
      fixed_assets: fixedAssets,
      total_assets: totalAssets
    },
    liabilities: {
      current_liabilities: {
        accounts_payable: accountsPayable,
        total: currentLiabilities
      },
      long_term_debt: longTermDebt,
      total_liabilities: totalLiabilities
    },
    equity: {
      retained_earnings: retainedEarnings,
      owner_equity: ownerEquity,
      total_equity: equity
    },
    // Core values for compatibility with working reports
    totalAssets,
    totalLiabilities,
    equity,
    total_liabilities_equity: totalLiabilities + equity
  };
}

// Generate Cash Flow Statement
function generateCashFlowStatement(sales, purchases, expenses, deposits, withdrawals) {
  // Operating Activities
  const cashFromSales = sales.filter(s => s.payment_status === 'paid')
                             .reduce((sum, s) => sum + (s.amount || 0), 0);
  
  const cashToPurchases = purchases.filter(p => p.payment_status === 'paid')
                                  .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const cashToExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const operatingCashFlow = cashFromSales - cashToPurchases - cashToExpenses;
  
  // Investing Activities (simplified - would need actual investment data)
  const investingCashFlow = 0;
  
  // Financing Activities
  const cashFromDeposits = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);
  const cashFromWithdrawals = withdrawals.reduce((sum, w) => sum - (w.amount || 0), 0);
  const financingCashFlow = cashFromDeposits + cashFromWithdrawals;
  
  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
  
  return {
    operating_activities: {
      cash_from_sales: cashFromSales,
      cash_to_purchases: -cashToPurchases,
      cash_to_expenses: -cashToExpenses,
      net_operating_cash_flow: operatingCashFlow
    },
    investing_activities: {
      equipment_purchases: investingCashFlow,
      net_investing_cash_flow: investingCashFlow
    },
    financing_activities: {
      deposits: cashFromDeposits,
      withdrawals: cashFromWithdrawals,
      net_financing_cash_flow: financingCashFlow
    },
    net_cash_flow: netCashFlow,
    beginning_cash: 0, // Would need historical data
    ending_cash: netCashFlow
  };
}

// Helper function to calculate comprehensive financial summary (legacy)
function calculateFinancialSummary(sales, purchases, expenses, deposits, withdrawals) {
  const summary = {
    total_revenue: 0,
    total_expenses: 0,
    total_purchases: 0,
    net_profit: 0,
    gross_profit: 0,
    cash_flow: 0,
    total_deposits: 0,
    total_withdrawals: 0,
    transaction_count: 0
  };

  sales.forEach(sale => {
    summary.total_revenue += sale.amount || 0;
    summary.transaction_count++;
  });

  expenses.forEach(expense => {
    summary.total_expenses += expense.amount || 0;
    summary.transaction_count++;
  });

  purchases.forEach(purchase => {
    summary.total_purchases += purchase.amount || 0;
    summary.transaction_count++;
  });

  deposits.forEach(deposit => {
    summary.total_deposits += deposit.amount || 0;
    summary.transaction_count++;
  });

  withdrawals.forEach(withdrawal => {
    summary.total_withdrawals += withdrawal.amount || 0;
    summary.transaction_count++;
  });

  summary.gross_profit = summary.total_revenue - summary.total_purchases;
  summary.net_profit = summary.gross_profit - summary.total_expenses;
  summary.cash_flow = summary.total_deposits - summary.total_withdrawals;

  return summary;
}

// Helper function to group financial data by time periods
function groupFinancialDataByTime(sales, purchases, expenses, groupBy) {
  const groupedData = new Map();
  
  const processTransaction = (transaction, type, amount) => {
    const date = new Date(transaction.sel_date || transaction.created_at || transaction.expense_date);
    let key;
    
    switch (groupBy) {
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
        key = `${format(date, 'yyyy')}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
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
        revenue: 0,
        expenses: 0,
        purchases: 0,
        profit: 0,
        profit_margin: 0,
        transaction_count: 0
      });
    }
    
    const group = groupedData.get(key);
    group[type] += amount;
    group.transaction_count++;
  };

  sales.forEach(sale => processTransaction(sale, 'revenue', sale.amount || 0));
  expenses.forEach(expense => processTransaction(expense, 'expenses', expense.amount || 0));
  purchases.forEach(purchase => processTransaction(purchase, 'purchases', purchase.amount || 0));

  return Array.from(groupedData.values()).map(group => ({
    ...group,
    profit: group.revenue - group.expenses - group.purchases,
    profit_margin: group.revenue > 0 ? ((group.revenue - group.expenses - group.purchases) / group.revenue * 100).toFixed(2) : 0
  })).sort((a, b) => a.period.localeCompare(b.period));
}

// Helper function to calculate category breakdown
function calculateCategoryBreakdown(sales, purchases, expenses) {
  const revenueByCategory = new Map();
  const expensesByCategory = new Map();

  sales.forEach(sale => {
    const category = sale.category || 'Sales';
    if (!revenueByCategory.has(category)) {
      revenueByCategory.set(category, 0);
    }
    revenueByCategory.set(category, revenueByCategory.get(category) + (sale.amount || 0));
  });

  expenses.forEach(expense => {
    const category = expense.category || 'General';
    if (!expensesByCategory.has(category)) {
      expensesByCategory.set(category, 0);
    }
    expensesByCategory.set(category, expensesByCategory.get(category) + (expense.amount || 0));
  });

  return {
    revenue: Array.from(revenueByCategory.entries()).map(([name, value]) => ({ name, value })),
    expenses: Array.from(expensesByCategory.entries()).map(([name, value]) => ({ name, value }))
  };
}

// Helper function to calculate financial ratios
function calculateFinancialRatios(summary, sales, purchases, expenses) {
  const ratios = {
    gross_profit_margin: 0,
    net_profit_margin: 0,
    roi: 0,
    roe: 0,
    current_ratio: 1.5,
    quick_ratio: 1.2,
    cash_ratio: 0.8,
    working_capital: summary.cash_flow
  };

  if (summary.total_revenue > 0) {
    ratios.gross_profit_margin = (summary.gross_profit / summary.total_revenue * 100).toFixed(2);
    ratios.net_profit_margin = (summary.net_profit / summary.total_revenue * 100).toFixed(2);
  }

  if (summary.total_purchases > 0) {
    ratios.roi = (summary.net_profit / summary.total_purchases * 100).toFixed(2);
  }

  ratios.roe = ratios.roi;
  return ratios;
}

// Helper function to generate financial forecasting
function generateFinancialForecasting(timeSeries) {
  if (timeSeries.length < 3) return [];

  const forecastPeriods = 6;
  const forecasting = [];
  const revenues = timeSeries.map(t => t.revenue);
  const expenses = timeSeries.map(t => t.expenses);
  
  const n = revenues.length;
  const sumX = (n * (n + 1)) / 2;
  const sumY = revenues.reduce((a, b) => a + b, 0);
  const sumXY = revenues.reduce((sum, revenue, index) => sum + revenue * (index + 1), 0);
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
  
  const revenueSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const revenueIntercept = (sumY - revenueSlope * sumX) / n;

  const expenseSum = expenses.reduce((a, b) => a + b, 0);
  const expenseSumXY = expenses.reduce((sum, expense, index) => sum + expense * (index + 1), 0);
  const expenseSlope = (n * expenseSumXY - sumX * expenseSum) / (n * sumX2 - sumX * sumX);
  const expenseIntercept = (expenseSum - expenseSlope * sumX) / n;

  for (let i = 1; i <= forecastPeriods; i++) {
    const projectedRevenue = Math.max(0, revenueIntercept + revenueSlope * (n + i));
    const projectedExpenses = Math.max(0, expenseIntercept + expenseSlope * (n + i));
    
    forecasting.push({
      period: `Future ${i}`,
      projected_revenue: Math.round(projectedRevenue),
      projected_expenses: Math.round(projectedExpenses),
      projected_profit: Math.round(projectedRevenue - projectedExpenses)
    });
  }

  return forecasting;
}

// Helper function to calculate financial comparison metrics
async function calculateFinancialComparisonMetrics(baseFilter, currentStart, currentEnd, userId) {
  const timeDiff = currentEnd - currentStart;
  const previousStart = new Date(currentStart.getTime() - timeDiff);
  const previousEnd = new Date(currentEnd.getTime() - timeDiff);
  
  const previousFilter = {
    ...baseFilter,
    created_at: { $gte: previousStart, $lte: previousEnd }
  };

  const [currentSales, previousSales, currentExpenses, previousExpenses] = await Promise.all([
    Sale.find(baseFilter).lean(),
    Sale.find(previousFilter).lean(),
    Expense.find(baseFilter).lean(),
    Expense.find(previousFilter).lean()
  ]);

  const currentRevenue = currentSales.reduce((sum, s) => sum + (s.amount || 0), 0);
  const previousRevenue = previousSales.reduce((sum, s) => sum + (s.amount || 0), 0);
  const currentExpenseTotal = currentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const previousExpenseTotal = previousExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    growth: {
      revenue: calculateGrowth(currentRevenue, previousRevenue),
      expenses: calculateGrowth(currentExpenseTotal, previousExpenseTotal),
      profit: calculateGrowth(currentRevenue - currentExpenseTotal, previousRevenue - previousExpenseTotal),
      cash_flow: calculateGrowth(currentRevenue - currentExpenseTotal, previousRevenue - previousExpenseTotal)
    }
  };
}

// Helper function to compile all transactions
function compileAllTransactions(sales, purchases, expenses, deposits, withdrawals) {
  const transactions = [];

  sales.forEach(sale => {
    transactions.push({
      date: sale.sel_date || sale.created_at,
      type: 'income',
      category: 'Sales',
      description: `Sale #${sale.sel_no || sale._id}`,
      amount: sale.amount || 0,
      account: sale.account_id || 'Default',
      running_balance: 0
    });
  });

  purchases.forEach(purchase => {
    transactions.push({
      date: purchase.created_at,
      type: 'expense',
      category: 'Purchases',
      description: `Purchase #${purchase._id}`,
      amount: purchase.amount || 0,
      account: purchase.account_id || 'Default',
      running_balance: 0
    });
  });

  expenses.forEach(expense => {
    transactions.push({
      date: expense.expense_date || expense.created_at,
      type: 'expense',
      category: expense.category || 'General',
      description: expense.description || `Expense #${expense._id}`,
      amount: expense.amount || 0,
      account: expense.account_id || 'Default',
      running_balance: 0
    });
  });

  deposits.forEach(deposit => {
    transactions.push({
      date: deposit.created_at,
      type: 'income',
      category: 'Deposits',
      description: `Deposit #${deposit._id}`,
      amount: deposit.amount || 0,
      account: deposit.account_id || 'Default',
      running_balance: 0
    });
  });

  withdrawals.forEach(withdrawal => {
    transactions.push({
      date: withdrawal.created_at,
      type: 'expense',
      category: 'Withdrawals',
      description: `Withdrawal #${withdrawal._id}`,
      amount: withdrawal.amount || 0,
      account: withdrawal.account_id || 'Default',
      running_balance: 0
    });
  });

  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  let runningBalance = 0;
  for (let i = transactions.length - 1; i >= 0; i--) {
    if (transactions[i].type === 'income') {
      runningBalance += transactions[i].amount;
    } else {
      runningBalance -= transactions[i].amount;
    }
    transactions[i].running_balance = runningBalance;
  }

  return transactions;
}

module.exports = {
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
};
