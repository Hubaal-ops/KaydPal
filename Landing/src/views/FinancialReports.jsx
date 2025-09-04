import React, { useState, useEffect } from 'react';
import styles from './FinancialReports.module.css';
import { 
  RefreshCw, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Wallet,
  Filter,
  ArrowLeft,
  Download
} from 'lucide-react';
import { generateAdvancedFinancialReport } from '../services/reportService';
import { useNavigate } from 'react-router-dom';

const FinancialReports = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    period: 'this_month',
    reportType: 'comprehensive',
    groupBy: 'month'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Generate report from API
  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      // Prepare filters for API call
      const apiFilters = { ...filters };
      
      // Handle period selection
      if (filters.period !== 'custom') {
        delete apiFilters.startDate;
        delete apiFilters.endDate;
      }
      
      const response = await generateAdvancedFinancialReport(apiFilters);
      setReportData(response.data);
      console.log('📊 Financial report data:', response.data);
    } catch (err) {
      setError(err.message || 'Failed to generate financial report');
      console.error('Error generating financial report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize with a report
  useEffect(() => {
    generateReport();
  }, []);

  const handleBackClick = () => {
    navigate('/reports');
  };

  const renderProfitLossStatement = () => {
    if (!reportData?.profit_loss) return null;
    const { profit_loss } = reportData;

    return (
      <div className={styles.reportCard}>
        <h2 className={styles.reportHeader}>Profit & Loss Statement</h2>
        <div className={styles.reportGrid}>
          <div>
            <h3 className={styles.sectionHeader}>Revenue & COGS</h3>
            <div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Total Revenue</span>
                <span className={`${styles.dataValue} ${styles.bold}`}>{formatCurrency(profit_loss.revenue)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Cost of Goods Sold</span>
                <span className={styles.dataValue}>{formatCurrency(profit_loss.cogs)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`}>Gross Profit</span>
                <span className={`${styles.dataValue} ${styles.bold} ${styles.success}`}>{formatCurrency(profit_loss.gross_profit)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Gross Margin</span>
                <span className={styles.dataValue}>{formatPercentage(profit_loss.gross_profit_margin)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className={styles.sectionHeader}>Operating Expenses</h3>
            <div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Salaries & Wages</span>
                <span className={styles.dataValue}>{formatCurrency(profit_loss.operating_expenses.salaries)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Rent & Lease</span>
                <span className={styles.dataValue}>{formatCurrency(profit_loss.operating_expenses.rent)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Utilities</span>
                <span className={styles.dataValue}>{formatCurrency(profit_loss.operating_expenses.utilities)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Marketing</span>
                <span className={styles.dataValue}>{formatCurrency(profit_loss.operating_expenses.marketing)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`}>Total Operating Expenses</span>
                <span className={`${styles.dataValue} ${styles.bold}`}>{formatCurrency(profit_loss.total_operating_expenses)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`}>Net Income</span>
                <span className={`${styles.dataValue} ${styles.bold} ${styles.primary}`}>{formatCurrency(profit_loss.net_income)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!reportData?.balance_sheet) return null;
    const { balance_sheet } = reportData;

    return (
      <div className={styles.reportCard}>
        <h2 className={styles.reportHeader}>Balance Sheet</h2>
        <div className={styles.reportGrid}>
          <div>
            <h3 className={styles.sectionHeader}>Assets</h3>
            <div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`}>Current Assets</span>
                <span className={styles.dataValue}></span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel} style={{ paddingLeft: '1rem' }}>Cash</span>
                <span className={styles.dataValue}>{formatCurrency(balance_sheet.assets.current_assets.cash)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel} style={{ paddingLeft: '1rem' }}>Accounts Receivable</span>
                <span className={styles.dataValue}>{formatCurrency(balance_sheet.assets.current_assets.accounts_receivable)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel} style={{ paddingLeft: '1rem' }}>Inventory</span>
                <span className={styles.dataValue}>{formatCurrency(balance_sheet.assets.current_assets.inventory)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`} style={{ paddingLeft: '1rem' }}>Total Current Assets</span>
                <span className={`${styles.dataValue} ${styles.bold}`}>{formatCurrency(balance_sheet.assets.current_assets.total)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Fixed Assets</span>
                <span className={styles.dataValue}>{formatCurrency(balance_sheet.assets.fixed_assets)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`}>Total Assets</span>
                <span className={`${styles.dataValue} ${styles.bold}`}>{formatCurrency(balance_sheet.assets.total_assets)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className={styles.sectionHeader}>Liabilities</h3>
            <div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`}>Current Liabilities</span>
                <span className={styles.dataValue}></span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel} style={{ paddingLeft: '1rem' }}>Accounts Payable</span>
                <span className={styles.dataValue}>{formatCurrency(balance_sheet.liabilities.current_liabilities.accounts_payable)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`} style={{ paddingLeft: '1rem' }}>Total Current Liabilities</span>
                <span className={`${styles.dataValue} ${styles.bold}`}>{formatCurrency(balance_sheet.liabilities.current_liabilities.total)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Long Term Debt</span>
                <span className={styles.dataValue}>{formatCurrency(balance_sheet.liabilities.long_term_debt)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`}>Total Liabilities</span>
                <span className={`${styles.dataValue} ${styles.bold}`}>{formatCurrency(balance_sheet.liabilities.total_liabilities)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className={styles.sectionHeader}>Equity</h3>
            <div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Retained Earnings</span>
                <span className={styles.dataValue}>{formatCurrency(balance_sheet.equity.retained_earnings)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Owner's Equity</span>
                <span className={styles.dataValue}>{formatCurrency(balance_sheet.equity.owner_equity)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`}>Total Equity</span>
                <span className={`${styles.dataValue} ${styles.bold}`}>{formatCurrency(balance_sheet.equity.total_equity)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`}>Total Liabilities & Equity</span>
                <span className={`${styles.dataValue} ${styles.bold}`}>{formatCurrency(balance_sheet.liabilities.total_liabilities + balance_sheet.equity.total_equity)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCashFlowStatement = () => {
    if (!reportData?.cash_flow) return null;
    const { cash_flow } = reportData;

    return (
      <div className={styles.reportCard}>
        <h2 className={styles.reportHeader}>Cash Flow Statement</h2>
        <div className={styles.reportGrid}>
          <div>
            <h3 className={styles.sectionHeader}>Operating Activities</h3>
            <div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Cash from Sales</span>
                <span className={styles.dataValue}>{formatCurrency(cash_flow.operating_activities.cash_from_sales)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Cash to Purchases</span>
                <span className={styles.dataValue}>{formatCurrency(cash_flow.operating_activities.cash_to_purchases)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Cash to Expenses</span>
                <span className={styles.dataValue}>{formatCurrency(cash_flow.operating_activities.cash_to_expenses)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`}>Net Operating Cash Flow</span>
                <span className={`${styles.dataValue} ${styles.bold}`}>{formatCurrency(cash_flow.operating_activities.net_operating_cash_flow)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className={styles.sectionHeader}>Investing Activities</h3>
            <div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Equipment Purchases</span>
                <span className={styles.dataValue}>{formatCurrency(cash_flow.investing_activities.equipment_purchases)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`}>Net Investing Cash Flow</span>
                <span className={`${styles.dataValue} ${styles.bold}`}>{formatCurrency(cash_flow.investing_activities.net_investing_cash_flow)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className={styles.sectionHeader}>Financing Activities</h3>
            <div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Deposits</span>
                <span className={styles.dataValue}>{formatCurrency(cash_flow.financing_activities.deposits)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Withdrawals</span>
                <span className={styles.dataValue}>{formatCurrency(cash_flow.financing_activities.withdrawals)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`}>Net Financing Cash Flow</span>
                <span className={`${styles.dataValue} ${styles.bold}`}>{formatCurrency(cash_flow.financing_activities.net_financing_cash_flow)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={`${styles.dataLabel} ${styles.bold}`}>Net Cash Flow</span>
                <span className={`${styles.dataValue} ${styles.bold} ${styles.primary}`}>{formatCurrency(cash_flow.net_cash_flow)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSummaryCards = () => {
    if (!reportData?.summary) return null;
    const { summary } = reportData;

    return (
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard} style={{ '--gradient': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
          <div className={styles.summaryHeader}>
            <div>
              <div className={styles.summaryTitle}>Total Revenue</div>
              <div className={styles.summaryValue}>{formatCurrency(summary.total_revenue)}</div>
            </div>
            <div className={styles.iconContainer} style={{ backgroundColor: '#3b82f6' }}>
              <TrendingUp size={22} color="white" />
            </div>
          </div>
        </div>
        <div className={styles.summaryCard} style={{ '--gradient': 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}>
          <div className={styles.summaryHeader}>
            <div>
              <div className={styles.summaryTitle}>Total Expenses</div>
              <div className={styles.summaryValue}>{formatCurrency(summary.total_expenses)}</div>
            </div>
            <div className={styles.iconContainer} style={{ backgroundColor: '#ef4444' }}>
              <TrendingDown size={22} color="white" />
            </div>
          </div>
        </div>
        <div className={styles.summaryCard} style={{ '--gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <div className={styles.summaryHeader}>
            <div>
              <div className={styles.summaryTitle}>Net Profit</div>
              <div className={styles.summaryValue}>{formatCurrency(summary.net_profit)}</div>
            </div>
            <div className={styles.iconContainer} style={{ backgroundColor: '#10b981' }}>
              <BarChart2 size={22} color="white" />
            </div>
          </div>
        </div>
        <div className={styles.summaryCard} style={{ '--gradient': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
          <div className={styles.summaryHeader}>
            <div>
              <div className={styles.summaryTitle}>Cash Flow</div>
              <div className={styles.summaryValue}>{formatCurrency(summary.cash_flow)}</div>
            </div>
            <div className={styles.iconContainer} style={{ backgroundColor: '#06b6d4' }}>
              <Wallet size={22} color="white" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFilters = () => (
    <div className={styles.filterCard}>
      <div className={styles.filterHeader}>
        <Filter size={22} />
        <h2>Filters & Options</h2>
      </div>
      
      {error && (
        <div className={styles.errorAlert}>
          {error}
        </div>
      )}
      
      <div className={styles.filterGrid}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Report Type</label>
          <select
            className={styles.filterSelect}
            value={filters.reportType}
            onChange={(e) => handleFilterChange('reportType', e.target.value)}
          >
            <option value="comprehensive">Comprehensive</option>
            <option value="profit_loss">Profit & Loss</option>
            <option value="cash_flow">Cash Flow</option>
            <option value="balance_sheet">Balance Sheet</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Period</label>
          <select
            className={styles.filterSelect}
            value={filters.period}
            onChange={(e) => handleFilterChange('period', e.target.value)}
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      <div className={styles.buttonContainer}>
        <button
          className={styles.primaryButton}
          onClick={generateReport}
          disabled={loading}
        >
          {loading ? (
            <>
              <RefreshCw size={18} className="spinning" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw size={18} />
              Generate Report
            </>
          )}
        </button>
        <button
          className={styles.secondaryButton}
          onClick={() => console.log('Export')}
        >
          <Download size={18} />
          Export
        </button>
      </div>
    </div>
  );

  const renderRatiosTab = () => (
    <div className={styles.reportCard}>
      {reportData?.financial_ratios && (
        <div className={styles.reportGrid}>
          <div>
            <h3 className={styles.sectionHeader}>Profitability Ratios</h3>
            <div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Gross Profit Margin</span>
                <span className={styles.dataValue}>{formatPercentage(reportData.financial_ratios.gross_profit_margin)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Net Profit Margin</span>
                <span className={styles.dataValue}>{formatPercentage(reportData.financial_ratios.net_profit_margin)}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className={styles.sectionHeader}>Liquidity Ratios</h3>
            <div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Current Ratio</span>
                <span className={styles.dataValue}>{reportData.financial_ratios.current_ratio?.toFixed(2)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Quick Ratio</span>
                <span className={styles.dataValue}>{reportData.financial_ratios.quick_ratio?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 0, label: 'Comprehensive' },
    { id: 1, label: 'Profit & Loss' },
    { id: 2, label: 'Balance Sheet' },
    { id: 3, label: 'Cash Flow' },
    { id: 4, label: 'Ratios' }
  ];

  return (
    <div className={styles.financialReports}>
      <div className={styles.financialReportsHeader}>
        <button className={styles.backButton} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Reports
        </button>
        <h1>Financial Reports</h1>
        <p>Comprehensive financial analysis and reporting</p>
      </div>
      
      <div className={styles.financialReportsContent}>
        {renderFilters()}
        
        {reportData && (
          <>
            {renderSummaryCards()}
            
            <div className={styles.tabsContainer}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {activeTab === 0 && (
              <>
                {renderProfitLossStatement()}
                {renderBalanceSheet()}
                {renderCashFlowStatement()}
                {renderRatiosTab()}
              </>
            )}
            
            {activeTab === 1 && renderProfitLossStatement()}
            {activeTab === 2 && renderBalanceSheet()}
            {activeTab === 3 && renderCashFlowStatement()}
            {activeTab === 4 && renderRatiosTab()}
          </>
        )}
        
        {loading && !reportData && (
          <div className={styles.loadingContainer}>
            <RefreshCw size={32} className="spinning" />
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReports;