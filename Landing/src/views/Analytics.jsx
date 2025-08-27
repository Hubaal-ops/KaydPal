
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { ColorModeContext } from '../App';
import {
  Box, Card, CardContent, Grid, Typography, TextField, InputAdornment, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Menu, MenuItem, Divider, Skeleton, IconButton, Tooltip,
  FormControl, InputLabel, Select, Chip, Stack, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { 
  Search, Download, Calendar, Filter, RefreshCw, ChevronDown, 
  ChevronUp, BarChart2, PieChart, TrendingUp, Package, Clock, 
  AlertTriangle, CheckCircle, Grid as GridIcon, List as ListIcon,
  FileText, Users, DollarSign, ShoppingBag, AlertCircle, MoreVertical
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Legend, 
  ResponsiveContainer, Pie, Cell, AreaChart, Area
} from 'recharts';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subMonths, startOfMonth, endOfMonth, subDays, isWithinInterval, parseISO, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';
import styles from './Analytics.module.css';
import { fetchAnalytics, fetchAnalyticsSummary, exportAnalytics } from '../services/analyticsService';
import { getCategories } from '../services/categoryService';
import { getStores } from '../services/storeService';

// Error Boundary Component
class AnalyticsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Analytics Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Analytics Dashboard Error
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            There was an issue loading the analytics dashboard.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: '1rem' }}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom Tooltip component to avoid Redux dependency
const CustomTooltip = ({ active, payload, label, formatter, labelFormatter }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'var(--surface)',
        padding: '12px',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
          {labelFormatter ? labelFormatter(label) : label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ 
            margin: '4px 0 0 0', 
            color: entry.color,
            fontSize: '14px'
          }}>
            {formatter ? formatter(entry.value, entry.name)[0] : `${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Chart color palette
const CHART_COLORS = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#8B5CF6'
];

// Status colors for badges
const STATUS_COLORS = {
  low: '#EF4444',
  medium: '#F59E0B',
  high: '#10B981',
  critical: '#DC2626',
  warning: '#F59E0B',
  good: '#10B981'
};

// Real data state
const defaultColors = ['#4CAF50', '#FFB300', '#F44336', '#6366f1', '#FF9800'];

// Empty state component
const EmptyState = ({ icon: Icon, message, action, height = 200 }) => (
  <Box 
    display="flex" 
    flexDirection="column" 
    alignItems="center" 
    justifyContent="center" 
    p={4}
    height={height}
    textAlign="center"
    className={styles.emptyState}
  >
    {Icon && <Icon size={48} className={styles.emptyIcon} style={{ opacity: 0.5 }} />}
    <Typography variant="body1" color="textSecondary" className={styles.emptyText}>
      {message}
    </Typography>
    {action && <Box mt={2}>{action}</Box>}
  </Box>
);

// Loading skeleton for charts
const ChartSkeleton = ({ height = 200 }) => (
  <div className={styles.chartSkeleton} style={{ height }}>
    <Skeleton variant="rectangular" height="100%" animation="wave" />
  </div>
);

// Status badge component
const StatusBadge = ({ status, label }) => (
  <Chip 
    label={label || status} 
    size="small" 
    style={{ 
      backgroundColor: `${STATUS_COLORS[status.toLowerCase()] || '#E5E7EB'}33`,
      color: STATUS_COLORS[status.toLowerCase()] || '#6B7280',
      fontWeight: 600,
      textTransform: 'capitalize'
    }} 
  />
);

// Summary card component
const SummaryCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'primary',
  trend, 
  subtitle,
  loading = false,
  onClick
}) => {
  const trendValue = typeof trend === 'number' ? trend : 0;
  const isPositive = trendValue >= 0;
  
  // Create a style object for the card
  const cardStyle = {
    cursor: onClick ? 'pointer' : 'default',
    '--accent-color': isPositive ? '#10B981' : '#EF4444',
    '--accent-light': isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
  };

  return (
    <Card 
      className={styles.statCard}
      onClick={onClick}
      style={cardStyle}
    >
      <CardContent style={{ 
        padding: 0, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        flex: '1 0 auto',
        minHeight: 0,
        gap: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          gap: '8px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '8px',
            flexShrink: 0
          }}>
            <div>
              <Typography 
                variant="body2" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}
              >
                {Icon && <Icon size={16} style={{ opacity: 0.8 }} />}
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" style={{ color: 'var(--text-tertiary)' }}>
                  {subtitle}
                </Typography>
              )}
            </div>
            {!loading && trend !== undefined && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent-color)'
              }}>
                {isPositive ? '↑' : '↓'} {Math.abs(trendValue)}%
              </span>
            )}
          </div>
          
          {loading ? (
            <Skeleton 
              variant="text" 
              width="80%" 
              height={36} 
              style={{ 
                marginTop: 8,
                transform: 'none',
                borderRadius: 4
              }} 
            />
          ) : (
            <div style={{ 
              minHeight: '3.5rem',
              display: 'flex',
              alignItems: 'center',
              margin: '4px 0',
              lineHeight: 1
            }}>
              <Typography 
                variant="h3" 
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  margin: '8px 0 0',
                  lineHeight: 1.2,
                  letterSpacing: '-0.5px',
                  color: 'var(--text-primary)',
                  wordBreak: 'break-word',
                  width: '100%'
                }}
              >
                {value}
              </Typography>
            </div>
          )}
        </div>
        
        {!loading && trend !== undefined && (
          <div style={{ 
            marginTop: 'auto', 
            paddingTop: '12px',
            flexShrink: 0,
            borderTop: '1px solid var(--border-color)'
          }}>
            <div style={{ 
              height: 4,
              background: 'var(--border-color)',
              borderRadius: 2,
              overflow: 'hidden',
              marginBottom: 4
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg, var(--accent-color), ${isPositive ? '#3B82F6' : '#F59E0B'})`,
                transform: `scaleX(${Math.min(Math.abs(trendValue) / 100, 1)})`,
                transformOrigin: 'left',
                transition: 'transform 0.6s ease-out',
                opacity: 0.9
              }} />
            </div>
            <Typography 
              variant="caption" 
              style={{ 
                color: 'var(--text-tertiary)',
                fontSize: '0.7rem',
                display: 'block',
                textAlign: 'right'
              }}
            >
              {isPositive ? '↑ Increased' : '↓ Decreased'} from last period
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Chart wrapper with loading and empty states
const ChartContainer = ({ 
  title, 
  subtitle, 
  loading = false, 
  isEmpty = false, 
  emptyMessage = 'No data available',
  height = 300,
  children,
  action,
  icon: Icon
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <Typography variant="body1" className={styles.chartTitle}>
            {Icon && <Icon size={18} style={{ marginRight: 8 }} />}
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" className={styles.chartSubtitle}>
              {subtitle}
            </Typography>
          )}
        </div>
        <div>
          <IconButton 
            size="small" 
            onClick={handleClick}
            aria-controls={open ? 'chart-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <MoreVertical size={18} />
          </IconButton>
          <Menu
            id="chart-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'chart-menu-button',
            }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleClose}>
              <RefreshCw size={16} style={{ marginRight: 8 }} />
              Refresh
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Download size={16} style={{ marginRight: 8 }} />
              Export
            </MenuItem>
            {action && (
              <MenuItem onClick={() => {
                action();
                handleClose();
              }}>
                <BarChart2 size={16} style={{ marginRight: 8 }} />
                View Details
              </MenuItem>
            )}
          </Menu>
        </div>
      </div>
      
      <div className={styles.chartContainer} style={{ height }}>
        {loading ? (
          <ChartSkeleton height={height} />
        ) : isEmpty ? (
          <EmptyState 
            icon={BarChart2} 
            message={emptyMessage}
            height={height - 80}
          />
        ) : (
          children
        )}
      </div>
    </Card>
  );
};

const Analytics = () => {
  const colorMode = useContext(ColorModeContext);
  const isDarkMode = document.body.classList.contains('dark');
  
  // State for filters
  const [dateRange, setDateRange] = useState({
    start: subMonths(new Date(), 1),
    end: new Date()
  });
  const [category, setCategory] = useState('');
  const [store, setStore] = useState('');
  const [dateRangeAnchorEl, setDateRangeAnchorEl] = useState(null);
  
  // Data states
  const [nlQuery, setNlQuery] = useState('');
  const [nlResult, setNlResult] = useState(null);
  const [loading, setLoading] = useState({
    sales: true,
    inventory: true,
    debt: true,
    summary: true
  });
  
  // Data states
  const [salesTrendData, setSalesTrendData] = useState([]);
  const [stockLevels, setStockLevels] = useState([]);
  const [fastSlowTable, setFastSlowTable] = useState([]);
  const [debtTracking, setDebtTracking] = useState([]);
  const [aiPrediction, setAiPrediction] = useState({ product: '', days: 0 });
  const [restockRec, setRestockRec] = useState({ product: '', qty: 0 });
  
  // Real data for dropdowns
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  
  // Summary metrics
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    topSellingProduct: { name: '', quantity: 0 },
    lowStockItems: 0,
    outOfStockItems: 0,
    totalCustomers: 0,
    newCustomers: 0,
    totalRevenue: 0,
    revenueChange: 0
  });
  
  // UI state
  const [viewMode, setViewMode] = useState('grid');
  const [expandedCard, setExpandedCard] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Refs
  const debouncedFetchData = useCallback(
    debounce((params) => {
      fetchData(params);
    }, 1000),
    []
  );
  
  // Fetch stores and categories
  const fetchStoresAndCategories = async () => {
    setLoadingFilters(true);
    try {
      const [storesRes, categoriesRes] = await Promise.all([
        getStores(),
        getCategories()
      ]);
      
      console.log('📦 Stores response:', storesRes);
      console.log('🏷️ Categories response:', categoriesRes);
      
      // Handle store data
      if (storesRes?.data) {
        setStores(storesRes.data);
      } else if (Array.isArray(storesRes)) {
        setStores(storesRes);
      }
      
      // Handle category data
      if (categoriesRes?.data) {
        setCategories(categoriesRes.data);
      } else if (Array.isArray(categoriesRes)) {
        setCategories(categoriesRes);
      }
      
    } catch (error) {
      console.error('Error fetching stores and categories:', error);
      toast.error('Failed to load filter options');
    } finally {
      setLoadingFilters(false);
    }
  };
  
  // Handle date range change with immediate effect
  const handleDateRangeChange = (newValue, type) => {
    const newDateRange = {
      ...dateRange,
      [type]: newValue
    };
    setDateRange(newDateRange);
    
    // Only fetch if both dates are set and valid
    if (newDateRange.start && newDateRange.end && newDateRange.start <= newDateRange.end) {
      console.log('📅 Date range changed, fetching data immediately:', newDateRange);
      const params = {
        startDate: format(newDateRange.start, 'yyyy-MM-dd'),
        endDate: format(newDateRange.end, 'yyyy-MM-dd'),
        ...(category && { category }),
        ...(store && { store })
      };
      // Fetch immediately for date changes, no debouncing needed
      fetchData(params);
    }
  };
  
  // Handle quick date range selection
  const handleQuickRange = (range) => {
    const today = new Date();
    let newDateRange = { ...dateRange };
    
    switch (range) {
      case 'today':
        newDateRange = {
          start: today,
          end: today
        };
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        newDateRange = {
          start: yesterday,
          end: yesterday
        };
        break;
      case 'thisWeek':
        newDateRange = {
          start: startOfWeek(today, { weekStartsOn: 1 }),
          end: today
        };
        break;
      case 'lastWeek':
        const lastWeek = subWeeks(today, 1);
        newDateRange = {
          start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          end: endOfWeek(lastWeek, { weekStartsOn: 1 })
        };
        break;
      case 'thisMonth':
        newDateRange = {
          start: startOfMonth(today),
          end: today
        };
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        newDateRange = {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        };
        break;
      case 'thisYear':
        newDateRange = {
          start: new Date(today.getFullYear(), 0, 1),
          end: today
        };
        break;
      default:
        break;
    }
    
    setDateRange(newDateRange);
    setDateRangeAnchorEl(null);
    
    console.log('📅 Quick range selected:', range, newDateRange);
    
    // Fetch data with new date range immediately
    const params = {
      startDate: format(newDateRange.start, 'yyyy-MM-dd'),
      endDate: format(newDateRange.end, 'yyyy-MM-dd'),
      ...(category && { category }),
      ...(store && { store })
    };
    fetchData(params);
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Format number with commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat().format(value);
  };
  
  // Handle export data
  const handleExport = async (type) => {
    try {
      await exportAnalytics({
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
        category,
        store,
        type
      });
      toast.success('Export started successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to start export');
    }
  };
  
  // Toggle card expansion
  const toggleCardExpansion = (cardId) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };
  
  // Fetch analytics data with debouncing
  const fetchData = async (params = {}) => {
    console.log('🔄 Fetching analytics data with params:', params);
    console.log('📅 Current date range:', {
      start: format(dateRange.start, 'yyyy-MM-dd'),
      end: format(dateRange.end, 'yyyy-MM-dd')
    });
    
    try {
      // Set all loading states to true
      setLoading(prev => ({
        ...prev,
        sales: true,
        inventory: true,
        debt: true,
        summary: true
      }));
      
      // Fetch analytics data in parallel
      const [analyticsRes, summaryRes] = await Promise.all([
        fetchAnalytics(params),
        fetchAnalyticsSummary(params)
      ]);
      
      console.log('📊 Analytics response:', analyticsRes);
      console.log('📈 Summary response:', summaryRes);
      
      // Update states with new data from analytics response
      if (analyticsRes && (analyticsRes.data || analyticsRes.salesTrends)) {
        const data = analyticsRes.data || analyticsRes;
        
        // Sales trends data
        setSalesTrendData(data.salesTrends || []);
        
        // Process stock levels - fix field mapping
        const processedStockLevels = (data.stockLevels || []).map((item) => {
          let status = 'good';
          let color = CHART_COLORS[1]; // Default green
          
          const qty = item.qty || item.quantity || 0;
          
          if (qty <= 0) {
            status = 'critical';
            color = CHART_COLORS[3]; // Red
          } else if (qty <= 10) {
            status = 'warning';
            color = CHART_COLORS[2]; // Orange
          }
          
          return { 
            ...item, 
            status,
            color,
            value: qty,
            quantity: qty,
            name: item.name || item.productName || `Product ${item.productId || item._id}`,
            productName: item.name || item.productName
          };
        });
        
        setStockLevels(processedStockLevels);
        
        // Fast/slow moving products - fix field mapping
        const fastSlowData = (data.fastSlowProducts || data.fastSlowTable || []).map((item) => ({
          ...item,
          name: item.name || item.productName || `Product ${item.productId}`,
          quantity: item.quantity || item.soldQty || 0,
          revenue: item.revenue || (item.price * (item.quantity || 0)) || 0
        }));
        setFastSlowTable(fastSlowData);
        
        // Debt tracking data - fix field mapping
        const debtData = (data.debtTracking || []).map((item) => ({
          ...item,
          customerName: item.name || item.customerName || `Customer ${item.customerId}`,
          amount: item.amount || 0,
          daysOverdue: item.days || item.daysOverdue || 0
        }));
        setDebtTracking(debtData);
        
        // AI predictions - handle string or object format
        const aiPred = data.aiPrediction || '';
        if (typeof aiPred === 'string') {
          setAiPrediction({ product: aiPred, days: 0 });
        } else {
          setAiPrediction(aiPred);
        }
        
        // Restock recommendations - handle string or object format
        const restockRec = data.restockRecommendation || '';
        if (typeof restockRec === 'string') {
          setRestockRec({ product: restockRec, qty: 0 });
        } else {
          setRestockRec(restockRec);
        }
      }
      
      // Update summary data from summary response
      if (summaryRes && (summaryRes.data || summaryRes.totalSales !== undefined)) {
        const summaryData = summaryRes.data || summaryRes;
        
        setSummary({
          totalSales: summaryData.totalSales || 0,
          totalOrders: summaryData.totalOrders || summaryData.orderCount || 0,
          avgOrderValue: summaryData.avgOrderValue || 
            (summaryData.totalSales && summaryData.totalOrders ? 
              summaryData.totalSales / summaryData.totalOrders : 0),
          topSellingProduct: summaryData.topSellingProduct || 
            (summaryData.topProducts && summaryData.topProducts[0] ? 
              { name: summaryData.topProducts[0].name, quantity: summaryData.topProducts[0].quantity } : 
              { name: '', quantity: 0 }),
          lowStockItems: summaryData.lowStockItems || 0,
          outOfStockItems: summaryData.outOfStockItems || 0,
          totalCustomers: summaryData.totalCustomers || 0,
          newCustomers: summaryData.newCustomers || 0,
          totalRevenue: summaryData.totalRevenue || summaryData.totalSales || 0,
          revenueChange: summaryData.revenueChange || 0
        });
      }
      
    } catch (err) {
      console.error('Error fetching analytics:', err);
      
      // More specific error handling
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        if (status === 401) {
          toast.error('Authentication required. Please log in again.');
        } else if (status === 403) {
          toast.error('Access denied. You do not have permission to view analytics.');
        } else if (status === 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(`Failed to load analytics data (${status})`);
        }
      } else if (err.request) {
        // Network error
        toast.error('Network error. Please check your connection.');
      } else {
        // Other error
        toast.error('Failed to load analytics data');
      }
      
      // Set default empty states on error
      setSalesTrendData([]);
      setStockLevels([]);
      setFastSlowTable([]);
      setDebtTracking([]);
      setAiPrediction({ product: '', days: 0 });
      setRestockRec({ product: '', qty: 0 });
      setSummary({
        totalSales: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        topSellingProduct: { name: '', quantity: 0 },
        lowStockItems: 0,
        outOfStockItems: 0,
        totalCustomers: 0,
        newCustomers: 0,
        totalRevenue: 0,
        revenueChange: 0
      });
      
    } finally {
      // Reset loading states
      setLoading(prev => ({
        ...prev,
        sales: false,
        inventory: false,
        debt: false,
        summary: false
      }));
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    // Fetch stores and categories first
    fetchStoresAndCategories();
    
    // Then fetch analytics data
    fetchData({
      startDate: format(dateRange.start, 'yyyy-MM-dd'),
      endDate: format(dateRange.end, 'yyyy-MM-dd'),
      category,
      store
    });
    
    // Cleanup debounce on unmount
    return () => {
      debouncedFetchData.cancel();
    };
  }, []);
  
  // Debounced handlers for filter changes
  const debouncedCategoryChange = useCallback(
    debounce((newCategory) => {
      const params = {
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
        ...(newCategory && { category: newCategory }),
        ...(store && { store })
      };
      fetchData(params);
    }, 1000),
    [dateRange, store]
  );
  
  const debouncedStoreChange = useCallback(
    debounce((newStore) => {
      const params = {
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
        ...(category && { category }),
        ...(newStore && { store: newStore })
      };
      fetchData(params);
    }, 1000),
    [dateRange, category]
  );
  
  // Handle category change
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    debouncedCategoryChange(newCategory);
  };
  
  // Handle store change
  const handleStoreChange = (newStore) => {
    setStore(newStore);
    debouncedStoreChange(newStore);
  };
  
  // Refresh data
  const handleRefresh = () => {
    fetchData({
      startDate: format(dateRange.start, 'yyyy-MM-dd'),
      endDate: format(dateRange.end, 'yyyy-MM-dd'),
      category,
      store
    });
  };

  // Render the component
  return (
    <div className={styles.analyticsContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <div>
          <Typography variant="h4" className={styles.title}>
            Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
          </Typography>
        </div>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={handleRefresh}
            disabled={Object.values(loading).some(Boolean)}
          >
            Refresh
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<BarChart2 size={16} />}
            onClick={() => {
              const params = {
                startDate: format(dateRange.start, 'yyyy-MM-dd'),
                endDate: format(dateRange.end, 'yyyy-MM-dd'),
                ...(category && { category }),
                ...(store && { store })
              };
              fetchData(params);
            }}
            disabled={Object.values(loading).some(Boolean)}
          >
            Load Data
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<Download size={16} />}
            onClick={() => handleExport('full')}
            disabled={loading.summary}
          >
            Export
          </Button>
        </Stack>
      </div>
      
      {/* Filters Section */}
      <div className={styles.filters}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={dateRange.start}
            onChange={(newValue) => handleDateRangeChange(newValue, 'start')}
            slotProps={{
              textField: {
                size: "small",
                className: styles.dateRangePicker,
                sx: { width: 180 }
              }
            }}
          />
          
          <DatePicker
            label="End Date"
            value={dateRange.end}
            onChange={(newValue) => handleDateRangeChange(newValue, 'end')}
            slotProps={{
              textField: {
                size: "small",
                className: styles.dateRangePicker,
                sx: { width: 180 }
              }
            }}
            minDate={dateRange.start}
          />
        </LocalizationProvider>
        
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={loadingFilters}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.category_id || cat._id} value={cat.category_name}>
                {cat.category_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Store</InputLabel>
          <Select
            value={store}
            label="Store"
            onChange={(e) => handleStoreChange(e.target.value)}
            disabled={loadingFilters}
          >
            <MenuItem value="">All Stores</MenuItem>
            {stores.map((storeItem) => (
              <MenuItem key={storeItem.store_id || storeItem._id} value={storeItem.store_no || storeItem.store_id}>
                {storeItem.store_name || storeItem.name || `Store ${storeItem.store_no || storeItem.store_id}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="outlined"
          onClick={() => setDateRangeAnchorEl(document.currentTarget)}
          startIcon={<Calendar size={16} />}
          endIcon={<ChevronDown size={16} />}
        >
          Quick Range
        </Button>
        
        <Menu
          anchorEl={dateRangeAnchorEl}
          open={Boolean(dateRangeAnchorEl)}
          onClose={() => setDateRangeAnchorEl(null)}
        >
          <MenuItem onClick={() => handleQuickRange('today')}>Today</MenuItem>
          <MenuItem onClick={() => handleQuickRange('yesterday')}>Yesterday</MenuItem>
          <MenuItem onClick={() => handleQuickRange('thisWeek')}>This Week</MenuItem>
          <MenuItem onClick={() => handleQuickRange('lastWeek')}>Last Week</MenuItem>
          <MenuItem onClick={() => handleQuickRange('thisMonth')}>This Month</MenuItem>
          <MenuItem onClick={() => handleQuickRange('lastMonth')}>Last Month</MenuItem>
          <MenuItem onClick={() => handleQuickRange('thisYear')}>This Year</MenuItem>
        </Menu>
      </div>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Revenue"
            value={formatCurrency(summary.totalRevenue)}
            icon={DollarSign}
            color="primary"
            trend={summary.revenueChange}
            subtitle="vs previous period"
            loading={loading.summary}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Orders"
            value={formatNumber(summary.totalOrders)}
            icon={ShoppingBag}
            color="secondary"
            loading={loading.summary}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Customers"
            value={formatNumber(summary.totalCustomers)}
            icon={Users}
            color="success"
            subtitle={`${summary.newCustomers} new`}
            loading={loading.summary}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Avg. Order Value"
            value={formatCurrency(summary.avgOrderValue)}
            icon={FileText}
            color="info"
            loading={loading.summary}
          />
        </Grid>
      </Grid>
      
      {/* Main Content Area */}
      <Grid container spacing={3}>
        {/* Sales Trends Chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <ChartContainer
            title="Sales Trends"
            subtitle={`${format(dateRange.start, 'MMM d, yyyy')} - ${format(dateRange.end, 'MMM d, yyyy')}`}
            loading={loading.sales}
            isEmpty={salesTrendData.length === 0}
            emptyMessage="No sales data available for the selected period"
            height={350}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => {
                    try {
                      return format(new Date(value), 'MMM d');
                    } catch {
                      return value;
                    }
                  }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <CustomTooltip 
                  formatter={(value) => [`$${value}`, 'Sales']}
                  labelFormatter={(label) => {
                    try {
                      return format(new Date(label), 'MMM d, yyyy');
                    } catch {
                      return label;
                    }
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#4F46E5" 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>
        
        {/* Stock Levels */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartContainer
            title="Stock Status"
            subtitle={`${stockLevels.length} products`}
            loading={loading.inventory}
            isEmpty={stockLevels.length === 0}
            emptyMessage="No inventory data available"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'In Stock', value: stockLevels.filter(item => item.quantity > 0).length, color: CHART_COLORS[1] },
                    { name: 'Low Stock', value: stockLevels.filter(item => item.quantity > 0 && item.quantity <= 10).length, color: CHART_COLORS[2] },
                    { name: 'Out of Stock', value: stockLevels.filter(item => item.quantity === 0).length, color: CHART_COLORS[3] },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: 'In Stock', value: stockLevels.filter(item => item.quantity > 0).length, color: CHART_COLORS[1] },
                    { name: 'Low Stock', value: stockLevels.filter(item => item.quantity > 0 && item.quantity <= 10).length, color: CHART_COLORS[2] },
                    { name: 'Out of Stock', value: stockLevels.filter(item => item.quantity === 0).length, color: CHART_COLORS[3] },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <CustomTooltip 
                  formatter={(value, name) => [value, name]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            <Box mt={2}>
              <Stack spacing={1}>
                {stockLevels
                  .filter(item => item.quantity <= 10)
                  .sort((a, b) => a.quantity - b.quantity)
                  .slice(0, 3)
                  .map((item, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>
                        {item.name}
                      </Typography>
                      <StatusBadge 
                        status={item.quantity === 0 ? 'Out of Stock' : 'Low Stock'} 
                      />
                    </Box>
                  ))}
                {stockLevels.filter(item => item.quantity <= 10).length === 0 && (
                  <Typography variant="body2" color="textSecondary" align="center">
                    All products are well-stocked
                  </Typography>
                )}
              </Stack>
            </Box>
          </ChartContainer>
        </Grid>
        
        {/* Top Products */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartContainer
            title="Top Selling Products"
            subtitle={`${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`}
            loading={loading.sales}
            isEmpty={fastSlowTable.length === 0}
            emptyMessage="No product sales data available"
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Sold</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fastSlowTable
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 5)
                    .map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Box 
                              width={8} 
                              height={8} 
                              borderRadius="50%" 
                              bgcolor={CHART_COLORS[index % CHART_COLORS.length]}
                              mr={1}
                            />
                            <Typography variant="body2" noWrap>
                              {row.name || `Product ${row.productId}`}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {row.quantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(row.revenue || 0)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ChartContainer>
        </Grid>
        
        {/* Debt Tracking */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartContainer
            title="Outstanding Payments"
            subtitle={`${debtTracking.length} customers with overdue payments`}
            loading={loading.debt}
            isEmpty={debtTracking.length === 0}
            emptyMessage="No outstanding payments"
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Days Overdue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {debtTracking
                    .sort((a, b) => b.daysOverdue - a.daysOverdue)
                    .slice(0, 5)
                    .map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2">
                            {row.customerName || `Customer ${row.customerId}`}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(row.amount || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <StatusBadge 
                            status={
                              row.daysOverdue > 30 ? 'critical' : 
                              row.daysOverdue > 15 ? 'warning' : 'good'
                            } 
                            label={`${row.daysOverdue} days`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ChartContainer>
        </Grid>
      </Grid>
      
      {/* AI Insights Section */}
      <Box mt={4}>
        <Grid container spacing={3}>
          {/* AI Prediction */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className={`${styles.aiCardBg} ${isDarkMode ? styles.aiCardBgDark : styles.aiCardBgLight}`}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Box 
                    bgcolor="primary.main" 
                    color="primary.contrastText" 
                    p={0.5} 
                    borderRadius={1}
                    mr={1}
                  >
                    <TrendingUp size={16} />
                  </Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    AI Sales Prediction
                  </Typography>
                </Box>
                
                {aiPrediction.product ? (
                  <Typography className={styles.aiCardText}>
                    Based on current trends, <strong>{aiPrediction.product}</strong> is predicted to 
                    sell out in <strong>{aiPrediction.days} days</strong>. Consider increasing stock 
                    to meet demand.
                  </Typography>
                ) : (
                  <Typography className={styles.aiCardText}>
                    No prediction data available. Check back later for AI-powered insights.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Restock Recommendation */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className={`${styles.aiCardBg} ${isDarkMode ? styles.aiCardBgDark : styles.aiCardBgLight}`}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Box 
                    bgcolor="warning.main" 
                    color="warning.contrastText" 
                    p={0.5} 
                    borderRadius={1}
                    mr={1}
                  >
                    <Package size={16} />
                  </Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Restock Recommendation
                  </Typography>
                </Box>
                
                {restockRec.product ? (
                  <Typography className={styles.aiCardText}>
                    It's recommended to restock <strong>{restockRec.product}</strong>. 
                    Current inventory is running low with only <strong>{restockRec.qty} units</strong> remaining.
                  </Typography>
                ) : (
                  <Typography className={styles.aiCardText}>
                    No restock recommendations at this time. All products are adequately stocked.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

// Wrapped Analytics component
const AnalyticsWrapper = () => {
  try {
    return <Analytics />;
  } catch (error) {
    console.error('Analytics Error:', error);
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Analytics Error
        </Typography>
        <Typography variant="body1">
          There was an issue: {error.message}
        </Typography>
      </div>
    );
  }
};

export default AnalyticsWrapper;
