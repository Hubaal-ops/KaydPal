import React, { useState, useEffect, useMemo } from 'react';
import styles from './SalesReports.module.css';
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
  Search as SearchIcon,
  ArrowLeft
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
import { useNavigate } from 'react-router-dom';

const SalesReports = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  
  // Handle back button click to return to reports
  const handleBackClick = () => {
    navigate('/reports');
  };
  
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
      <div className={styles.salesReports}>
        {/* Header */}
        <div className={styles.salesReportsHeader}>
          <button className={styles.backButton} onClick={handleBackClick}>
            <ArrowLeft size={20} />
            Back to Reports
          </button>
          <h1>Sales Reports</h1>
          <p>Enterprise-level sales analytics and reporting</p>
          <div style={{ position: 'absolute', right: 0, top: 0, display: 'flex', gap: '0.5rem' }}>
            <button
              className={styles.iconButton}
              onClick={() => handleExport('csv')}
              disabled={loading}
              title="Export as CSV"
            >
              <DownloadIcon size={20} />
            </button>
            <button
              className={styles.iconButton}
              onClick={() => handleExport('excel')}
              disabled={loading}
              title="Export as Excel"
            >
              <DownloadIcon size={20} />
            </button>
            <button
              className={styles.iconButton}
              onClick={() => handleExport('pdf')}
              disabled={loading}
              title="Export as PDF"
            >
              <PrintIcon size={20} />
            </button>
            <button
              className={styles.iconButton}
              onClick={generateReport}
              disabled={loading}
              title="Refresh"
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <RefreshIcon size={20} />
              )}
            </button>
          </div>
        </div>

        <div className={styles.salesReportsContent}>
          {/* Error Alert */}
          {error && (
            <div className={styles.errorAlert}>
              {error}
              <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className={styles.tabsContainer}>
            <button 
              className={`${styles.tabButton} ${activeTab === 0 ? styles.active : ''}`}
              onClick={() => setActiveTab(0)}
            >
              Overview
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 1 ? styles.active : ''}`}
              onClick={() => setActiveTab(1)}
            >
              Detailed Analysis
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 2 ? styles.active : ''}`}
              onClick={() => setActiveTab(2)}
            >
              Top Performers
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 3 ? styles.active : ''}`}
              onClick={() => setActiveTab(3)}
            >
              Time Series
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 0 && (
            <div>
              {/* Filters */}
              <div className={styles.filterCard}>
                <div className={styles.filterHeader}>
                  <FilterIcon />
                  <h2>Filters</h2>
                </div>
                
                <div className={styles.filterGrid}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Period</label>
                    <select
                      className={styles.filterSelect}
                      value={filters.period}
                      onChange={(e) => handleFilterChange('period', e.target.value)}
                    >
                      {periodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {filters.period === 'custom' && (
                    <>
                      <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Start Date</label>
                        <DatePicker
                          value={filters.startDate}
                          onChange={(date) => handleFilterChange('startDate', date)}
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              fullWidth 
                              size="small" 
                              className={styles.filterInput}
                            />
                          )}
                        />
                      </div>
                      <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>End Date</label>
                        <DatePicker
                          value={filters.endDate}
                          onChange={(date) => handleFilterChange('endDate', date)}
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              fullWidth 
                              size="small" 
                              className={styles.filterInput}
                            />
                          )}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Customer</label>
                    <select
                      className={styles.filterSelect}
                      value={filters.customer_no}
                      onChange={(e) => handleFilterChange('customer_no', e.target.value)}
                    >
                      <option value="">All Customers</option>
                      {customers.map((customer) => (
                        <option key={customer.customer_no} value={customer.customer_no}>
                          {customer.name || customer.customer_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Store</label>
                    <select
                      className={styles.filterSelect}
                      value={filters.store_no}
                      onChange={(e) => handleFilterChange('store_no', e.target.value)}
                    >
                      <option value="">All Stores</option>
                      {stores.map((store) => (
                        <option key={store.store_no} value={store.store_no}>
                          {store.store_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Status</label>
                    <select
                      className={styles.filterSelect}
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Payment Status</label>
                    <select
                      className={styles.filterSelect}
                      value={filters.payment_status}
                      onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                    >
                      {paymentStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Min Amount</label>
                    <input
                      type="number"
                      className={styles.filterInput}
                      value={filters.min_amount}
                      onChange={(e) => handleFilterChange('min_amount', e.target.value)}
                    />
                  </div>
                  
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Max Amount</label>
                    <input
                      type="number"
                      className={styles.filterInput}
                      value={filters.max_amount}
                      onChange={(e) => handleFilterChange('max_amount', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className={styles.buttonContainer}>
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
                </div>
                
                <div className={styles.buttonContainer}>
                  <button
                    className={styles.primaryButton}
                    onClick={generateReport}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={16} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <SearchIcon size={16} />
                        Generate Report
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              {reportData && (
                <div className={styles.summaryGrid}>
                  {summaryCards.map((card, index) => (
                    <div className={styles.summaryCard} key={index}>
                      <div className={styles.summaryHeader}>
                        <div>
                          <div className={styles.summaryTitle}>{card.title}</div>
                          <div className={styles.summaryValue}>{card.value}</div>
                        </div>
                        <div className={styles.iconContainer}>
                          {card.icon}
                        </div>
                      </div>
                      {card.change !== null && (
                        <div className={styles.summaryCompare}>
                          {card.change >= 0 ? (
                            <TrendingUpIcon color="success" fontSize="small" />
                          ) : (
                            <TrendingDownIcon color="error" fontSize="small" />
                          )}
                          <span className={card.change >= 0 ? styles.increaseText : styles.decreaseText}>
                            {Math.abs(card.change)}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Charts */}
              {reportData?.timeSeriesData && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                      Revenue Trend
                    </div>
                    <div className={styles.chartContainer}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={reportData.timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <RechartsTooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                          <Area type="monotone" dataKey="total_revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                      Payment Status
                    </div>
                    <div className={styles.chartContainer}>
                      <ResponsiveContainer width="100%" height="100%">
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 1: Detailed Analysis */}
          {activeTab === 1 && (
            <div>
              {/* Sales Data Table */}
              {reportData?.sales && (
                <div className={styles.tableCard}>
                  <div className={styles.tableHeader}>
                    📋 Sales Transactions
                  </div>
                  
                  <div className={styles.tableContainer}>
                    <table>
                      <thead>
                        <tr>
                          <th className={styles.tableHeadCell}>Sale No</th>
                          <th className={styles.tableHeadCell}>Date</th>
                          <th className={styles.tableHeadCell}>Customer</th>
                          <th className={styles.tableHeadCell}>Store</th>
                          <th className={styles.tableHeadCell}>Amount</th>
                          <th className={styles.tableHeadCell}>Paid</th>
                          <th className={styles.tableHeadCell}>Balance</th>
                          <th className={styles.tableHeadCell}>Status</th>
                          <th className={styles.tableHeadCell}>Payment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.sales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((sale, index) => (
                          <tr className={styles.tableRow} key={sale._id || index}>
                            <td className={styles.tableCell}>{sale.sel_no}</td>
                            <td className={styles.tableCell}>
                              {sale.sel_date ? new Date(sale.sel_date).toLocaleDateString() : '-'}
                            </td>
                            <td className={styles.tableCell}>{sale.customer_name || '-'}</td>
                            <td className={styles.tableCell}>{sale.store_name || '-'}</td>
                            <td className={styles.tableCell}>${Number(sale.amount || 0).toLocaleString()}</td>
                            <td className={styles.tableCell}>${Number(sale.paid || 0).toLocaleString()}</td>
                            <td className={styles.tableCell}>${Number(sale.balance_due || 0).toLocaleString()}</td>
                            <td className={styles.tableCell}>
                              <Chip 
                                label={sale.status || 'confirmed'} 
                                size="small" 
                                color={sale.status === 'delivered' ? 'success' : 'default'}
                              />
                            </td>
                            <td className={styles.tableCell}>
                              <Chip 
                                label={sale.payment_status || 'unknown'} 
                                size="small" 
                                color={
                                  sale.payment_status === 'paid' ? 'success' : 
                                  sale.payment_status === 'partial' ? 'warning' : 'error'
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  </div>
                </div>
              )}
              
              {/* Comparison Metrics */}
              {reportData?.comparisons && (
                <div className={styles.tableCard}>
                  <div className={styles.tableHeader}>
                    📊 Period Comparison
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <Typography variant="subtitle1" style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Current Period</Typography>
                      <Typography variant="body2">Revenue: ${Number(reportData.comparisons.current.total_revenue || 0).toLocaleString()}</Typography>
                      <Typography variant="body2">Sales Count: {reportData.comparisons.current.total_sales || 0}</Typography>
                      <Typography variant="body2">Avg Order: ${reportData.comparisons.current.average_order_value || 0}</Typography>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <Typography variant="subtitle1" style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Previous Period</Typography>
                      <Typography variant="body2">Revenue: ${Number(reportData.comparisons.previous.total_revenue || 0).toLocaleString()}</Typography>
                      <Typography variant="body2">Sales Count: {reportData.comparisons.previous.total_sales || 0}</Typography>
                      <Typography variant="body2">Avg Order: ${reportData.comparisons.previous.average_order_value || 0}</Typography>
                    </div>
                  </div>
                  
                  <div>
                    <Typography variant="subtitle1" style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Growth Metrics</Typography>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                      {Object.entries(reportData.comparisons.growth || {}).map(([key, value]) => (
                        <div key={key} style={{ textAlign: 'center', padding: '0.5rem' }}>
                          <Typography variant="h6" style={{ color: value >= 0 ? 'var(--success)' : 'var(--error)' }}>
                            {value >= 0 ? '+' : ''}{value}%
                          </Typography>
                          <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Top Performers */}
          {activeTab === 2 && (
            <div>
              {reportData?.topPerformers && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  {/* Top Customers */}
                  <div className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                      👥 Top Customers
                    </div>
                    {reportData.topPerformers.top_customers?.length > 0 ? (
                      <div>
                        {reportData.topPerformers.top_customers.map((customer, index) => (
                          <div 
                            key={index} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '0.75rem 0',
                              borderBottom: index < reportData.topPerformers.top_customers.length - 1 ? '1px solid var(--border)' : 'none'
                            }}
                          >
                            <div>
                              <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                                {customer.customer_name || `Customer ${customer.customer_no}`}
                              </Typography>
                              <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>
                                {customer.total_orders} orders
                              </Typography>
                            </div>
                            <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                              ${Number(customer.total_revenue || 0).toLocaleString()}
                            </Typography>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Typography variant="body2" style={{ color: 'var(--text-secondary)', padding: '1rem' }}>
                        No customer data available
                      </Typography>
                    )}
                  </div>
                  
                  {/* Top Products */}
                  <div className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                      📦 Top Products
                    </div>
                    {reportData.topPerformers.top_products?.length > 0 ? (
                      <div>
                        {reportData.topPerformers.top_products.map((product, index) => (
                          <div 
                            key={index} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '0.75rem 0',
                              borderBottom: index < reportData.topPerformers.top_products.length - 1 ? '1px solid var(--border)' : 'none'
                            }}
                          >
                            <div>
                              <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                                {product.product_name || `Product ${product.product_no}`}
                              </Typography>
                              <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>
                                {product.total_qty} sold
                              </Typography>
                            </div>
                            <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                              ${Number(product.total_revenue || 0).toLocaleString()}
                            </Typography>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Typography variant="body2" style={{ color: 'var(--text-secondary)', padding: '1rem' }}>
                        No product data available
                      </Typography>
                    )}
                  </div>
                  
                  {/* Top Stores */}
                  <div className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                      🏪 Top Stores
                    </div>
                    {reportData.topPerformers.top_stores?.length > 0 ? (
                      <div>
                        {reportData.topPerformers.top_stores.map((store, index) => (
                          <div 
                            key={index} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '0.75rem 0',
                              borderBottom: index < reportData.topPerformers.top_stores.length - 1 ? '1px solid var(--border)' : 'none'
                            }}
                          >
                            <div>
                              <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                                {store.store_name || `Store ${store.store_no}`}
                              </Typography>
                              <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>
                                {store.total_orders} orders
                              </Typography>
                            </div>
                            <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                              ${Number(store.total_revenue || 0).toLocaleString()}
                            </Typography>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Typography variant="body2" style={{ color: 'var(--text-secondary)', padding: '1rem' }}>
                        No store data available
                      </Typography>
                    )}
                  </div>
                  
                  {/* Performance Charts */}
                  <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.chartHeader}>Top Products Performance</div>
                    <div className={styles.chartContainer}>
                      {reportData.topPerformers.top_products?.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Time Series */}
          {activeTab === 3 && (
            <div>
              {/* Time Series Controls */}
              <div className={styles.filterCard}>
                <div className={styles.filterHeader}>
                  <h2>Time Series Settings</h2>
                </div>
                <div className={styles.filterGrid}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Group By</label>
                    <select
                      className={styles.filterSelect}
                      value={filters.groupBy}
                      onChange={(e) => handleFilterChange('groupBy', e.target.value)}
                    >
                      <option value="day">Daily</option>
                      <option value="week">Weekly</option>
                      <option value="month">Monthly</option>
                      <option value="quarter">Quarterly</option>
                      <option value="year">Yearly</option>
                    </select>
                  </div>
                  <div className={styles.buttonContainer}>
                    <button
                      className={styles.primaryButton}
                      onClick={generateReport}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={16} />
                          Updating...
                        </>
                      ) : (
                        <>
                          <RefreshIcon size={16} />
                          Update Chart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Revenue Trend */}
              {reportData?.timeSeriesData && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>Revenue Over Time</div>
                    <div className={styles.chartContainer}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportData.timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <RechartsTooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                          <Legend />
                          <Line type="monotone" dataKey="total_revenue" stroke="#8884d8" strokeWidth={2} name="Revenue" />
                          <Line type="monotone" dataKey="total_sales" stroke="#82ca9d" strokeWidth={2} name="Sales Count" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className={styles.chartCard}>
                      <div className={styles.chartHeader}>Sales Volume Trend</div>
                      <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={reportData.timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <RechartsTooltip />
                            <Area type="monotone" dataKey="total_sales" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className={styles.chartCard}>
                      <div className={styles.chartHeader}>Average Order Value</div>
                      <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={reportData.timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <RechartsTooltip formatter={(value) => [`$${value}`, 'AOV']} />
                            <Line type="monotone" dataKey="average_order_value" stroke="#ffc658" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  {/* Time Series Summary Table */}
                  <div className={styles.tableCard}>
                    <div className={styles.tableHeader}>Time Series Data</div>
                    <div className={styles.tableContainer}>
                      <table>
                        <thead>
                          <tr>
                            <th className={styles.tableHeadCell}>Period</th>
                            <th className={styles.tableHeadCell} align="right">Revenue</th>
                            <th className={styles.tableHeadCell} align="right">Sales Count</th>
                            <th className={styles.tableHeadCell} align="right">Avg Order Value</th>
                            <th className={styles.tableHeadCell} align="right">Growth</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.timeSeriesData?.map((item, index) => {
                            const prevItem = reportData.timeSeriesData[index - 1];
                            const growth = prevItem ? (((item.total_revenue - prevItem.total_revenue) / prevItem.total_revenue) * 100).toFixed(1) : '-';
                            
                            return (
                              <tr className={styles.tableRow} key={index}>
                                <td className={styles.tableCell}>{item.period}</td>
                                <td className={styles.tableCell} align="right">${Number(item.total_revenue || 0).toLocaleString()}</td>
                                <td className={styles.tableCell} align="right">{item.total_sales || 0}</td>
                                <td className={styles.tableCell} align="right">${Number(item.average_order_value || 0).toFixed(2)}</td>
                                <td className={styles.tableCell} align="right">
                                  {growth !== '-' && (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                      {parseFloat(growth) >= 0 ? (
                                        <TrendingUpIcon color="success" fontSize="small" style={{ marginRight: '0.25rem' }} />
                                      ) : (
                                        <TrendingDownIcon color="error" fontSize="small" style={{ marginRight: '0.25rem' }} />
                                      )}
                                      <span style={{ color: parseFloat(growth) >= 0 ? 'var(--success)' : 'var(--error)' }}>
                                        {growth}%
                                      </span>
                                    </div>
                                  )}
                                  {growth === '-' && '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {loading && (
            <div className={styles.loadingContainer}>
              <CircularProgress />
            </div>
          )}
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default SalesReports;