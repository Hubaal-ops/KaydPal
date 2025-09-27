import React, { useState } from 'react';
import styles from './Reports.module.css';
import {
  Box, Typography, Paper, Button, Grid, TextField, MenuItem, Select, FormControl, InputLabel,
  CircularProgress, useTheme, useMediaQuery, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, IconButton, Tooltip
} from '@mui/material';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { motion } from 'framer-motion';
import { 
  RefreshCw,
  FileText as FilePdf,
  FileSpreadsheet as FileExcel,
  FileDown as CsvIcon,
  BarChart as BarChartIcon,
  Table as TableViewIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Printer as PrintIcon,
  ChevronRight,
  TrendingUp,
  Receipt,
  ShoppingBag,
  Package,
  DollarSign,
  BarChart2,
  Clipboard,
  FileText,
  Calendar,
  ArrowLeft,
  Database
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const Reports = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Report types as cards
  const reportTypes = [
    { 
      id: 'sales-advanced',
      title: 'Advanced Sales Analytics', 
      description: 'Comprehensive analysis of your sales performance, trends, and customer insights',
      icon: TrendingUp,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    { 
      id: 'purchases-advanced',
      title: 'Advanced Purchase Analytics', 
      description: 'Detailed analysis of purchasing patterns, supplier performance, and cost insights',
      icon: ShoppingBag,
      color: '#f43f5e',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)'
    },
    
    { 
      id: 'inventory-advanced-new',
      title: 'Advanced Inventory Analytics', 
      description: 'Advanced inventory analytics with deeper insights, predictive analysis, and optimization recommendations',
      icon: Database,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    },
    { 
      id: 'financial-advanced',
      title: 'Advanced Financial Analytics', 
      description: 'Comprehensive financial reporting, cash flow analysis, and profitability metrics',
      icon: DollarSign,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    }
  ];

  // Handle back button click to return to dashboard
  const handleBackClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className={styles.reports}>
      <div className={styles['reports-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Reports</h1>
        <p>Generate and analyze detailed reports for your business</p>
      </div>
      
      <div className={styles['reports-content']}>
        <div className={styles['modules-grid']}>
          {reportTypes.map((report) => {
            const IconComponent = report.icon;
            return (
              <div
                key={report.id}
                className={styles['module-card']}
                onClick={() => navigate(`/reports/${report.id}`)}
                style={{ '--card-gradient': report.gradient }}
              >
                <div className={styles['card-header']}>
                  <div className={styles['icon-container']} style={{ backgroundColor: report.color }}>
                    <IconComponent size={22} color="white" />
                  </div>
                  <h3>{report.title}</h3>
                </div>
                <p className={styles['card-description']}>{report.description}</p>
                <div className={styles['card-footer']}>
                  <span className={styles['access-text']}>View report</span>
                  <div className={styles['arrow-icon']}>→</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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