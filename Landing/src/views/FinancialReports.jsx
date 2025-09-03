import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  TrendingUp as ProfitIcon,
  TrendingDown as ExpenseIcon,
  BarChart as GrowthIcon,
  AccountBalance as CashIcon
} from '@mui/icons-material';
import { generateAdvancedFinancialReport } from '../services/reportService';

const FinancialReports = () => {
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

  const renderProfitLossStatement = () => {
    if (!reportData?.profit_loss) return null;
    const { profit_loss } = reportData;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Profit & Loss Statement</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Revenue & COGS</Typography>
              <Box sx={{ pl: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Total Revenue</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(profit_loss.revenue)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Cost of Goods Sold</Typography>
                  <Typography>{formatCurrency(profit_loss.cogs)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 'bold' }}>Gross Profit</Typography>
                  <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>{formatCurrency(profit_loss.gross_profit)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Gross Margin</Typography>
                  <Typography variant="body2">{formatPercentage(profit_loss.gross_profit_margin)}</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Operating Expenses</Typography>
              <Box sx={{ pl: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Salaries & Wages</Typography>
                  <Typography>{formatCurrency(profit_loss.operating_expenses.salaries)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Rent & Lease</Typography>
                  <Typography>{formatCurrency(profit_loss.operating_expenses.rent)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Utilities</Typography>
                  <Typography>{formatCurrency(profit_loss.operating_expenses.utilities)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Marketing</Typography>
                  <Typography>{formatCurrency(profit_loss.operating_expenses.marketing)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 'bold' }}>Total Operating Expenses</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(profit_loss.total_operating_expenses)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>Net Income</Typography>
                  <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>{formatCurrency(profit_loss.net_income)}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderBalanceSheet = () => {
    if (!reportData?.balance_sheet) return null;
    const { balance_sheet } = reportData;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Balance Sheet</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Assets</Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Current Assets</Typography>
                <Box sx={{ pl: 2 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Cash</Typography>
                    <Typography variant="body2">{formatCurrency(balance_sheet.assets.current_assets.cash)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Accounts Receivable</Typography>
                    <Typography variant="body2">{formatCurrency(balance_sheet.assets.current_assets.accounts_receivable)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Inventory</Typography>
                    <Typography variant="body2">{formatCurrency(balance_sheet.assets.current_assets.inventory)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Total Current Assets</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatCurrency(balance_sheet.assets.current_assets.total)}</Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Fixed Assets</Typography>
                    <Typography variant="body2">{formatCurrency(balance_sheet.assets.fixed_assets)}</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 'bold' }}>Total Assets</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(balance_sheet.assets.total_assets)}</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Liabilities</Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Current Liabilities</Typography>
                <Box sx={{ pl: 2 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Accounts Payable</Typography>
                    <Typography variant="body2">{formatCurrency(balance_sheet.liabilities.current_liabilities.accounts_payable)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Total Current Liabilities</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatCurrency(balance_sheet.liabilities.current_liabilities.total)}</Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Long Term Debt</Typography>
                    <Typography variant="body2">{formatCurrency(balance_sheet.liabilities.long_term_debt)}</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 'bold' }}>Total Liabilities</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(balance_sheet.liabilities.total_liabilities)}</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Equity</Typography>
              <Box sx={{ pl: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Retained Earnings</Typography>
                  <Typography variant="body2">{formatCurrency(balance_sheet.equity.retained_earnings)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Owner's Equity</Typography>
                  <Typography variant="body2">{formatCurrency(balance_sheet.equity.owner_equity)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 'bold' }}>Total Equity</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(balance_sheet.equity.total_equity)}</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 'bold' }}>Total Liabilities & Equity</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(balance_sheet.liabilities.total_liabilities + balance_sheet.equity.total_equity)}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderCashFlowStatement = () => {
    if (!reportData?.cash_flow) return null;
    const { cash_flow } = reportData;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Cash Flow Statement</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Operating Activities</Typography>
              <Box sx={{ pl: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Cash from Sales</Typography>
                  <Typography variant="body2">{formatCurrency(cash_flow.operating_activities.cash_from_sales)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Cash to Purchases</Typography>
                  <Typography variant="body2">{formatCurrency(cash_flow.operating_activities.cash_to_purchases)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Cash to Expenses</Typography>
                  <Typography variant="body2">{formatCurrency(cash_flow.operating_activities.cash_to_expenses)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 'bold' }}>Net Operating Cash Flow</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(cash_flow.operating_activities.net_operating_cash_flow)}</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Investing Activities</Typography>
              <Box sx={{ pl: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Equipment Purchases</Typography>
                  <Typography variant="body2">{formatCurrency(cash_flow.investing_activities.equipment_purchases)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 'bold' }}>Net Investing Cash Flow</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(cash_flow.investing_activities.net_investing_cash_flow)}</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Financing Activities</Typography>
              <Box sx={{ pl: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Deposits</Typography>
                  <Typography variant="body2">{formatCurrency(cash_flow.financing_activities.deposits)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Withdrawals</Typography>
                  <Typography variant="body2">{formatCurrency(cash_flow.financing_activities.withdrawals)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 'bold' }}>Net Financing Cash Flow</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(cash_flow.financing_activities.net_financing_cash_flow)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>Net Cash Flow</Typography>
                  <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>{formatCurrency(cash_flow.net_cash_flow)}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderSummaryCards = () => {
    if (!reportData?.summary) return null;
    const { summary } = reportData;

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">Total Revenue</Typography>
                  <Typography variant="h4">{formatCurrency(summary.total_revenue)}</Typography>
                </Box>
                <ProfitIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">Total Expenses</Typography>
                  <Typography variant="h4">{formatCurrency(summary.total_expenses)}</Typography>
                </Box>
                <ExpenseIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">Net Profit</Typography>
                  <Typography variant="h4">{formatCurrency(summary.net_profit)}</Typography>
                </Box>
                <GrowthIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">Cash Flow</Typography>
                  <Typography variant="h4">{formatCurrency(summary.cash_flow)}</Typography>
                </Box>
                <CashIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderFilters = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Filters & Options
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Report Type</InputLabel>
              <Select
                value={filters.reportType}
                label="Report Type"
                onChange={(e) => handleFilterChange('reportType', e.target.value)}
              >
                <MenuItem value="comprehensive">Comprehensive</MenuItem>
                <MenuItem value="profit_loss">Profit & Loss</MenuItem>
                <MenuItem value="cash_flow">Cash Flow</MenuItem>
                <MenuItem value="balance_sheet">Balance Sheet</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Period</InputLabel>
              <Select
                value={filters.period}
                label="Period"
                onChange={(e) => handleFilterChange('period', e.target.value)}
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="this_week">This Week</MenuItem>
                <MenuItem value="this_month">This Month</MenuItem>
                <MenuItem value="this_quarter">This Quarter</MenuItem>
                <MenuItem value="this_year">This Year</MenuItem>
                <MenuItem value="last_30_days">Last 30 Days</MenuItem>
                <MenuItem value="last_90_days">Last 90 Days</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={generateReport}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => console.log('Export')}
          >
            Export
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderRatiosTab = () => (
    <Box>
      {reportData?.financial_ratios && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Profitability Ratios</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Gross Profit Margin</Typography>
                    <Typography variant="h6">{formatPercentage(reportData.financial_ratios.gross_profit_margin)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Net Profit Margin</Typography>
                    <Typography variant="h6">{formatPercentage(reportData.financial_ratios.net_profit_margin)}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Liquidity Ratios</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Current Ratio</Typography>
                    <Typography variant="h6">{reportData.financial_ratios.current_ratio?.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Quick Ratio</Typography>
                    <Typography variant="h6">{reportData.financial_ratios.quick_ratio?.toFixed(2)}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Financial Reports
      </Typography>
      
      {renderFilters()}
      
      {reportData && (
        <>
          {renderSummaryCards()}
          
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="Comprehensive" />
            <Tab label="Profit & Loss" />
            <Tab label="Balance Sheet" />
            <Tab label="Cash Flow" />
            <Tab label="Ratios" />
          </Tabs>
          
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
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default FinancialReports;