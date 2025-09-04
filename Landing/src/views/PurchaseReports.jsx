import React, { useState, useEffect } from 'react';
import styles from './PurchaseReports.module.css';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  ButtonGroup,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as PurchaseIcon,
  Store as StoreIcon,
  Person as SupplierIcon,
  Inventory as ProductIcon,
  ArrowLeft
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { generateAdvancedPurchaseReport } from '../services/reportService';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const PurchaseReports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const navigate = useNavigate();

  // Handle back button click to return to reports
  const handleBackClick = () => {
    navigate('/reports');
  };

  // Filter states
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    supplier_no: '',
    store_no: '',
    product_no: '',
    status: '',
    payment_status: '',
    min_amount: '',
    max_amount: '',
    includeItems: true,
    includeComparisons: true,
    groupBy: 'day',
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 100
  });

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'received', label: 'Received' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const paymentStatusOptions = [
    { value: '', label: 'All Payment Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'partial', label: 'Partial' },
    { value: 'unpaid', label: 'Unpaid' }
  ];

  const groupByOptions = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' },
    { value: 'year', label: 'Yearly' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Purchase Date' },
    { value: 'amount', label: 'Amount' },
    { value: 'supplier_no', label: 'Supplier' },
    { value: 'store_no', label: 'Store' }
  ];

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await generateAdvancedPurchaseReport(filters);
      if (response.success) {
        setReportData(response.data);
      } else {
        setError(response.message || 'Failed to generate purchase report');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while generating the report');
      console.error('Purchase report error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(2)}%`;
  };

  // Handle export functionality
  const handleExport = async (format) => {
    try {
      setLoading(true);
      
      if (format === 'pdf') {
        // Handle PDF export using frontend generation
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(18);
        doc.text('Purchase Report', 20, 20);
        
        // Add generation date
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
        
        // Add date range if filters are set
        if (filters.startDate || filters.endDate) {
          const startStr = filters.startDate ? filters.startDate.toLocaleDateString() : 'Beginning';
          const endStr = filters.endDate ? filters.endDate.toLocaleDateString() : 'Today';
          doc.text(`Period: ${startStr} - ${endStr}`, 20, 45);
        }
        
        // Create table for purchase data
        if (reportData?.purchases && reportData.purchases.length > 0) {
          let yPos = 65;
          
          // Table headers
          const headers = ['Purchase No', 'Date', 'Supplier', 'Store', 'Product', 'Qty', 'Unit Cost', 'Total', 'Status'];
          const colWidths = [22, 22, 28, 22, 32, 12, 18, 18, 16];
          const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
          const startX = (210 - tableWidth) / 2; // Center table on page
          let xPos = startX;
          
          // Draw header background
          doc.setFillColor(240, 240, 240);
          doc.rect(startX, yPos - 5, tableWidth, 10, 'F');
          
          // Draw headers
          doc.setFontSize(8);
          doc.setFont(undefined, 'bold');
          headers.forEach((header, index) => {
            const cellWidth = colWidths[index];
            const textWidth = doc.getTextWidth(header);
            const textX = xPos + (cellWidth - textWidth) / 2; // Center text in cell
            doc.text(header, textX, yPos);
            xPos += cellWidth;
          });
          
          yPos += 10;
          doc.setFont(undefined, 'normal');
          
          // Draw table data
          reportData.purchases.slice(0, 25).forEach((purchase, rowIndex) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            
            xPos = startX;
            const rowData = [
              purchase.purchase_no || '',
              purchase.created_at ? new Date(purchase.created_at).toLocaleDateString() : '',
              purchase.supplier_name || '',
              purchase.store_name || '',
              purchase.items?.[0]?.product_name || '',
              purchase.items?.[0]?.qty || '',
              purchase.items?.[0]?.cost ? `$${parseFloat(purchase.items[0].cost).toFixed(2)}` : '',
              purchase.amount ? `$${parseFloat(purchase.amount).toFixed(2)}` : '',
              purchase.status || ''
            ];
            
            // Alternate row background
            if (rowIndex % 2 === 1) {
              doc.setFillColor(250, 250, 250);
              doc.rect(startX, yPos - 5, tableWidth, 8, 'F');
            }
            
            rowData.forEach((data, index) => {
              const cellWidth = colWidths[index];
              const truncatedData = String(data).substring(0, Math.floor(cellWidth / 2.5));
              const textWidth = doc.getTextWidth(truncatedData);
              const textX = xPos + (cellWidth - textWidth) / 2; // Center text in cell
              doc.text(truncatedData, textX, yPos);
              xPos += cellWidth;
            });
            
            yPos += 8;
          });
          
          // Draw table borders
          doc.setDrawColor(200, 200, 200);
          doc.rect(startX, 60, tableWidth, yPos - 60);
          
          // Draw vertical lines for columns
          let lineX = startX;
          colWidths.forEach(width => {
            lineX += width;
            doc.line(lineX, 60, lineX, yPos);
          });
        }
        
        // Save PDF
        doc.save(`purchase_report_${new Date().toISOString().split('T')[0]}.pdf`);
        return;
      }
      
      const queryParams = new URLSearchParams({
        format,
        start: filters.startDate?.toISOString(),
        end: filters.endDate?.toISOString(),
        supplier_no: filters.supplier_no,
        store_no: filters.store_no,
        product_no: filters.product_no,
        status: filters.status,
        payment_status: filters.payment_status,
        min_amount: filters.min_amount,
        max_amount: filters.max_amount
      });

      // Remove empty parameters
      for (const [key, value] of [...queryParams.entries()]) {
        if (!value || value === 'undefined' || value === 'null') {
          queryParams.delete(key);
        }
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/purchases/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `purchase_report_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError(`Export failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (value) => {
    const numValue = parseFloat(value);
    if (numValue > 0) {
      return <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />;
    } else if (numValue < 0) {
      return <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />;
    }
    return null;
  };

  const getTrendColor = (value) => {
    const numValue = parseFloat(value);
    if (numValue > 0) return 'success.main';
    if (numValue < 0) return 'error.main';
    return 'text.secondary';
  };

  const renderSummaryCards = () => {
    if (!reportData?.summary) return null;

    const { summary, comparison } = reportData;

    return (
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div>
              <div className={styles.summaryTitle}>Total Purchases</div>
              <div className={styles.summaryValue}>{formatNumber(summary.total_purchases)}</div>
            </div>
            <div className={styles.iconContainer}>
              <PurchaseIcon sx={{ fontSize: 24, color: 'white' }} />
            </div>
          </div>
          {comparison?.growth && (
            <div className={styles.summaryCompare}>
              {getTrendIcon(comparison.growth.purchase_count)}
              <span className={parseFloat(comparison.growth.purchase_count) >= 0 ? styles.increaseText : styles.decreaseText}>
                {formatPercentage(comparison.growth.purchase_count)}
              </span>
            </div>
          )}
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div>
              <div className={styles.summaryTitle}>Total Amount</div>
              <div className={styles.summaryValue}>{formatCurrency(summary.total_amount)}</div>
            </div>
            <div className={styles.iconContainer}>
              <TrendingUpIcon sx={{ fontSize: 24, color: 'white' }} />
            </div>
          </div>
          {comparison?.growth && (
            <div className={styles.summaryCompare}>
              {getTrendIcon(comparison.growth.amount)}
              <span className={parseFloat(comparison.growth.amount) >= 0 ? styles.increaseText : styles.decreaseText}>
                {formatPercentage(comparison.growth.amount)}
              </span>
            </div>
          )}
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div>
              <div className={styles.summaryTitle}>Average Purchase Value</div>
              <div className={styles.summaryValue}>{formatCurrency(summary.average_purchase_value)}</div>
            </div>
            <div className={styles.iconContainer}>
              <StoreIcon sx={{ fontSize: 24, color: 'white' }} />
            </div>
          </div>
          {comparison?.growth && (
            <div className={styles.summaryCompare}>
              {getTrendIcon(comparison.growth.average_purchase_value)}
              <span className={parseFloat(comparison.growth.average_purchase_value) >= 0 ? styles.increaseText : styles.decreaseText}>
                {formatPercentage(comparison.growth.average_purchase_value)}
              </span>
            </div>
          )}
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div>
              <div className={styles.summaryTitle}>Payment Completion Rate</div>
              <div className={styles.summaryValue}>{formatPercentage(summary.payment_completion_rate)}</div>
            </div>
            <div className={styles.iconContainer}>
              <SupplierIcon sx={{ fontSize: 24, color: 'white' }} />
            </div>
          </div>
          {comparison?.growth && (
            <div className={styles.summaryCompare}>
              {getTrendIcon(comparison.growth.payment_completion_rate)}
              <span className={parseFloat(comparison.growth.payment_completion_rate) >= 0 ? styles.increaseText : styles.decreaseText}>
                {formatPercentage(comparison.growth.payment_completion_rate)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFilters = () => (
    <div className={styles.filterCard}>
      <div className={styles.filterHeader}>
        <FilterIcon />
        <h2>Filters</h2>
      </div>
      
      <div className={styles.filterGrid}>
        <div className={styles.filterGroup}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(date) => handleFilterChange('startDate', date)}
              renderInput={(params) => <TextField {...params} fullWidth size="small" className={styles.filterInput} />}
            />
          </LocalizationProvider>
        </div>
        
        <div className={styles.filterGroup}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={(date) => handleFilterChange('endDate', date)}
              renderInput={(params) => <TextField {...params} fullWidth size="small" className={styles.filterInput} />}
            />
          </LocalizationProvider>
        </div>

        <div className={styles.filterGroup}>
          <TextField
            fullWidth
            size="small"
            label="Supplier No"
            value={filters.supplier_no}
            onChange={(e) => handleFilterChange('supplier_no', e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <TextField
            fullWidth
            size="small"
            label="Store No"
            value={filters.store_no}
            onChange={(e) => handleFilterChange('store_no', e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={styles.filterSelect}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className={styles.filterGroup}>
          <FormControl fullWidth size="small">
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={filters.payment_status}
              label="Payment Status"
              onChange={(e) => handleFilterChange('payment_status', e.target.value)}
              className={styles.filterSelect}
            >
              {paymentStatusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className={styles.filterGroup}>
          <FormControl fullWidth size="small">
            <InputLabel>Group By</InputLabel>
            <Select
              value={filters.groupBy}
              label="Group By"
              onChange={(e) => handleFilterChange('groupBy', e.target.value)}
              className={styles.filterSelect}
            >
              {groupByOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className={styles.filterGroup}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sortBy}
              label="Sort By"
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className={styles.filterSelect}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
          label="Include Purchase Items"
        />
        <FormControlLabel
          control={
            <Switch
              checked={filters.includeComparisons}
              onChange={(e) => handleFilterChange('includeComparisons', e.target.checked)}
            />
          }
          label="Include Period Comparisons"
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
              <RefreshIcon size={16} />
              Generate Report
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <div>
      {renderSummaryCards()}
      
      {reportData?.time_series && (
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            Purchase Trends Over Time
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={reportData.time_series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value, name) => [
                    name === 'total_amount' ? formatCurrency(value) : formatNumber(value),
                    name === 'total_amount' ? 'Amount' : 'Purchases'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_amount" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="purchase_count" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {reportData?.summary?.purchases_by_status && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              Purchases by Status
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(reportData.summary.purchases_by_status).map(([key, value]) => ({
                      name: key.charAt(0).toUpperCase() + key.slice(1),
                      value
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {Object.entries(reportData.summary.purchases_by_status).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              Payment Status Distribution
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(reportData.summary.payment_status_breakdown).map(([key, value]) => ({
                      name: key.charAt(0).toUpperCase() + key.slice(1),
                      value
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {Object.entries(reportData.summary.payment_status_breakdown).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailedAnalysisTab = () => (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        Detailed Purchase Analysis
      </div>
      
      {reportData?.purchases && (
        <div className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th className={styles.tableHeadCell}>Purchase ID</th>
                <th className={styles.tableHeadCell}>Date</th>
                <th className={styles.tableHeadCell}>Supplier</th>
                <th className={styles.tableHeadCell}>Store</th>
                <th className={styles.tableHeadCell}>Amount</th>
                <th className={styles.tableHeadCell}>Paid</th>
                <th className={styles.tableHeadCell}>Outstanding</th>
                <th className={styles.tableHeadCell}>Status</th>
                <th className={styles.tableHeadCell}>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.purchases
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((purchase) => (
                  <tr className={styles.tableRow} key={purchase.purchase_id}>
                    <td className={styles.tableCell}>{purchase.purchase_id}</td>
                    <td className={styles.tableCell}>
                      {new Date(purchase.created_at).toLocaleDateString()}
                    </td>
                    <td className={styles.tableCell}>{purchase.supplier_name || purchase.supplier_no}</td>
                    <td className={styles.tableCell}>{purchase.store_name || purchase.store_no}</td>
                    <td className={styles.tableCell}>{formatCurrency(purchase.amount)}</td>
                    <td className={styles.tableCell}>{formatCurrency(purchase.paid)}</td>
                    <td className={styles.tableCell}>{formatCurrency((purchase.amount || 0) - (purchase.paid || 0))}</td>
                    <td className={styles.tableCell}>
                      <Chip 
                        label={purchase.status || 'pending'} 
                        size="small"
                        color={purchase.status === 'received' ? 'success' : 'default'}
                      />
                    </td>
                    <td className={styles.tableCell}>
                      <Chip 
                        label={purchase.payment_status || 'unpaid'} 
                        size="small"
                        color={purchase.payment_status === 'paid' ? 'success' : 'warning'}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={reportData.purchases.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </div>
      )}
    </div>
  );

  const renderTopPerformersTab = () => (
    <div>
      {reportData?.topPerformers && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Top Suppliers */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              🏭 Top Suppliers
            </div>
            {reportData.topPerformers.top_suppliers?.length > 0 ? (
              <div>
                {reportData.topPerformers.top_suppliers.map((supplier, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.75rem 0',
                      borderBottom: index < reportData.topPerformers.top_suppliers.length - 1 ? '1px solid var(--border)' : 'none'
                    }}
                  >
                    <div>
                      <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                        {supplier.supplier_name || `Supplier ${supplier.supplier_no}`}
                      </Typography>
                      <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>
                        {supplier.total_orders} orders
                      </Typography>
                    </div>
                    <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                      ${Number(supplier.total_amount || 0).toLocaleString()}
                    </Typography>
                  </div>
                ))}
              </div>
            ) : (
              <Typography variant="body2" style={{ color: 'var(--text-secondary)', padding: '1rem' }}>
                No supplier data available
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
                        {product.total_qty_purchased} purchased
                      </Typography>
                    </div>
                    <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                      ${Number(product.total_amount || 0).toLocaleString()}
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
                      ${Number(store.total_amount || 0).toLocaleString()}
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
                    <RechartsTooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Bar dataKey="total_amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTimeSeriesTab = () => (
    <div>
      {/* Time Series Controls */}
      <div className={styles.filterCard}>
        <div className={styles.filterHeader}>
          <h2>Time Series Settings</h2>
        </div>
        <div className={styles.filterGrid}>
          <div className={styles.filterGroup}>
            <TextField
              select
              fullWidth
              label="Group By"
              value={filters.groupBy}
              onChange={(e) => handleFilterChange('groupBy', e.target.value)}
              size="small"
              className={styles.filterSelect}
            >
              <MenuItem value="day">Daily</MenuItem>
              <MenuItem value="week">Weekly</MenuItem>
              <MenuItem value="month">Monthly</MenuItem>
              <MenuItem value="quarter">Quarterly</MenuItem>
              <MenuItem value="year">Yearly</MenuItem>
            </TextField>
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
                  Update Chart
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
      
      {/* Purchase Amount Trend */}
      {reportData?.timeSeriesData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>Purchase Amount Over Time</div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportData.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => [`$${value}`, 'Amount']} />
                  <Legend />
                  <Line type="monotone" dataKey="total_amount" stroke="#8884d8" strokeWidth={2} name="Amount" />
                  <Line type="monotone" dataKey="purchase_count" stroke="#82ca9d" strokeWidth={2} name="Purchase Count" yAxisId="right" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>Purchase Volume Trend</div>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="purchase_count" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>Average Purchase Value</div>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => [`$${value}`, 'APV']} />
                    <Line type="monotone" dataKey="average_purchase_value" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <div className={styles.purchaseReports}>
        <div className={styles.errorAlert}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
        <button className={styles.primaryButton} onClick={generateReport}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className={styles.purchaseReports}>
        {/* Header */}
        <div className={styles.purchaseReportsHeader}>
          <button className={styles.backButton} onClick={handleBackClick}>
            <ArrowLeft size={20} />
            Back to Reports
          </button>
          <h1>Purchase Reports</h1>
          <p>Enterprise-level purchase analytics and reporting</p>
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
              <DownloadIcon size={20} />
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

        <div className={styles.purchaseReportsContent}>
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
          {activeTab === 0 && renderOverviewTab()}
          {activeTab === 1 && renderDetailedAnalysisTab()}
          {activeTab === 2 && renderTopPerformersTab()}
          {activeTab === 3 && renderTimeSeriesTab()}
          
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

export default PurchaseReports;