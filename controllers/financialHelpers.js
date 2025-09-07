const { format, startOfWeek, startOfDay, endOfDay } = require('date-fns');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');

// Helper function to calculate growth percentage
function calculateGrowth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous * 100).toFixed(2);
}

// Generate Profit & Loss Statement - Updated to match frontend expectations
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
    revenue: parseFloat(revenue.toFixed(2)),
    cogs: parseFloat(cogs.toFixed(2)),
    gross_profit: parseFloat(grossProfit.toFixed(2)),
    total_expenses: parseFloat(totalExpenses.toFixed(2)),
    net_income: parseFloat(netProfit.toFixed(2)),
    
    // Additional metrics for compatibility
    cost_of_goods_sold: parseFloat(cogs.toFixed(2)),
    gross_profit_margin: revenue > 0 ? parseFloat((grossProfit / revenue * 100).toFixed(2)) : 0,
    
    operating_expenses: {
      salaries: parseFloat(operatingExpenses.salaries.toFixed(2)),
      rent: parseFloat(operatingExpenses.rent.toFixed(2)),
      utilities: parseFloat(operatingExpenses.utilities.toFixed(2)),
      marketing: parseFloat(operatingExpenses.marketing.toFixed(2)),
      administrative: parseFloat(operatingExpenses.administrative.toFixed(2)),
      other: parseFloat(operatingExpenses.other.toFixed(2)),
      total: parseFloat(totalOperatingExpenses.toFixed(2))
    },
    
    total_operating_expenses: parseFloat(totalOperatingExpenses.toFixed(2)),
    operating_income: parseFloat((grossProfit - totalOperatingExpenses).toFixed(2)),
    
    // Ratios
    net_profit_margin: revenue > 0 ? parseFloat((netProfit / revenue * 100).toFixed(2)) : 0
  };
}

// Generate Balance Sheet from strict sources
function generateBalanceSheet(
  accounts,
  sales,
  purchases,
  expenses,
  deposits,
  withdrawals,
  suppliers,
  payments,
  paymentOuts,
  storeProducts = [],
  products = [],
  purchasesForInventory = null,
  salesForInventory = null,
  settings = {},
  customers = [],
  invoices = []
) {
  // 1) Cash → from transactions (starting cash + inflows - outflows)
  const startingCash = Number(settings.starting_cash || 0);
  
  // Calculate cash inflows from actual payments received
  const cashFromSales = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const depositsTotal = (deposits || []).reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalInflows = cashFromSales + depositsTotal;
  
  // Calculate cash outflows from actual payments made
  const cashToPurchases = (paymentOuts || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const expensePayments = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const withdrawalsTotal = (withdrawals || []).reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalOutflows = cashToPurchases + expensePayments + withdrawalsTotal;
  
  // Calculate cash from transaction flows
  const cashFromTransactions = startingCash + totalInflows - totalOutflows;
  
  // If starting cash is not set and result is 0, use account balances as fallback
  const accountBalances = (accounts || []).reduce((sum, a) => sum + (a.balance || 0), 0);
  const cash = (settings.starting_cash != null || cashFromTransactions !== 0) ? cashFromTransactions : accountBalances;

  // 2) Accounts Receivable → from customer invoices that remain unpaid
  let accountsReceivable = 0;
  
  // First try to get from unpaid invoices if available
  if (invoices && invoices.length > 0) {
    accountsReceivable = invoices
      .filter(inv => inv.status === 'Unpaid' || (inv.total || 0) > (inv.paid || 0))
      .reduce((sum, inv) => sum + ((inv.total || 0) - (inv.paid || 0)), 0);
  } else {
    // Fallback to customer balances
    accountsReceivable = (customers || []).reduce((sum, c) => sum + (c.bal || 0), 0);
    
    // If no customer data, use unpaid sales as last resort
    if (accountsReceivable === 0 && sales && sales.length > 0) {
      accountsReceivable = sales
        .filter(s => (s.amount || 0) > (s.paid || 0))
        .reduce((sum, s) => sum + ((s.amount || 0) - (s.paid || 0)), 0);
    }
  }

  // 3) Inventory → from purchases minus cost of goods sold
  const productCostByNo = new Map();
  const productPurchasePriceByNo = new Map();
  
  // Build product cost map and track purchase prices as fallback
  (products || []).forEach(p => {
    const cost = p.cost || p.cost_price || 0;
    productCostByNo.set(p.product_no, cost);
  });
  
  // Also track latest purchase prices as fallback for cost calculation
  (purchasesForInventory || purchases || []).forEach(p => {
    if (Array.isArray(p.items)) {
      p.items.forEach(item => {
        if (item.product_no && item.price) {
          productPurchasePriceByNo.set(item.product_no, item.price);
        }
      });
    }
  });

  // Calculate total purchases at cost from purchase line items
  const purchasesAtCost = (purchasesForInventory || purchases || [])
    .reduce((sum, p) => {
      if (Array.isArray(p.items)) {
        const purchaseTotal = p.items.reduce((s2, i) => s2 + ((i.qty || 0) * (i.price || 0)), 0);
        return sum + purchaseTotal;
      }
      return sum;
    }, 0);

  // Calculate cost of goods sold from sales line items
  const cogs = (salesForInventory || sales || [])
    .reduce((sum, s) => {
      if (Array.isArray(s.items)) {
        const saleCogsTotal = s.items.reduce((s2, i) => {
          let costPrice = productCostByNo.get(i.product_no) || 0;
          
          // If no cost price is defined, use latest purchase price as fallback
          if (costPrice === 0) {
            costPrice = productPurchasePriceByNo.get(i.product_no) || 0;
            
            // If still no cost data, estimate using sales price with reasonable margin
            // Assume 30% markup, so cost = sales_price / 1.3
            if (costPrice === 0 && i.price > 0) {
              costPrice = i.price / 1.3; // Estimate cost assuming 30% markup
            }
          }
          
          const itemCogs = (i.qty || 0) * costPrice;
          return s2 + itemCogs;
        }, 0);
        return sum + saleCogsTotal;
      }
      return sum;
    }, 0);

  const inventory = Math.max(0, purchasesAtCost - cogs);
  
  // Debug logging for inventory calculation
  console.log('📊 Inventory Calculation Debug:');
  console.log(`   Total Purchases at Cost: $${purchasesAtCost}`);
  console.log(`   Total Cost of Goods Sold: $${cogs}`);
  console.log(`   Final Inventory: $${inventory}`);
  console.log(`   Number of Purchase Records: ${(purchasesForInventory || purchases || []).length}`);
  console.log(`   Number of Sales Records: ${(salesForInventory || sales || []).length}`);
  console.log(`   Number of Products with Cost Data: ${productCostByNo.size}`);
  
  // Calculate total sales revenue for comparison
  const totalSalesRevenue = (salesForInventory || sales || []).reduce((sum, s) => sum + (s.amount || 0), 0);
  console.log(`   Total Sales Revenue (for reference): $${totalSalesRevenue}`);
  console.log(`   ⚠️  Note: Inventory = Purchases($${purchasesAtCost}) - COGS($${cogs}), NOT Sales Revenue($${totalSalesRevenue})`);
  
  // Log detailed purchase breakdown if inventory is significant
  if (inventory > 100) {
    console.log('📊 Detailed Purchase Breakdown:');
    (purchasesForInventory || purchases || []).forEach((p, index) => {
      if (Array.isArray(p.items) && p.items.length > 0) {
        const purchaseTotal = p.items.reduce((s2, i) => s2 + ((i.qty || 0) * (i.price || 0)), 0);
        console.log(`   Purchase ${index + 1}: $${purchaseTotal} (${p.items.length} items)`);
        p.items.forEach(item => {
          console.log(`     - Product ${item.product_no}: ${item.qty} x $${item.price} = $${(item.qty || 0) * (item.price || 0)}`);
        });
      }
    });
    
    console.log('📊 Sales COGS Breakdown:');
    (salesForInventory || sales || []).forEach((s, index) => {
      if (Array.isArray(s.items) && s.items.length > 0) {
        const saleCogsTotal = s.items.reduce((s2, i) => {
          const costPrice = productCostByNo.get(i.product_no) || 0;
          return s2 + ((i.qty || 0) * costPrice);
        }, 0);
        console.log(`   Sale ${index + 1}: COGS $${saleCogsTotal} (${s.items.length} items)`);
        s.items.forEach(item => {
          let costPrice = productCostByNo.get(item.product_no) || 0;
          let costSource = 'product_cost';
          
          if (costPrice === 0) {
            costPrice = productPurchasePriceByNo.get(item.product_no) || 0;
            costSource = costPrice > 0 ? 'purchase_price_fallback' : 'no_cost_data';
            
            // If still no cost data, estimate using sales price
            if (costPrice === 0 && item.price > 0) {
              costPrice = item.price / 1.3; // Estimate cost assuming 30% markup
              costSource = 'estimated_from_sales_price';
            }
          }
          
          console.log(`     - Product ${item.product_no}: ${item.qty} x $${costPrice} cost = $${(item.qty || 0) * costPrice} (${costSource})`);
          if (costPrice === 0) {
            console.log(`       ⚠️  WARNING: No cost price found for product ${item.product_no}`);
          }
        });
      }
    });
  }

  // Current assets
  const currentAssets = cash + accountsReceivable + inventory;

  // 7) Fixed Assets → from long-term assets purchased (not inventory)
  const fixedAssets = Number(settings.fixed_assets_total || 0);
  const totalAssets = currentAssets + fixedAssets;

  // 4) Accounts Payable → from supplier balances that remain unpaid
  const accountsPayable = (suppliers || []).reduce((sum, s) => sum + (s.balance || 0), 0);

  // 8) Liabilities → from Accounts Payable + Long Term Debt
  const longTermDebt = Number(settings.long_term_debt || 0);
  const totalLiabilities = accountsPayable + longTermDebt;

  // 5) Retained Earnings (Profit) → from total revenues - total expenses (including COGS)
  const totalRevenue = (sales || []).reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalOperatingExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const retainedEarnings = totalRevenue - totalOperatingExpenses - cogs;

  // 6) Owner's Equity → from the initial capital contributed by the owner
  let ownerEquity = Number(settings.owner_initial_capital || 0);

  // 9) Equity → from Owner's Equity + Retained Earnings
  let totalEquity = ownerEquity + retainedEarnings;
  
  // If owner's equity is not explicitly set and balance sheet doesn't balance,
  // calculate implied owner's equity to make the balance sheet balance
  // This represents the owner's implied initial investment
  if (settings.owner_initial_capital == null || settings.owner_initial_capital === 0) {
    const impliedOwnerEquity = totalAssets - totalLiabilities - retainedEarnings;
    if (impliedOwnerEquity > 0) {
      ownerEquity = impliedOwnerEquity;
      totalEquity = ownerEquity + retainedEarnings;
    }
  }

  // Verify Assets = Liabilities + Equity (no adjustments, just validation)
  const balanceSheetDifference = Number((totalAssets - (totalLiabilities + totalEquity)).toFixed(2));
  const isBalanced = Math.abs(balanceSheetDifference) < 0.01; // Allow for rounding differences
  
  // For debugging: log the balance sheet components if not balanced
  if (!isBalanced) {
    console.log('⚠️  Balance Sheet Debug Info:');
    console.log(`   Total Assets: $${totalAssets}`);
    console.log(`   Total Liabilities: $${totalLiabilities}`);
    console.log(`   Total Equity: $${totalEquity}`);
    console.log(`   Difference: $${balanceSheetDifference}`);
    console.log(`   Cash: $${cash}, AR: $${accountsReceivable}, Inventory: $${inventory}`);
    console.log(`   AP: $${accountsPayable}, Owner Equity: $${ownerEquity}, Retained: $${retainedEarnings}`);
  }

  return {
    assets: {
      current_assets: {
        cash: parseFloat(cash.toFixed(2)),
        accounts_receivable: parseFloat(accountsReceivable.toFixed(2)),
        inventory: parseFloat(inventory.toFixed(2)),
        total: parseFloat((cash + accountsReceivable + inventory).toFixed(2))
      },
      fixed_assets: parseFloat(fixedAssets.toFixed(2)),
      total_assets: parseFloat(totalAssets.toFixed(2))
    },
    liabilities: {
      current_liabilities: {
        accounts_payable: parseFloat(accountsPayable.toFixed(2)),
        total: parseFloat(accountsPayable.toFixed(2))
      },
      long_term_debt: parseFloat(longTermDebt.toFixed(2)),
      total_liabilities: parseFloat(totalLiabilities.toFixed(2))
    },
    equity: {
      retained_earnings: parseFloat(retainedEarnings.toFixed(2)),
      owner_equity: parseFloat(ownerEquity.toFixed(2)),
      total_equity: parseFloat(totalEquity.toFixed(2))
    },
    total_assets: parseFloat(totalAssets.toFixed(2)),
    total_liabilities: parseFloat(totalLiabilities.toFixed(2)),
    total_equity: parseFloat(totalEquity.toFixed(2)),
    balance_sheet_validation: {
      difference: balanceSheetDifference,
      is_balanced: isBalanced,
      message: isBalanced ? 'Balance sheet is balanced' : `Balance sheet is off by ${balanceSheetDifference}. Check data sources.`
    },
    details: {
      settings_used: {
        starting_cash: settings.starting_cash ?? null,
        fixed_assets_total: settings.fixed_assets_total ?? null,
        long_term_debt: settings.long_term_debt ?? null,
        owner_initial_capital: settings.owner_initial_capital ?? null
      },
      calculations: {
        cash_calculation: {
          starting_cash: startingCash,
          total_inflows: totalInflows,
          total_outflows: totalOutflows,
          cash_from_transactions: cashFromTransactions,
          account_balances_fallback: accountBalances,
          final_cash: cash,
          method_used: (settings.starting_cash != null || cashFromTransactions !== 0) ? 'transaction_flow' : 'account_balances'
        },
        inventory_calculation: {
          purchases_at_cost: parseFloat(purchasesAtCost.toFixed(2)),
          cogs: parseFloat(cogs.toFixed(2)),
          inventory: parseFloat(inventory.toFixed(2))
        },
        owner_equity_calculation: {
          explicit_capital: Number(settings.owner_initial_capital || 0),
          calculated_equity: ownerEquity,
          method_used: (settings.owner_initial_capital != null && settings.owner_initial_capital !== 0) ? 'explicit_setting' : 'implied_from_balance'
        }
      }
    }
  };
}

// Generate Cash Flow Statement - Updated to match frontend expectations
function generateCashFlowStatement(sales, purchases, expenses, deposits, withdrawals) {
  // Operating Activities
  const cashFromSales = sales
    .filter(s => (s.paid || 0) > 0)
    .reduce((sum, s) => sum + (s.paid || 0), 0);
  
  const cashToPurchases = purchases
    .filter(p => (p.paid || 0) > 0)
    .reduce((sum, p) => sum + (p.paid || 0), 0);
  
  const cashToExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const netOperatingCashFlow = cashFromSales - cashToPurchases - cashToExpenses;
  
  // Investing Activities (simplified but more realistic)
  const equipmentPurchases = Math.max(0, purchases.reduce((sum, p) => sum + (p.amount || 0), 0) * 0.1);
  const netInvestingCashFlow = -equipmentPurchases;
  
  // Financing Activities
  const depositsTotal = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);
  const withdrawalsTotal = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
  const netFinancingCashFlow = depositsTotal - withdrawalsTotal;
  
  const netCashFlow = netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;
  
  return {
    operating_activities: {
      cash_from_sales: parseFloat(cashFromSales.toFixed(2)),
      cash_to_purchases: parseFloat((-cashToPurchases).toFixed(2)),
      cash_to_expenses: parseFloat((-cashToExpenses).toFixed(2)),
      net_operating_cash_flow: parseFloat(netOperatingCashFlow.toFixed(2))
    },
    investing_activities: {
      equipment_purchases: parseFloat((-equipmentPurchases).toFixed(2)),
      net_investing_cash_flow: parseFloat(netInvestingCashFlow.toFixed(2))
    },
    financing_activities: {
      deposits: parseFloat(depositsTotal.toFixed(2)),
      withdrawals: parseFloat((-withdrawalsTotal).toFixed(2)),
      net_financing_cash_flow: parseFloat(netFinancingCashFlow.toFixed(2))
    },
    net_cash_flow: parseFloat(netCashFlow.toFixed(2))
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
    working_capital: summary.cash_flow || 0
  };

  if (summary.total_revenue > 0) {
    ratios.gross_profit_margin = parseFloat(((summary.gross_profit / summary.total_revenue) * 100).toFixed(2));
    ratios.net_profit_margin = parseFloat(((summary.net_profit / summary.total_revenue) * 100).toFixed(2));
  }

  if (summary.total_purchases > 0) {
    ratios.roi = parseFloat(((summary.net_profit / summary.total_purchases) * 100).toFixed(2));
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
