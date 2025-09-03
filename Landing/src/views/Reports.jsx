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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { motion } from 'framer-motion';

// Utility: Filter inventory rows (currently passthrough, can be extended)
function getFilteredInventoryRows(rows) {
  return rows || [];
}

// Placeholder for inventory filters UI
function renderInventoryFilters() {
  return null;
}

// Placeholder for inventory chart UI
function renderInventoryChart() {
  return null;
}

// Placeholder for inventory table UI
function renderInventoryTable({
  reportType,
  reportData,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage
}) {
  // --- Professional Table Section for Reports ---
  // This is a generic table renderer for all report types
  // Uses Material-UI Table components, supports pagination, dynamic columns, and rows
  // Integrates with reportData and adapts to reportType
  // (Charts and drill-down integration will be added below this section)
  const columns = (() => {
    switch (reportType) {
      case 'sales': return salesColumns;
      case 'purchases': return purchaseColumns;
      case 'inventory': return lowStockColumns;
      case 'expenses': return expenseColumns;
      default: return salesColumns;
    }
  })();
  const rows = reportData && Array.isArray(reportData.rows) ? reportData.rows : [];
  if (!rows.length) {
    return <Typography sx={{ mt: 3, mb: 2 }} color="text.secondary">No data available for this report.</Typography>;
  }
  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map(col => (
              <TableCell key={col.id}>{col.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
            <TableRow hover key={row.id || row._id || idx}>
              {columns.map(col => (
                <TableCell key={col.id}>
                  {col.format ? col.format(row[col.id]) : row[col.id] ?? ''}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </TableContainer>
  );
}

// --- PROFESSIONAL REPORTS PAGE STRUCTURE ---
// 1. Summary Cards Section
// 2. Filters Section (date range, dropdowns, search)
// 3. Export Buttons Section (CSV, Excel, PDF)
// 4. Charts Section (bar, line, pie, etc.)
// 5. Detailed Table Section (with pagination, sorting)
// 6. Drill-down/Details Section (future)
// Each section will be implemented for all report types.
// --------------------------------------------

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
    { value: 'sales-advanced', label: 'Advanced Sales Analytics', icon: '📈' },
    { value: 'purchases-advanced', label: 'Advanced Purchase Analytics', icon: '🛍️' },
    { value: 'inventory-advanced', label: 'Advanced Inventory Analytics', icon: '📊' },
    { value: 'financial-advanced', label: 'Advanced Financial Analytics', icon: '💰' },
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
      
      // Handle enterprise analytics redirects
      if (reportType === 'sales-advanced') {
        window.location.href = '/reports/sales-advanced';
        return;
      }
      if (reportType === 'purchases-advanced') {
        window.location.href = '/reports/purchases-advanced';
        return;
      }
      if (reportType === 'inventory-advanced') {
        window.location.href = '/reports/inventory-advanced';
        return;
      }
      if (reportType === 'financial-advanced') {
        window.location.href = '/reports/financial-advanced';
        return;
      }
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
      let rows = [];
      if (reportType === 'inventory') {
        const safeRows = reportData && Array.isArray(reportData.rows) ? reportData.rows : [];
        rows = getFilteredInventoryRows(safeRows);
      } else {
        rows = reportData && Array.isArray(reportData.rows) ? reportData.rows : [];
      }
      // --- CSV Export ---
      if (format === 'csv') {
        const headers = Object.keys(rows[0] || {});
        const csv = [headers.join(',')].concat(rows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        saveAs(blob, `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
      }
      // --- XLSX Export ---
      else if (format === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        saveAs(blob, `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
      // --- PDF Export ---
      else if (format === 'pdf') {
        const doc = new jsPDF();
        doc.text(`${reportData.title || 'Inventory Report'}`, 14, 16);
        doc.text(`Date Range: ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}`, 14, 24);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
        const headers = [Object.keys(rows[0] || {})];
        const data = rows.map(row => headers[0].map(h => row[h] ?? ''));
        doc.autoTable({ head: headers, body: data, startY: 40, styles: { fontSize: 8 } });
        doc.save(`${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (err) {
      setError('Failed to export report. Please try again.');
      console.error('Error exporting report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render the main report content (charts and tables)
  const renderReportContent = () => {
    // Default fallback for report types not yet implemented
    return null;
  }

  // Render summary cards based on report type
  const renderSummaryCards = (reportType, reportData) => {
    if (!reportData?.summary) return null;
    const summaryItems = [];
    const summaryData = reportData.summary;
    switch (reportType) {
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

    </Box>
  );
}
// Error Boundary component
class ReportsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Reports Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, color: 'error.main', textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong in the Reports page.
          </Typography>
          <Typography variant="body2" color="error" gutterBottom>
            {this.state.error?.message || 'An unknown error occurred'}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => this.setState({ hasError: false, error: null })}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Wrap the Reports component with the error boundary
const ReportsWithErrorBoundary = (props) => (
  <ReportsErrorBoundary>
    <Reports {...props} />
  </ReportsErrorBoundary>
);

export default ReportsWithErrorBoundary;
