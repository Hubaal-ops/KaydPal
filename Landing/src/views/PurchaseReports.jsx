import React, { useState, useEffect } from 'react';
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
  Inventory as ProductIcon
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const PurchaseReports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Purchases
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(summary.total_purchases)}
                  </Typography>
                  {comparison?.growth && (
                    <Box display="flex" alignItems="center" mt={1}>
                      {getTrendIcon(comparison.growth.purchase_count)}
                      <Typography 
                        variant="body2" 
                        sx={{ color: getTrendColor(comparison.growth.purchase_count), ml: 0.5 }}
                      >
                        {formatPercentage(comparison.growth.purchase_count)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <PurchaseIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Amount
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(summary.total_amount)}
                  </Typography>
                  {comparison?.growth && (
                    <Box display="flex" alignItems="center" mt={1}>
                      {getTrendIcon(comparison.growth.amount)}
                      <Typography 
                        variant="body2" 
                        sx={{ color: getTrendColor(comparison.growth.amount), ml: 0.5 }}
                      >
                        {formatPercentage(comparison.growth.amount)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Average Purchase Value
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(summary.average_purchase_value)}
                  </Typography>
                  {comparison?.growth && (
                    <Box display="flex" alignItems="center" mt={1}>
                      {getTrendIcon(comparison.growth.average_purchase_value)}
                      <Typography 
                        variant="body2" 
                        sx={{ color: getTrendColor(comparison.growth.average_purchase_value), ml: 0.5 }}
                      >
                        {formatPercentage(comparison.growth.average_purchase_value)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <StoreIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Payment Completion Rate
                  </Typography>
                  <Typography variant="h4">
                    {formatPercentage(summary.payment_completion_rate)}
                  </Typography>
                  {comparison?.growth && (
                    <Box display="flex" alignItems="center" mt={1}>
                      {getTrendIcon(comparison.growth.payment_completion_rate)}
                      <Typography 
                        variant="body2" 
                        sx={{ color: getTrendColor(comparison.growth.payment_completion_rate), ml: 0.5 }}
                      >
                        {formatPercentage(comparison.growth.payment_completion_rate)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <SupplierIcon sx={{ fontSize: 40, color: 'warning.main' }} />
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
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Supplier No"
              value={filters.supplier_no}
              onChange={(e) => handleFilterChange('supplier_no', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Store No"
              value={filters.store_no}
              onChange={(e) => handleFilterChange('store_no', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={filters.payment_status}
                label="Payment Status"
                onChange={(e) => handleFilterChange('payment_status', e.target.value)}
              >
                {paymentStatusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Group By</InputLabel>
              <Select
                value={filters.groupBy}
                label="Group By"
                onChange={(e) => handleFilterChange('groupBy', e.target.value)}
              >
                {groupByOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sort By"
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
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
        </Box>

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
            onClick={() => {/* TODO: Implement export */}}
          >
            Export
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderOverviewTab = () => (
    <Box>
      {renderSummaryCards()}
      
      {reportData?.time_series && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Purchase Trends Over Time
            </Typography>
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
          </CardContent>
        </Card>
      )}

      {reportData?.summary?.purchases_by_status && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Purchases by Status
                </Typography>
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
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Status Distribution
                </Typography>
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
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderDetailedAnalysisTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Detailed Purchase Analysis
        </Typography>
        
        {reportData?.purchases && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Purchase ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Store</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Outstanding</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.purchases
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((purchase) => (
                    <TableRow key={purchase.purchase_id}>
                      <TableCell>{purchase.purchase_id}</TableCell>
                      <TableCell>
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{purchase.supplier_name || purchase.supplier_no}</TableCell>
                      <TableCell>{purchase.store_name || purchase.store_no}</TableCell>
                      <TableCell>{formatCurrency(purchase.amount)}</TableCell>
                      <TableCell>{formatCurrency(purchase.paid)}</TableCell>
                      <TableCell>{formatCurrency((purchase.amount || 0) - (purchase.paid || 0))}</TableCell>
                      <TableCell>
                        <Chip 
                          label={purchase.status || 'pending'} 
                          size="small"
                          color={purchase.status === 'received' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={purchase.payment_status || 'unpaid'} 
                          size="small"
                          color={purchase.payment_status === 'paid' ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={reportData.purchases.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );

  const renderTopPerformersTab = () => (
    <Box>
      {reportData?.topPerformers && (
        <Grid container spacing={3}>
          {/* Top Suppliers */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  🏭 Top Suppliers
                </Typography>
                {reportData.topPerformers.top_suppliers?.length > 0 ? (
                  <Box>
                    {reportData.topPerformers.top_suppliers.map((supplier, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: index < reportData.topPerformers.top_suppliers.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {supplier.supplier_name || `Supplier ${supplier.supplier_no}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {supplier.total_orders} orders
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${Number(supplier.total_amount || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No supplier data available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Top Products */}
          <Grid item xs={12} md={4}>
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
                            {product.total_qty_purchased} purchased
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${Number(product.total_amount || 0).toLocaleString()}
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
          <Grid item xs={12} md={4}>
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
                          ${Number(store.total_amount || 0).toLocaleString()}
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
          <Grid item xs={12}>
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
                      <RechartsTooltip formatter={(value) => [`$${value}`, 'Amount']} />
                      <Bar dataKey="total_amount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderTimeSeriesTab = () => (
    <Box>
      {/* Time Series Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Time Series Settings</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
      
      {/* Purchase Amount Trend */}
      {reportData?.timeSeriesData && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Purchase Amount Over Time</Typography>
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
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Purchase Volume Trend</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="purchase_count" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Average Purchase Value</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => [`$${value}`, 'APV']} />
                    <Line type="monotone" dataKey="average_purchase_value" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={generateReport} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, maxWidth: '100%' }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Purchase Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enterprise-level purchase analytics and reporting
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
              <Button onClick={() => handleExport('json')} disabled={loading}>
                JSON
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
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Detailed Analysis" />
            <Tab label="Top Performers" />
            <Tab label="Time Series" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {activeTab === 0 && renderOverviewTab()}
        {activeTab === 1 && renderDetailedAnalysisTab()}
        {activeTab === 2 && renderTopPerformersTab()}
        {activeTab === 3 && renderTimeSeriesTab()}
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default PurchaseReports;
