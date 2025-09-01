import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem, Button,
  CircularProgress, Alert, Tabs, Tab, Divider, IconButton, FormControl,
  InputLabel, Select, Switch, FormControlLabel, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination, Chip,
  Grid
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Download as DownloadIcon, Refresh as RefreshIcon, FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
  AccountBalance as FinanceIcon, MonetizationOn as ProfitIcon,
  Receipt as ExpenseIcon, AccountBalanceWallet as CashIcon, ShowChart as GrowthIcon
} from '@mui/icons-material';
import { generateAdvancedFinancialReport } from '../services/reportService';

const FinancialReports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [filters, setFilters] = useState({
    period: 'last_30_days',
    startDate: null,
    endDate: null,
    groupBy: 'month',
    includeComparisons: true,
    includeForecasting: true,
    reportType: 'comprehensive'
  });

  useEffect(() => {
    generateReport();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await generateAdvancedFinancialReport(filters);
      if (response.success) {
        setReportData(response.data);
      } else {
        setError(response.message || 'Failed to generate financial report');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while generating the report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(2)}%`;
  };

  const getGrowthIcon = (value) => {
    return value >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

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

  const renderOverviewTab = () => {
    if (filters.reportType === 'profit_loss') {
      return (
        <Box>
          {renderProfitLossStatement()}
        </Box>
      );
    }
    
    if (filters.reportType === 'balance_sheet') {
      return (
        <Box>
          {renderBalanceSheet()}
        </Box>
      );
    }
    
    if (filters.reportType === 'cash_flow') {
      return (
        <Box>
          {renderCashFlowStatement()}
        </Box>
      );
    }
    
    return (
      <Box>
        {renderSummaryCards()}
        {renderProfitLossStatement()}
        {renderBalanceSheet()}
        {renderCashFlowStatement()}
      </Box>
    );
  };

  const renderDetailedAnalysisTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Detailed Financial Analysis</Typography>
        {reportData?.transactions && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.transactions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={transaction.type} 
                          color={transaction.type === 'income' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={reportData.transactions?.length || 0}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            />
          </TableContainer>
        )}
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <FinanceIcon sx={{ fontSize: 32 }} />
              Professional Financial Reports
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Comprehensive financial statements and analysis
            </Typography>
          </Box>
        </Box>

        {renderFilters()}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {reportData && !loading && (
          <Box>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label="Financial Statement" />
              <Tab label="Detailed Analysis" />
              <Tab label="Ratios & Metrics" />
            </Tabs>

            {activeTab === 0 && renderOverviewTab()}
            {activeTab === 1 && renderDetailedAnalysisTab()}
            {activeTab === 2 && renderRatiosTab()}
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default FinancialReports;
