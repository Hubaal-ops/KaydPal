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
// Simple error boundary for this component

// Table columns for each report type
const salesColumns = [
  { id: 'sel_no', label: 'Sale No' },
  { id: 'date', label: 'Date', format: (value) => value ? new Date(value).toLocaleDateString() : '' },
  { id: 'customer_name', label: 'Customer' },
  { id: 'product_name', label: 'Product' },
  { id: 'qty', label: 'Qty' },
  { id: 'price', label: 'Price' },
  { id: 'discount', label: 'Discount' },
  { id: 'tax', label: 'Tax' },
  { id: 'total', label: 'Total' },
  { id: 'account_id', label: 'Account' },
];

const purchaseColumns = [
  { id: 'purchase_id', label: 'Purchase No' },
  { id: 'date', label: 'Date', format: (value) => value ? new Date(value).toLocaleDateString() : '' },
  { id: 'supplier_name', label: 'Supplier' },
  { id: 'product_name', label: 'Product' },
  { id: 'qty', label: 'Qty' },
  { id: 'price', label: 'Price' },
  { id: 'amount', label: 'Amount' },
  { id: 'store_name', label: 'Store' },
];

const expenseColumns = [
  { id: 'expense_id', label: 'Expense No' },
  { id: 'date', label: 'Date', format: (value) => value ? new Date(value).toLocaleDateString() : '' },
  { id: 'category', label: 'Category' },
  { id: 'amount', label: 'Amount' },
  { id: 'description', label: 'Description' },
];

const lowStockColumns = [
  { id: 'product_no', label: 'Product No' },
  { id: 'name', label: 'Product Name' },
  { id: 'stock', label: 'Stock' },
  { id: 'minStock', label: 'Min Stock' },
  { id: 'status', label: 'Status' },
];
// Simple error boundary for this component


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
  // State for top/bottom toggle in Top/Bottom Products report
  const [topBottomType, setTopBottomType] = useState('top'); // 'top' or 'bottom'

  const reportTypes = [
    { value: 'sales', label: 'Sales Report', icon: '📊' },
    { value: 'stock-movement', label: 'Stock Movement/History', icon: '🔄' },
    { value: 'inventory', label: 'Inventory Report', icon: '📦' },
    { value: 'stock-valuation', label: 'Stock Valuation', icon: '💲' },
    { value: 'low-stock', label: 'Low Stock/Out-of-Stock', icon: '⚠️' },
    { value: 'top-products', label: 'Top/Bottom Products', icon: '🏆' },
    { value: 'purchases', label: 'Purchases Report', icon: '🛒' },
    { value: 'expenses', label: 'Expenses Report', icon: '💰' },
    { value: 'profit-loss', label: 'Profit & Loss', icon: '📈' },
    { value: 'tax', label: 'Tax Report', icon: '🏛️' },
  ];

  // State for stock valuation method
  const [valuationMethod, setValuationMethod] = useState('fifo');
  // Table columns for stock movement (define at top level, not using safeRows)
  const stockMovementColumns = [
    { id: 'date', label: 'Date', format: (value) => value ? new Date(value).toLocaleDateString() : '' },
    { id: 'product_name', label: 'Product' },
    { id: 'store_name', label: 'Store' },
    { id: 'type', label: 'Type' },
    { id: 'direction', label: 'Direction' },
    { id: 'qty', label: 'Qty' },
    { id: 'ref', label: 'Reference' },
  ];

  // ...existing code...

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
      let url;
      if (reportType === 'top-products') {
        url = `/api/reports/top-products?startDate=${formatDate(dateRange.startDate)}&endDate=${formatDate(dateRange.endDate)}&limit=10&type=${topBottomType}`;
      } else if (reportType === 'stock-valuation') {
        url = `/api/reports/stock-valuation?method=${valuationMethod}`;
      } else {
        url = `/api/reports/${reportType}?startDate=${formatDate(dateRange.startDate)}&endDate=${formatDate(dateRange.endDate)}`;
      }
      const token = localStorage.getItem('token');
      const res = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'API error');
      setReportData({
        ...result.data,
        title: reportType === 'stock-valuation'
          ? `Stock Valuation (${valuationMethod.toUpperCase()})`
          : (reportType === 'top-products'
            ? (topBottomType === 'top' ? 'Top' : 'Bottom') + ' Products'
            : reportType.charAt(0).toUpperCase() + reportType.slice(1) + ' Report'),
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError('Failed to generate report. Please try again.');
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };
  // Table columns for stock valuation
  const stockValuationColumns = [
    { id: 'product_no', label: 'Product No' },
    { id: 'product_name', label: 'Product Name' },
    { id: 'stock', label: 'Stock' },
    { id: 'valuation', label: 'Valuation', format: (v) => `$${v}` },
    { id: 'method', label: 'Method' },
  ];
  // ...existing code...

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
      // Table View for Stock Movement
      if (!isChartView && reportData) {
        return (
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer component={Paper} elevation={0} variant="outlined">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {stockMovementColumns.map((column) => (
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
                      <TableRow hover key={row._id || idx}>
                        {stockMovementColumns.map((column) => {
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
        );
      }
      return null;
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
  // Top/Bottom Products Report
  if (reportType === 'top-products') {
    const safeRows = reportData && Array.isArray(reportData.rows) ? reportData.rows : [];
    // Chart data
    const chartData = safeRows.map(row => ({
      name: row.product_name || row.product_no,
      qty: row.qty,
      amount: row.amount,
    }));
    return (
      <>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => setTopBottomType('top')}
              variant={topBottomType === 'top' ? 'contained' : 'outlined'}
            >Top Products</Button>
            <Button
              onClick={() => setTopBottomType('bottom')}
              variant={topBottomType === 'bottom' ? 'contained' : 'outlined'}
            >Bottom Products</Button>
          </ButtonGroup>
        </Box>
        {/* Chart */}
        <Box sx={{ mb: 4, width: '100%', height: 350, background: '#fafbfc', borderRadius: 2, p: 2 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#8884d8" />
                <YAxis stroke="#8884d8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="qty" name="Quantity Sold" fill="#8884d8" />
                <Bar dataKey="amount" name="Total Sales" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography color="text.secondary">No product sales data available for chart.</Typography>
          )}
        </Box>
        {/* Table */}
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Quantity Sold</TableCell>
                  <TableCell>Total Sales</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {safeRows.map((row, idx) => (
                  <TableRow hover key={row.product_no || idx}>
                    <TableCell>{row.product_name || row.product_no}</TableCell>
                    <TableCell>{row.qty}</TableCell>
                    <TableCell>{row.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </>
    );
  }
  if (!reportData) return null;
  const isChartView = viewType === 'chart';
  const safeRows = reportData && Array.isArray(reportData.rows) ? reportData.rows : [];

  // Stock Movement Report
  if (reportType === 'stock-movement') {
    let chartData = [];
    if (isChartView) {
      const dateMap = {};
      safeRows.forEach(row => {
        const date = row.date ? new Date(row.date).toLocaleDateString() : '-';
        if (!dateMap[date]) dateMap[date] = { date, inbound: 0, outbound: 0 };
        if (row.direction === 'Inbound') dateMap[date].inbound += Number(row.qty) || 0;
        if (row.direction === 'Outbound') dateMap[date].outbound += Number(row.qty) || 0;
      });
      chartData = Object.entries(dateMap).map(([date, vals]) => ({ date, ...vals })).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    // Chart View for Stock Movement
    if (isChartView) {
      return (
        <Box sx={{ mb: 4, width: '100%', height: 350, background: '#fafbfc', borderRadius: 2, p: 2 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="date" stroke="#8884d8" />
                <YAxis stroke="#8884d8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="inbound" name="Inbound" fill="#8884d8" />
                <Bar dataKey="outbound" name="Outbound" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography color="text.secondary">No stock movement data available for chart.</Typography>
          )}
        </Box>
      );
    }

    // Simple error boundary for this component
  }
  // Purchases Report
  if (reportType === 'purchases') {
    let chartData = [];
    if (isChartView) {
      const dateMap = {};
      safeRows.forEach(row => {
        const date = row.created_at ? new Date(row.created_at).toLocaleDateString() : '-';
        if (!dateMap[date]) dateMap[date] = { date, total: 0, amount: 0 };
        dateMap[date].total += 1;
        dateMap[date].amount += Number(row.amount) || 0;
      });
      chartData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    // Table View for Purchases
    if (!isChartView && reportData) {
      return (
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
      );
    }
    // Chart View for Purchases
    if (isChartView) {
      return (
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
      );
    }
  }
  // Expenses Report
  if (reportType === 'expenses') {
    let chartData = [];
    if (isChartView) {
      const dateMap = {};
      safeRows.forEach(row => {
        const date = row.date ? new Date(row.date).toLocaleDateString() : (row.expense_date ? new Date(row.expense_date).toLocaleDateString() : '-');
        if (!dateMap[date]) dateMap[date] = { date, total: 0, amount: 0 };
        dateMap[date].total += 1;
        dateMap[date].amount += Number(row.amount) || 0;
      });
      chartData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    // Table View for Expenses
    if (!isChartView && reportData) {
      return (
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
      );
    }
    // Chart View for Expenses
    if (isChartView) {
      return (
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
      );
    }
  }
  // Low Stock Table View (no chart)
  if (!isChartView && reportType === 'low-stock' && reportData) {
    return (
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {lowStockColumns.map((column) => (
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
                  <TableRow hover key={row.product_no || idx}>
                    {lowStockColumns.map((column) => {
                      let value = row[column.id];
                      if (column.id === 'status') {
                        value = row.stock <= row.minStock ? 'Low Stock' : 'OK';
                        if (row.stock === 0) value = 'Out of Stock';
                      }
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
    );
  }
  // Stock Valuation Table View
  if (reportType === 'stock-valuation' && reportData) {
    return (
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {stockValuationColumns.map((column) => (
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
                  <TableRow hover key={row.product_no || idx}>
                    {stockValuationColumns.map((column) => {
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
    );
  }
  // Default fallback for report types not yet implemented
  return null;
}

// Render summary cards based on report type
const renderSummaryCards = (reportType, reportData) => {
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
                  <LineChartIcon />
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
  {reportData && renderSummaryCards(reportType, reportData)}

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
            
            {renderReportContent()}

            {/* TODO: Add actual report content based on reportType */}
          </Paper>
        </motion.div>
      )}
    </Box>
  );
}
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
