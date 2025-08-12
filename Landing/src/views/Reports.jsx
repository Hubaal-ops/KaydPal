import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Grid, TextField, MenuItem, Select, FormControl, InputLabel,
  CircularProgress, useTheme, useMediaQuery, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, IconButton, Tooltip, Card, CardContent, Divider, Chip,
  ButtonGroup
} from '@mui/material';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Refresh as RefreshIcon,
  PictureAsPdf as FilePdf,
  GridOn as FileExcel,
  TableChart as CsvIcon,
  BarChart as BarChartIcon,
  TableView as TableViewIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Mock data generator for demonstration
const generateMockData = (type) => {
  const now = new Date();
  const data = {
    summary: {},
    chartData: [],
    tableData: [],
    columns: []
  };

  switch (type) {
    case 'sales':
      data.summary = {
        totalSales: 1245,
        totalRevenue: 28450.75,
        avgOrderValue: 228.5,
        growthRate: 12.5
      };
      data.chartData = Array.from({ length: 12 }, (_, i) => ({
        name: new Date(now.getFullYear(), i).toLocaleString('default', { month: 'short' }),
        sales: Math.floor(Math.random() * 100) + 50,
        revenue: Math.floor(Math.random() * 5000) + 1000,
      }));
      data.tableData = Array.from({ length: 15 }, (_, i) => ({
        id: `ORD-${1000 + i}`,
        date: subDays(now, i).toISOString(),
        customer: `Customer ${i + 1}`,
        amount: (Math.random() * 1000 + 50).toFixed(2),
        status: ['Completed', 'Pending', 'Cancelled'][Math.floor(Math.random() * 3)],
      }));
      data.columns = [
        { id: 'id', label: 'Order ID' },
        { id: 'date', label: 'Date', format: (value) => new Date(value).toLocaleDateString() },
        { id: 'customer', label: 'Customer' },
        { id: 'amount', label: 'Amount', format: (value) => `$${parseFloat(value).toFixed(2)}` },
        { 
          id: 'status', 
          label: 'Status',
          format: (value) => (
            <Chip 
              label={value} 
              size="small" 
              color={
                value === 'Completed' ? 'success' : 
                value === 'Pending' ? 'warning' : 'error'
              } 
            />
          )
        }
      ];
      break;
    
    case 'inventory':
      data.summary = {
        totalProducts: 156,
        totalStock: 2458,
        outOfStock: 8,
        lowStock: 24
      };
      data.chartData = [
        { name: 'In Stock', value: 75 },
        { name: 'Low Stock', value: 15 },
        { name: 'Out of Stock', value: 10 },
      ];
      data.tableData = Array.from({ length: 15 }, (_, i) => ({
        id: `SKU-${1000 + i}`,
        name: `Product ${i + 1}`,
        category: ['Electronics', 'Clothing', 'Home', 'Books'][Math.floor(Math.random() * 4)],
        stock: Math.floor(Math.random() * 100),
        price: (Math.random() * 200 + 10).toFixed(2),
        status: ['In Stock', 'Low Stock', 'Out of Stock'][Math.max(0, Math.min(2, Math.floor(Math.random() * 4)))]
      }));
      data.columns = [
        { id: 'id', label: 'SKU' },
        { id: 'name', label: 'Product Name' },
        { id: 'category', label: 'Category' },
        { id: 'stock', label: 'In Stock', align: 'right' },
        { id: 'price', label: 'Price', format: (value) => `$${parseFloat(value).toFixed(2)}`, align: 'right' },
        { 
          id: 'status', 
          label: 'Status',
          format: (value) => (
            <Chip 
              label={value} 
              size="small" 
              color={
                value === 'In Stock' ? 'success' : 
                value === 'Low Stock' ? 'warning' : 'error'
              } 
            />
          )
        }
      ];
      break;
      
    default:
      data.summary = {
        totalItems: 42,
        totalValue: 12500,
        average: 297.62,
        growth: 5.2
      };
  }
  
  return data;
};

const Reports = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date()
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [viewType, setViewType] = useState('chart'); // 'chart' or 'table'

  const reportTypes = [
    { value: 'sales', label: 'Sales Report', icon: '📊' },
    { value: 'inventory', label: 'Inventory Report', icon: '📦' },
    { value: 'purchases', label: 'Purchases Report', icon: '🛒' },
    { value: 'expenses', label: 'Expenses Report', icon: '💰' },
    { value: 'profit-loss', label: 'Profit & Loss', icon: '📈' },
    { value: 'tax', label: 'Tax Report', icon: '🏛️' },
  ];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format date for API
  const formatDate = (date) => {
    return format(date, 'yyyy-MM-dd');
  };

  const handleDateChange = (date, type) => {
    setDateRange(prev => ({
      ...prev,
      [type]: date
    }));
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError('');
      setPage(0);
      let url = `/api/reports/${reportType}?startDate=${formatDate(dateRange.startDate)}&endDate=${formatDate(dateRange.endDate)}`;
      // Add more filters here if needed (e.g., product_no, customer_no)
      const res = await fetch(url);
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'API error');
      // Transform backend data to fit frontend expectations if needed
      setReportData({
        ...result.data,
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError('Failed to generate report. Please try again.');
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setLoading(true);
      const params = {
        startDate: formatDate(dateRange.startDate),
        endDate: formatDate(dateRange.endDate),
        format,
      };
      
      // In a real app, you would call the API like this:
      // await exportReport(reportType, format, params);
      
      // For now, just simulate the export
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a dummy file for download
      const content = `This is a sample ${reportType} report in ${format} format.\n\n` +
        `Date Range: ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}\n` +
        `Generated on: ${new Date().toLocaleString()}`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      setError('Failed to export report. Please try again.');
      console.error('Error exporting report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render the main report content (charts and tables)
  const renderReportContent = () => {
    if (!reportData) return null;
    const isChartView = viewType === 'chart';
    if (!reportData || !Array.isArray(reportData.rows) || reportData.rows.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No data available for this report.
          </Typography>
          <Box sx={{ mt: 2, textAlign: 'left', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, fontSize: 13 }}>
            <strong>Debug API response:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(reportData, null, 2)}</pre>
          </Box>
        </Box>
      );
    }
    const safeRows = reportData.rows;
    // Prepare chart data: group by date
    let chartData = [];
    if (reportType === 'sales') {
      const dateMap = {};
      safeRows.forEach(row => {
        const date = row.sel_date ? new Date(row.sel_date).toLocaleDateString() : '-';
        if (!dateMap[date]) dateMap[date] = { date, total: 0, revenue: 0 };
        dateMap[date].total += 1;
        dateMap[date].revenue += Number(row.amount) || 0;
      });
      chartData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (reportType === 'purchases') {
      const dateMap = {};
      safeRows.forEach(row => {
        const date = row.created_at ? new Date(row.created_at).toLocaleDateString() : '-';
        if (!dateMap[date]) dateMap[date] = { date, total: 0, amount: 0 };
        dateMap[date].total += 1;
        dateMap[date].amount += Number(row.amount) || 0;
      });
      chartData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (reportType === 'expenses') {
      const dateMap = {};
      safeRows.forEach(row => {
        const date = row.date ? new Date(row.date).toLocaleDateString() : (row.expense_date ? new Date(row.expense_date).toLocaleDateString() : '-');
        if (!dateMap[date]) dateMap[date] = { date, total: 0, amount: 0 };
        dateMap[date].total += 1;
        dateMap[date].amount += Number(row.amount) || 0;
      });
      chartData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    // Table columns for sales, purchases, expenses
    let salesColumns = [
      { id: 'sel_no', label: 'ID' },
      { id: 'product_name', label: 'Product Name' },
      { id: 'customer_name', label: 'Customer Name' },
      { id: 'store_no', label: 'Store' },
      { id: 'qty', label: 'Qty' },
      { id: 'price', label: 'Price' },
      { id: 'discount', label: 'Discount' },
      { id: 'tax', label: 'Tax' },
      { id: 'amount', label: 'Amount' },
      { id: 'paid', label: 'Paid' },
      { id: 'account_id', label: 'Account' },
      { id: 'sel_date', label: 'Date', format: (value) => new Date(value).toLocaleDateString() },
    ];
    let purchaseColumns = [
      { id: 'purchase_id', label: 'ID' },
      { id: 'product_name', label: 'Product Name' },
      { id: 'supplier_name', label: 'Supplier Name' },
      { id: 'store_name', label: 'Store' },
      { id: 'qty', label: 'Qty' },
      { id: 'price', label: 'Price' },
      { id: 'discount', label: 'Discount' },
      { id: 'tax', label: 'Tax' },
      { id: 'amount', label: 'Amount' },
      { id: 'paid', label: 'Paid' },
      { id: 'account_id', label: 'Account' },
      { id: 'created_at', label: 'Date', format: (value) => new Date(value).toLocaleDateString() },
    ];
    let expenseColumns = [
      { id: 'expense_id', label: 'ID' },
      { id: 'category', label: 'Category' },
      { id: 'account', label: 'Account' },
      { id: 'amount', label: 'Amount' },
      { id: 'description', label: 'Description' },
      { id: 'expense_date', label: 'Date', format: (value) => value ? new Date(value).toLocaleDateString() : '' },
    ];
    return (
      <Box>
        {/* View Toggle */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <ButtonGroup size="small" variant="outlined">
            <Button 
              onClick={() => setViewType('chart')} 
              variant={isChartView ? 'contained' : 'outlined'}
              startIcon={isChartView ? <BarChartIcon /> : null}
            >
              {isChartView ? 'Charts' : 'View Charts'}
            </Button>
            <Button 
              onClick={() => setViewType('table')} 
              variant={!isChartView ? 'contained' : 'outlined'}
              startIcon={!isChartView ? <TableViewIcon /> : null}
            >
              {!isChartView ? 'Table' : 'View Table'}
            </Button>
          </ButtonGroup>
        </Box>
        {/* Chart View for sales */}
        {isChartView && reportType === 'sales' && (
          <Box sx={{ mb: 4, width: '100%', height: 350, background: '#fafbfc', borderRadius: 2, p: 2 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" stroke="#8884d8" />
                  <YAxis stroke="#8884d8" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total Purchases" fill="#8884d8" />
                  <Bar dataKey="revenue" name="Revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary">No sales data available for chart.</Typography>
            )}
          </Box>
        )}
        {/* Chart View for purchases */}
        {isChartView && reportType === 'purchases' && (
          <Box sx={{ mb: 4, width: '100%', height: 350, background: '#fafbfc', borderRadius: 2, p: 2 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" stroke="#8884d8" />
                  <YAxis stroke="#8884d8" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total Purchases" fill="#8884d8" />
                  <Bar dataKey="amount" name="Total Amount" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary">No purchase data available for chart.</Typography>
            )}
          </Box>
        )}
        {/* Chart View for expenses */}
        {isChartView && reportType === 'expenses' && (
          <Box sx={{ mb: 4, width: '100%', height: 350, background: '#fafbfc', borderRadius: 2, p: 2 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" stroke="#8884d8" />
                  <YAxis stroke="#8884d8" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total Expenses" fill="#8884d8" />
                  <Bar dataKey="amount" name="Total Amount" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary">No expense data available for chart.</Typography>
            )}
          </Box>
        )}
        {/* Table View for sales and purchases */}
        {!isChartView && reportType === 'sales' && reportData && (
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer component={Paper} elevation={0} variant="outlined">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {salesColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align || 'left'}
                        sx={{ fontWeight: 'bold' }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {safeRows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, idx) => (
                      <TableRow hover key={row.sel_no || idx}>
                        {salesColumns.map((column) => {
                          let value = row[column.id];
                          if (column.id === 'product_name') {
                            value = row.product_name || (row.items && row.items.length > 0 ? (row.items[0].product_name || row.items[0].name || row.items[0].product_no || '') : '');
                          }
                          if (column.id === 'customer_name') {
                            value = row.customer_name || row.customer || row.customer_no || '';
                          }
                          if (["qty","price","discount","tax"].includes(column.id)) {
                            value = row.items && row.items.length > 0 ? row.items[0][column.id] : '';
                          }
                          if (column.id === 'account_id') {
                            value = row.account_id || '';
                          }
                          if (column.format) value = column.format(value);
                          return (
                            <TableCell key={column.id} align={column.align || 'left'}>
                              {value}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={safeRows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        )}
        {!isChartView && reportType === 'purchases' && reportData && (
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer component={Paper} elevation={0} variant="outlined">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {purchaseColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align || 'left'}
                        sx={{ fontWeight: 'bold' }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {safeRows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, idx) => (
                      <TableRow hover key={row.purchase_id || idx}>
                        {purchaseColumns.map((column) => {
                          let value = row[column.id];
                          if (["product_name","supplier_name","store_name"].includes(column.id)) {
                            value = row[column.id] || '';
                          }
                          if (column.format) value = column.format(value);
                          return (
                            <TableCell key={column.id} align={column.align || 'left'}>
                              {value}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={safeRows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        )}
        {/* Table View for expenses */}
        {!isChartView && reportType === 'expenses' && reportData && (
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer component={Paper} elevation={0} variant="outlined">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {expenseColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align || 'left'}
                        sx={{ fontWeight: 'bold' }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {safeRows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, idx) => (
                      <TableRow hover key={row.expense_id || idx}>
                        {expenseColumns.map((column) => {
                          let value = row[column.id];
                          if (column.format) value = column.format(value);
                          return (
                            <TableCell key={column.id} align={column.align || 'left'}>
                              {value}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={safeRows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        )}
      </Box>
    );
  };

  // Render summary cards based on report type
  const renderSummaryCards = () => {
    if (!reportData?.summary) return null;
    
    const summaryItems = [];
    const summaryData = reportData.summary;
    
    switch (reportType) {
      case 'sales':
        summaryItems.push(
          { label: 'Total Sales', value: summaryData?.totalSales != null ? summaryData.totalSales.toLocaleString?.() || summaryData.totalSales : '-', icon: '🛒', color: '#3b82f6' },
          { label: 'Total Revenue', value: summaryData?.totalRevenue != null ? `$${summaryData.totalRevenue.toLocaleString?.() || summaryData.totalRevenue}` : '-', icon: '💰', color: '#10b981' },
          { label: 'Avg. Order Value', value: summaryData?.avgOrderValue != null ? `$${summaryData.avgOrderValue.toLocaleString?.() || summaryData.avgOrderValue}` : '-', icon: '📊', color: '#8b5cf6' },
          { label: 'Growth Rate', value: summaryData?.growthRate != null ? `${summaryData.growthRate}%` : '-', icon: '📈', color: '#f59e0b' }
        );
        break;
      case 'inventory':
        summaryItems.push(
          { label: 'Total Products', value: summaryData?.totalProducts ?? '-', icon: '📦', color: '#3b82f6' },
          { label: 'Total in Stock', value: summaryData?.totalStock ?? '-', icon: '📊', color: '#10b981' },
          { label: 'Out of Stock', value: summaryData?.outOfStock ?? '-', icon: '⚠️', color: '#ef4444' },
          { label: 'Low Stock', value: summaryData?.lowStock ?? '-', icon: '🔍', color: '#f59e0b' }
        );
        break;
      case 'expenses':
        summaryItems.push(
          { label: 'Total Expenses', value: summaryData?.totalExpenses != null ? summaryData.totalExpenses.toLocaleString?.() || summaryData.totalExpenses : '-', icon: '💸', color: '#ef4444' },
          { label: 'Total Amount', value: summaryData?.totalAmount != null ? `$${summaryData.totalAmount.toLocaleString?.() || summaryData.totalAmount}` : '-', icon: '💰', color: '#f59e0b' }
        );
        break;
      default:
        Object.entries(summaryData || {}).forEach(([key, value]) => {
          summaryItems.push({
            label: key.split(/(?=[A-Z])/).join(' '),
            value: typeof value === 'number' ? value.toLocaleString?.() || value : value,
            icon: '📝',
            color: '#6b7280'
          });
        });
    }
    // MUI v6+ Grid: remove item/xs/sm/md props, use columns prop
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {summaryItems.map((item, index) => (
          <Card 
            key={index}
            variant="outlined" 
            sx={{ 
              flex: '1 1 220px',
              minWidth: 200,
              maxWidth: 300,
              borderLeft: `4px solid ${item.color}`,
              '&:hover': { boxShadow: 1 }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    {item.label}
                  </Typography>
                  <Typography variant="h6" component="div">
                    {item.value}
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: '50%', 
                    bgcolor: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24
                  }}
                >
                  {item.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ p: isMobile ? 2 : 3, maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate and analyze detailed reports for your business
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={generateReport}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Generating...' : 'Generate'}
          </Button>
          
          <Box sx={{ display: 'flex', '& > *': { ml: 1 } }}>
            <Tooltip title="Export as PDF">
              <span>
                <IconButton 
                  onClick={() => handleExport('pdf')} 
                  disabled={!reportData || loading}
                  color="primary"
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <FilePdf />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Export as Excel">
              <span>
                <IconButton 
                  onClick={() => handleExport('xlsx')} 
                  disabled={!reportData || loading}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <FileExcel />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <span>
                <IconButton 
                  onClick={() => handleExport('csv')} 
                  disabled={!reportData || loading}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <CsvIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Print">
              <span>
                <IconButton 
                  onClick={() => window.print()} 
                  disabled={!reportData || loading}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <PrintIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }} elevation={0} variant="outlined">
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box component="span" sx={{ mr: 1 }}>📊</Box>
          Report Parameters
        </Typography>
        <Grid container spacing={3}>
          <Box sx={{ flex: 1, minWidth: 220, maxWidth: 400 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="report-type-label">Report Type</InputLabel>
              <Select
                labelId="report-type-label"
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
                disabled={loading}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {reportTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box component="span" sx={{ mr: 1.5, fontSize: '1.2rem' }}>{type.icon}</Box>
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: 1, minWidth: 220, maxWidth: 400 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={dateRange.startDate}
                onChange={(date) => handleDateChange(date, 'startDate')}
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    InputProps: {
                      startAdornment: (
                        <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}>📅</Box>
                      ),
                    },
                  },
                }}
                maxDate={dateRange.endDate}
              />
            </LocalizationProvider>
          </Box>
          <Box sx={{ flex: 1, minWidth: 220, maxWidth: 400 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={dateRange.endDate}
                onChange={(date) => handleDateChange(date, 'endDate')}
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    InputProps: {
                      startAdornment: (
                        <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}>📅</Box>
                      ),
                    },
                  },
                }}
                minDate={dateRange.startDate}
                maxDate={new Date()}
              />
            </LocalizationProvider>
          </Box>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      {reportData && renderSummaryCards()}

      {/* Report Content */}
      {reportData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper sx={{ p: 3, mb: 3 }} elevation={0} variant="outlined">
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="h2">
                {reportData.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generated on: {new Date(reportData.generatedAt).toLocaleString()}
              </Typography>
            </Box>
            
            {/* Report-specific content */}
            {renderReportContent()}
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Report ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {reportData && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper sx={{ p: 3 }} elevation={3}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" component="h2">
                {reportData.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generated on: {new Date(reportData.generatedAt).toLocaleString()}
              </Typography>
            </Box>
            
            {/* Report content will go here */}
            <Box sx={{ my: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {reportType === 'sales' && 'Sales report data will be displayed here'}
                {reportType === 'inventory' && 'Inventory report data will be displayed here'}
                {reportType === 'purchases' && 'Purchases report data will be displayed here'}
                {reportType === 'expenses' && 'Expenses report data will be displayed here'}
                {reportType === 'profit-loss' && 'Profit & Loss report data will be displayed here'}
                {reportType === 'tax' && 'Tax report data will be displayed here'}
              </Typography>
            </Box>

            {/* TODO: Add actual report content based on reportType */}
          </Paper>
        </motion.div>
      )}
    </Box>
  );
};

// Simple error boundary for this component
const ReportsWithErrorBoundary = (props) => {
  const [hasError, setHasError] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  try {
    if (hasError) {
      return (
        <Box sx={{ p: 4, color: 'error.main', textAlign: 'center' }}>
          <Typography variant="h5" color="error">Something went wrong in the Reports page.</Typography>
          <Typography variant="body2" color="error">{errorMsg}</Typography>
        </Box>
      );
    }
    return <Reports {...props} />;
  } catch (err) {
    setHasError(true);
    setErrorMsg(err.message || 'Unknown error');
    return null;
  }
};

export default ReportsWithErrorBoundary;
