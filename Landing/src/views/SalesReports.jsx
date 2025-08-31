import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  ButtonGroup,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Switch,
  InputAdornment
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { generateAdvancedSalesReport, exportSalesReport, getSalesAnalytics } from '../services/reportService';
import { getCustomers } from '../services/customerService';
import { getStores } from '../services/storeService';
import { getProducts } from '../services/productService';

const SalesReports = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  
  // Filters state
  const [filters, setFilters] = useState({
    period: 'last_30_days',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    customer_no: '',
    store_no: '',
    product_no: '',
    status: '',
    payment_status: '',
    min_amount: '',
    max_amount: '',
    groupBy: 'day',
    metrics: 'advanced',
    includeItems: true,
    includeComparisons: true,
    page: 1,
    limit: 25,
    sortBy: 'sel_date',
    sortOrder: 'desc'
  });
  
  // Dropdown data
  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Predefined period options
  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_90_days', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const paymentStatusOptions = [
    { value: '', label: 'All Payment Status' },
    { value: 'paid', label: 'Fully Paid' },
    { value: 'partial', label: 'Partially Paid' },
    { value: 'unpaid', label: 'Unpaid' }
  ];

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [customersData, storesData, productsData] = await Promise.all([
          getCustomers(),
          getStores(),
          getProducts()
        ]);
        setCustomers(customersData.data || customersData || []);
        setStores(storesData.data || storesData || []);
        setProducts(productsData.data || productsData || []);
      } catch (err) {
        console.error('Error loading dropdown data:', err);
      }
    };
    loadDropdownData();
  }, []);

  // Load initial data
  useEffect(() => {
    generateReport();
    loadAnalytics();
  }, []);

  // Generate report
  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const reportFilters = { ...filters };
      
      // Handle period selection
      if (filters.period !== 'custom') {
        delete reportFilters.startDate;
        delete reportFilters.endDate;
      }
      
      const response = await generateAdvancedSalesReport(reportFilters);
      setReportData(response.data);
      console.log('📊 Sales report data:', response.data);
    } catch (err) {
      setError(err.message || 'Failed to generate sales report');
      console.error('Error generating sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      const analyticsData = await getSalesAnalytics(filters.period);
      setAnalytics(analyticsData.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'period' && value !== 'custom' ? { startDate: null, endDate: null } : {})
    }));
  };

  // Handle export
  const handleExport = async (format) => {
    try {
      setLoading(true);
      await exportSalesReport(filters, format);
    } catch (err) {
      setError(`Failed to export report as ${format}`);
    } finally {
      setLoading(false);
    }
  };

  // Summary cards data
  const summaryCards = useMemo(() => {
    if (!reportData?.summary) return [];
    
    const { summary, comparisons } = reportData;
    
    return [
      {
        title: 'Total Revenue',
        value: `$${Number(summary.total_revenue || 0).toLocaleString()}`,
        change: comparisons?.growth?.revenue || 0,
        icon: '💰',
        color: 'primary'
      },
      {
        title: 'Total Sales',
        value: summary.total_sales || 0,
        change: comparisons?.growth?.sales_count || 0,
        icon: '📊',
        color: 'success'
      },
      {
        title: 'Avg Order Value',
        value: `$${summary.average_order_value || 0}`,
        change: comparisons?.growth?.average_order_value || 0,
        icon: '🛒',
        color: 'info'
      },
      {
        title: 'Collection Rate',
        value: `${summary.payment_collection_rate || 0}%`,
        change: comparisons?.growth?.payment_collection_rate || 0,
        icon: '💳',
        color: 'warning'
      },
      {
        title: 'Outstanding',
        value: `$${Number(summary.total_outstanding || 0).toLocaleString()}`,
        change: null,
        icon: '⏳',
        color: 'error'
      },
      {
        title: 'Unique Customers',
        value: summary.unique_customers_count || 0,
        change: null,
        icon: '👥',
        color: 'secondary'
      }
    ];
  }, [reportData]);

  // Chart colors
  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, maxWidth: '100%' }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Sales Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enterprise-level sales analytics and reporting
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={generateReport}
              disabled={loading}
            >
              Refresh
            </Button>
            <ButtonGroup variant="outlined" size="small">
              <Button onClick={() => handleExport('csv')} disabled={loading}>
                CSV
              </Button>
              <Button onClick={() => handleExport('excel')} disabled={loading}>
                Excel
              </Button>
              <Button onClick={() => handleExport('pdf')} disabled={loading}>
                PDF
              </Button>
            </ButtonGroup>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Overview" />
            <Tab label="Detailed Analysis" />
            <Tab label="Top Performers" />
            <Tab label="Time Series" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Box>
            {/* Filters */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterIcon />
                  Filters
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      label="Period"
                      value={filters.period}
                      onChange={(e) => handleFilterChange('period', e.target.value)}
                      size="small"
                    >
                      {periodOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  {filters.period === 'custom' && (
                    <>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DatePicker
                          label="Start Date"
                          value={filters.startDate}
                          onChange={(date) => handleFilterChange('startDate', date)}
                          slotProps={{ textField: { size: "small", fullWidth: true } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DatePicker
                          label="End Date"
                          value={filters.endDate}
                          onChange={(date) => handleFilterChange('endDate', date)}
                          slotProps={{ textField: { size: "small", fullWidth: true } }}
                        />
                      </Grid>
                    </>
                  )}
                  
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      label="Customer"
                      value={filters.customer_no}
                      onChange={(e) => handleFilterChange('customer_no', e.target.value)}
                      size="small"
                    >
                      <MenuItem value="">All Customers</MenuItem>
                      {customers.map((customer) => (
                        <MenuItem key={customer.customer_no} value={customer.customer_no}>
                          {customer.name || customer.customer_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      label="Store"
                      value={filters.store_no}
                      onChange={(e) => handleFilterChange('store_no', e.target.value)}
                      size="small"
                    >
                      <MenuItem value="">All Stores</MenuItem>
                      {stores.map((store) => (
                        <MenuItem key={store.store_no} value={store.store_no}>
                          {store.store_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      label="Status"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      size="small"
                    >
                      {statusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      label="Payment Status"
                      value={filters.payment_status}
                      onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                      size="small"
                    >
                      {paymentStatusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Min Amount"
                      type="number"
                      value={filters.min_amount}
                      onChange={(e) => handleFilterChange('min_amount', e.target.value)}
                      size="small"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Max Amount"
                      type="number"
                      value={filters.max_amount}
                      onChange={(e) => handleFilterChange('max_amount', e.target.value)}
                      size="small"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.includeItems}
                        onChange={(e) => handleFilterChange('includeItems', e.target.checked)}
                      />
                    }
                    label="Include Items"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.includeComparisons}
                        onChange={(e) => handleFilterChange('includeComparisons', e.target.checked)}
                      />
                    }
                    label="Include Comparisons"
                  />
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={generateReport}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <SearchIcon />}
                  >
                    {loading ? 'Generating...' : 'Generate Report'}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            {reportData && (
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {summaryCards.map((card, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={index}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h3" sx={{ mr: 1 }}>
                            {card.icon}
                          </Typography>
                          <Box>
                            <Typography variant="h6" component="div">
                              {card.value}
                            </Typography>
                            {card.change !== null && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {card.change >= 0 ? (
                                  <TrendingUpIcon color="success" fontSize="small" />
                                ) : (
                                  <TrendingDownIcon color="error" fontSize="small" />
                                )}
                                <Typography
                                  variant="caption"
                                  color={card.change >= 0 ? 'success.main' : 'error.main'}
                                  sx={{ ml: 0.5 }}
                                >
                                  {Math.abs(card.change)}%
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {card.title}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Charts */}
            {reportData?.timeSeriesData && (
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Revenue Trend
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={reportData.timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <RechartsTooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                          <Area type="monotone" dataKey="total_revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Payment Status
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Paid', value: reportData.summary.payment_status_breakdown.paid },
                              { name: 'Partial', value: reportData.summary.payment_status_breakdown.partial },
                              { name: 'Unpaid', value: reportData.summary.payment_status_breakdown.unpaid }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {chartColors.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        )}

        {/* Tab 1: Detailed Analysis */}
        {activeTab === 1 && (
          <Box>
            {/* Sales Data Table */}
            {reportData?.sales && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📋 Sales Transactions
                  </Typography>
                  
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Sale No</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Store</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Paid</TableCell>
                          <TableCell>Balance</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Payment Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.sales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((sale, index) => (
                          <TableRow key={sale._id || index} hover>
                            <TableCell>{sale.sel_no}</TableCell>
                            <TableCell>
                              {sale.sel_date ? new Date(sale.sel_date).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>{sale.customer_name || '-'}</TableCell>
                            <TableCell>{sale.store_name || '-'}</TableCell>
                            <TableCell>${Number(sale.amount || 0).toLocaleString()}</TableCell>
                            <TableCell>${Number(sale.paid || 0).toLocaleString()}</TableCell>
                            <TableCell>${Number(sale.balance_due || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              <Chip 
                                label={sale.status || 'confirmed'} 
                                size="small" 
                                color={sale.status === 'delivered' ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={sale.payment_status || 'unknown'} 
                                size="small" 
                                color={
                                  sale.payment_status === 'paid' ? 'success' : 
                                  sale.payment_status === 'partial' ? 'warning' : 'error'
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <TablePagination
                      component="div"
                      count={reportData.sales.length}
                      page={page}
                      onPageChange={(event, newPage) => setPage(newPage)}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={(event) => {
                        setRowsPerPage(parseInt(event.target.value, 10));
                        setPage(0);
                      }}
                      rowsPerPageOptions={[10, 25, 50, 100]}
                    />
                  </TableContainer>
                </CardContent>
              </Card>
            )}
            
            {/* Comparison Metrics */}
            {reportData?.comparisons && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📊 Period Comparison
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Current Period</Typography>
                        <Typography variant="body2">Revenue: ${Number(reportData.comparisons.current.total_revenue || 0).toLocaleString()}</Typography>
                        <Typography variant="body2">Sales Count: {reportData.comparisons.current.total_sales || 0}</Typography>
                        <Typography variant="body2">Avg Order: ${reportData.comparisons.current.average_order_value || 0}</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Previous Period</Typography>
                        <Typography variant="body2">Revenue: ${Number(reportData.comparisons.previous.total_revenue || 0).toLocaleString()}</Typography>
                        <Typography variant="body2">Sales Count: {reportData.comparisons.previous.total_sales || 0}</Typography>
                        <Typography variant="body2">Avg Order: ${reportData.comparisons.previous.average_order_value || 0}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Growth Metrics</Typography>
                    <Grid container spacing={2}>
                      {Object.entries(reportData.comparisons.growth || {}).map(([key, value]) => (
                        <Grid size={{ xs: 6, sm: 3 }} key={key}>
                          <Box sx={{ textAlign: 'center', p: 1 }}>
                            <Typography variant="h6" color={value >= 0 ? 'success.main' : 'error.main'}>
                              {value >= 0 ? '+' : ''}{value}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {/* Tab 2: Top Performers */}
        {activeTab === 2 && (
          <Box>
            {reportData?.topPerformers && (
              <Grid container spacing={3}>
                {/* Top Customers */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        👥 Top Customers
                      </Typography>
                      {reportData.topPerformers.top_customers?.length > 0 ? (
                        <Box>
                          {reportData.topPerformers.top_customers.map((customer, index) => (
                            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: index < reportData.topPerformers.top_customers.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {customer.customer_name || `Customer ${customer.customer_no}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {customer.total_orders} orders
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                ${Number(customer.total_revenue || 0).toLocaleString()}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No customer data available</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Top Products */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        📦 Top Products
                      </Typography>
                      {reportData.topPerformers.top_products?.length > 0 ? (
                        <Box>
                          {reportData.topPerformers.top_products.map((product, index) => (
                            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: index < reportData.topPerformers.top_products.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {product.product_name || `Product ${product.product_no}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {product.total_qty} sold
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                ${Number(product.total_revenue || 0).toLocaleString()}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No product data available</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Top Stores */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        🏪 Top Stores
                      </Typography>
                      {reportData.topPerformers.top_stores?.length > 0 ? (
                        <Box>
                          {reportData.topPerformers.top_stores.map((store, index) => (
                            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: index < reportData.topPerformers.top_stores.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {store.store_name || `Store ${store.store_no}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {store.total_orders} orders
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                ${Number(store.total_revenue || 0).toLocaleString()}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No store data available</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Performance Charts */}
                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Top Products Performance</Typography>
                      {reportData.topPerformers.top_products?.length > 0 && (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={reportData.topPerformers.top_products.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="product_name" 
                              angle={-45}
                              textAnchor="end"
                              height={100}
                              interval={0}
                            />
                            <YAxis />
                            <RechartsTooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                            <Bar dataKey="total_revenue" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        )}

        {/* Tab 3: Time Series */}
        {activeTab === 3 && (
          <Box>
            {/* Time Series Controls */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Time Series Settings</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      fullWidth
                      label="Group By"
                      value={filters.groupBy}
                      onChange={(e) => handleFilterChange('groupBy', e.target.value)}
                      size="small"
                    >
                      <MenuItem value="day">Daily</MenuItem>
                      <MenuItem value="week">Weekly</MenuItem>
                      <MenuItem value="month">Monthly</MenuItem>
                      <MenuItem value="quarter">Quarterly</MenuItem>
                      <MenuItem value="year">Yearly</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Button
                      variant="contained"
                      onClick={generateReport}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                    >
                      Update Chart
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            {/* Revenue Trend */}
            {reportData?.timeSeriesData && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Revenue Over Time</Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={reportData.timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <RechartsTooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                          <Legend />
                          <Line type="monotone" dataKey="total_revenue" stroke="#8884d8" strokeWidth={2} name="Revenue" />
                          <Line type="monotone" dataKey="total_sales" stroke="#82ca9d" strokeWidth={2} name="Sales Count" yAxisId="right" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Sales Volume Trend</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={reportData.timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="total_sales" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Average Order Value</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <RechartsTooltip formatter={(value) => [`$${value}`, 'AOV']} />
                          <Line type="monotone" dataKey="average_order_value" stroke="#ffc658" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Time Series Summary Table */}
                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Time Series Data</Typography>
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Period</TableCell>
                              <TableCell align="right">Revenue</TableCell>
                              <TableCell align="right">Sales Count</TableCell>
                              <TableCell align="right">Avg Order Value</TableCell>
                              <TableCell align="right">Growth</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {reportData.timeSeriesData?.map((item, index) => {
                              const prevItem = reportData.timeSeriesData[index - 1];
                              const growth = prevItem ? (((item.total_revenue - prevItem.total_revenue) / prevItem.total_revenue) * 100).toFixed(1) : '-';
                              
                              return (
                                <TableRow key={index}>
                                  <TableCell>{item.period}</TableCell>
                                  <TableCell align="right">${Number(item.total_revenue || 0).toLocaleString()}</TableCell>
                                  <TableCell align="right">{item.total_sales || 0}</TableCell>
                                  <TableCell align="right">${Number(item.average_order_value || 0).toFixed(2)}</TableCell>
                                  <TableCell align="right">
                                    {growth !== '-' && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        {parseFloat(growth) >= 0 ? (
                                          <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                                        ) : (
                                          <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                                        )}
                                        <Typography 
                                          variant="body2" 
                                          color={parseFloat(growth) >= 0 ? 'success.main' : 'error.main'}
                                        >
                                          {growth}%
                                        </Typography>
                                      </Box>
                                    )}
                                    {growth === '-' && '-'}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        )}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default SalesReports;