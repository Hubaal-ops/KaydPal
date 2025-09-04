import React, { useState, useEffect } from 'react';
import styles from './InventoryReports.module.css';
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
  useMediaQuery
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
  Store as StoreIcon,
  Category as CategoryIcon,
  AttachMoney as ValueIcon,
  Warning as WarningIcon,
  ArrowLeft
} from '@mui/icons-material';
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
  ScatterChart,
  Scatter
} from 'recharts';
import { generateAdvancedInventoryReport } from '../services/reportService';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const InventoryReports = () => {
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
    store_no: '',
    category: '',
    stock_status: '',
    min_stock: '',
    max_stock: '',
    min_value: '',
    max_value: '',
    min_margin: '',
    max_margin: '',
    groupBy: 'category',
    sortBy: 'total_retail_value',
    sortOrder: 'desc',
    page: 1,
    limit: 100
  });

  const stockStatusOptions = [
    { value: '', label: 'All Stock Status' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'overstocked', label: 'Overstocked' }
  ];

  const groupByOptions = [
    { value: 'category', label: 'Category' },
    { value: 'status', label: 'Stock Status' },
    { value: 'store', label: 'Store' }
  ];

  const sortOptions = [
    { value: 'total_retail_value', label: 'Retail Value' },
    { value: 'storing_balance', label: 'Stock Quantity' },
    { value: 'margin_percentage', label: 'Margin %' },
    { value: 'product_name', label: 'Product Name' }
  ];

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await generateAdvancedInventoryReport(filters);
      if (response.success) {
        setReportData(response.data);
      } else {
        setError(response.message || 'Failed to generate inventory report');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while generating the report');
      console.error('Inventory report error:', err);
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

  const handleExport = async (format) => {
    try {
      setLoading(true);
      
      if (format === 'pdf') {
        // Handle PDF export using frontend generation
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(18);
        doc.text('Inventory Report', 20, 20);
        
        // Add generation date
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
        
        // Add filter info if any
        const activeFilters = [];
        if (filters.store_no) activeFilters.push(`Store: ${filters.store_no}`);
        if (filters.category) activeFilters.push(`Category: ${filters.category}`);
        if (filters.stock_status) activeFilters.push(`Status: ${filters.stock_status}`);
        
        if (activeFilters.length > 0) {
          doc.text(`Filters: ${activeFilters.join(', ')}`, 20, 45);
        }
        
        // Create table for inventory data
        if (reportData?.inventory && reportData.inventory.length > 0) {
          let yPos = 65;
          
          // Table headers
          const headers = ['Store', 'Product', 'Category', 'Stock', 'Min Stock', 'Retail Price', 'Cost Price', 'Total Value', 'Status'];
          const colWidths = [20, 28, 20, 12, 15, 18, 16, 18, 13];
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
          reportData.inventory.slice(0, 25).forEach((item, rowIndex) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            
            xPos = startX;
            const currentStock = item.storing_balance || 0;
            const retailPrice = parseFloat(item.price || 0);
            const costPrice = parseFloat(item.cost || 0);
            const totalValue = currentStock * retailPrice;
            const stockStatus = currentStock <= (item.min_stock || 0) ? 'Low' : 'Normal';
            
            // Get store information from store_breakdown or use 'All Stores' if not available
            let storeInfo = 'N/A';
            if (item.store_breakdown && item.store_breakdown.length > 0) {
              storeInfo = item.store_breakdown.map(store => store.store_name).join(', ');
            } else if (reportData.metadata && reportData.metadata.total_stores) {
              storeInfo = `${reportData.metadata.total_stores} stores`;
            }
            
            const rowData = [
              storeInfo,
              item.product_name || item.product_no || '',
              item.category || '',
              currentStock.toString(),
              (item.min_stock || 0).toString(),
              `$${retailPrice.toFixed(2)}`,
              `$${costPrice.toFixed(2)}`,
              `$${totalValue.toFixed(2)}`,
              item.stock_status?.replace('_', ' ') || stockStatus
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
        doc.save(`inventory_report_${new Date().toISOString().split('T')[0]}.pdf`);
        return;
      }
      
      const queryParams = new URLSearchParams({
        format,
        store_no: filters.store_no,
        category: filters.category,
        min_stock: filters.min_stock,
        max_stock: filters.max_stock,
        stock_status: filters.stock_status,
        min_value: filters.min_value,
        max_value: filters.max_value
      });

      // Remove empty parameters
      for (const [key, value] of [...queryParams.entries()]) {
        if (!value || value === 'undefined' || value === 'null') {
          queryParams.delete(key);
        }
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/inventory/export?${queryParams}`, {
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
      a.download = `inventory_report_${new Date().toISOString().split('T')[0]}.${format}`;
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

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out_of_stock': return 'error';
      case 'low_stock': return 'warning';
      case 'in_stock': return 'success';
      case 'overstocked': return 'info';
      default: return 'default';
    }
  };

  const renderSummaryCards = () => {
    if (!reportData?.summary) return null;

    const { summary } = reportData;

    return (
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div>
              <div className={styles.summaryTitle}>Total Products</div>
              <div className={styles.summaryValue}>{formatNumber(summary.total_products)}</div>
            </div>
            <div className={styles.iconContainer}>
              <InventoryIcon sx={{ fontSize: 24, color: 'white' }} />
            </div>
          </div>
          <div className={styles.summaryCompare}>
            <span>{summary.total_categories} categories</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div>
              <div className={styles.summaryTitle}>Total Stock Units</div>
              <div className={styles.summaryValue}>{formatNumber(summary.total_stock_units)}</div>
            </div>
            <div className={styles.iconContainer}>
              <StoreIcon sx={{ fontSize: 24, color: 'white' }} />
            </div>
          </div>
          <div className={styles.summaryCompare}>
            <span>Across {summary.total_stores} stores</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div>
              <div className={styles.summaryTitle}>Total Retail Value</div>
              <div className={styles.summaryValue}>{formatCurrency(summary.total_retail_value)}</div>
            </div>
            <div className={styles.iconContainer}>
              <ValueIcon sx={{ fontSize: 24, color: 'white' }} />
            </div>
          </div>
          <div className={styles.summaryCompare}>
            <span>Cost: {formatCurrency(summary.total_cost_value)}</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div>
              <div className={styles.summaryTitle}>Average Margin</div>
              <div className={styles.summaryValue}>{formatPercentage(summary.average_margin_percentage)}</div>
            </div>
            <div className={styles.iconContainer}>
              <TrendingUpIcon sx={{ fontSize: 24, color: 'white' }} />
            </div>
          </div>
          <div className={styles.summaryCompare}>
            <span>Potential profit: {formatCurrency(summary.total_potential_profit)}</span>
          </div>
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
          <TextField
            fullWidth
            size="small"
            label="Category"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <TextField
            select
            fullWidth
            size="small"
            label="Stock Status"
            value={filters.stock_status}
            onChange={(e) => handleFilterChange('stock_status', e.target.value)}
            className={styles.filterSelect}
          >
            {stockStatusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </div>

        <div className={styles.filterGroup}>
          <TextField
            fullWidth
            size="small"
            label="Min Stock"
            type="number"
            value={filters.min_stock}
            onChange={(e) => handleFilterChange('min_stock', e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <TextField
            fullWidth
            size="small"
            label="Max Stock"
            type="number"
            value={filters.max_stock}
            onChange={(e) => handleFilterChange('max_stock', e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <TextField
            fullWidth
            size="small"
            label="Min Value"
            type="number"
            value={filters.min_value}
            onChange={(e) => handleFilterChange('min_value', e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <TextField
            fullWidth
            size="small"
            label="Max Value"
            type="number"
            value={filters.max_value}
            onChange={(e) => handleFilterChange('max_value', e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <TextField
            select
            fullWidth
            size="small"
            label="Group By"
            value={filters.groupBy}
            onChange={(e) => handleFilterChange('groupBy', e.target.value)}
            className={styles.filterSelect}
          >
            {groupByOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </div>

        <div className={styles.filterGroup}>
          <TextField
            select
            fullWidth
            size="small"
            label="Sort By"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className={styles.filterSelect}
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </div>
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
      
      {reportData?.grouped_data && (
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            Inventory Distribution by {filters.groupBy}
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.grouped_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="group_name" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value, name) => [
                    name === 'total_retail_value' ? formatCurrency(value) : formatNumber(value),
                    name === 'total_retail_value' ? 'Retail Value' : 
                    name === 'product_count' ? 'Products' : 
                    name === 'total_stock_units' ? 'Stock Units' : name
                  ]}
                />
                <Legend />
                <Bar dataKey="total_retail_value" fill="#8884d8" name="Retail Value" />
                <Bar dataKey="product_count" fill="#82ca9d" name="Products" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {reportData?.summary?.stock_status_breakdown && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              Stock Status Distribution
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(reportData.summary.stock_status_breakdown).map(([key, value]) => ({
                      name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                      value
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {Object.entries(reportData.summary.stock_status_breakdown).map((entry, index) => (
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
              Stock Efficiency Metrics
            </div>
            <div className={styles.chartContainer}>
              <div style={{ padding: '1rem' }}>
                <Typography variant="h3" color="primary" gutterBottom style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                  {formatPercentage(reportData.summary.stock_efficiency)}
                </Typography>
                <Typography variant="body1" color="textSecondary" gutterBottom style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Stock Efficiency Rate
                </Typography>
                <Divider sx={{ my: 2 }} style={{ margin: '1rem 0' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <Typography variant="h6" style={{ color: 'var(--success-color)', marginBottom: '0.25rem' }}>
                      {formatNumber(reportData.summary.stock_status_breakdown.in_stock)}
                    </Typography>
                    <Typography variant="body2" style={{ color: 'var(--text-secondary)' }}>
                      In Stock
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="h6" style={{ color: 'var(--error-color)', marginBottom: '0.25rem' }}>
                      {formatNumber(reportData.summary.stock_status_breakdown.out_of_stock)}
                    </Typography>
                    <Typography variant="body2" style={{ color: 'var(--text-secondary)' }}>
                      Out of Stock
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailedAnalysisTab = () => (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        Detailed Inventory Analysis
      </div>
      
      {reportData?.inventory && (
        <div className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th className={styles.tableHeadCell}>Store</th>
                <th className={styles.tableHeadCell}>Product</th>
                <th className={styles.tableHeadCell}>Category</th>
                <th className={styles.tableHeadCell}>Stock</th>
                <th className={styles.tableHeadCell}>Status</th>
                <th className={styles.tableHeadCell}>Cost Value</th>
                <th className={styles.tableHeadCell}>Retail Value</th>
                <th className={styles.tableHeadCell}>Margin %</th>
                <th className={styles.tableHeadCell}>Potential Profit</th>
              </tr>
            </thead>
            <tbody>
              {reportData.inventory
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item) => (
                  <tr className={styles.tableRow} key={item.product_no}>
                    <td className={styles.tableCell}>
                      {item.store_breakdown && item.store_breakdown.length > 0 
                        ? item.store_breakdown.map(store => store.store_name).join(', ') 
                        : (reportData.metadata && reportData.metadata.total_stores ? 
                            `${reportData.metadata.total_stores} stores` : 'N/A')}
                    </td>
                    <td className={styles.tableCell}>
                      <div>
                        <Typography variant="subtitle2">
                          {item.product_name || item.product_no}
                        </Typography>
                        <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>
                          {item.product_no}
                        </Typography>
                      </div>
                    </td>
                    <td className={styles.tableCell}>{item.category || 'N/A'}</td>
                    <td className={styles.tableCell}>{formatNumber(item.storing_balance)}</td>
                    <td className={styles.tableCell}>
                      <Chip 
                        label={item.stock_status?.replace('_', ' ') || 'unknown'} 
                        size="small"
                        color={getStockStatusColor(item.stock_status)}
                      />
                    </td>
                    <td className={styles.tableCell}>{formatCurrency(item.total_cost_value)}</td>
                    <td className={styles.tableCell}>{formatCurrency(item.total_retail_value)}</td>
                    <td className={styles.tableCell}>{formatPercentage(item.margin_percentage)}</td>
                    <td className={styles.tableCell}>{formatCurrency(item.potential_profit)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={reportData.inventory.length}
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
          {/* Highest Value Products */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              💎 Highest Value Products
            </div>
            {reportData.topPerformers.highest_value_products?.length > 0 ? (
              <div>
                {reportData.topPerformers.highest_value_products.map((product, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.75rem 0',
                      borderBottom: index < reportData.topPerformers.highest_value_products.length - 1 ? '1px solid var(--border)' : 'none'
                    }}
                  >
                    <div>
                      <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                        {product.product_name || `Product ${product.product_no}`}
                      </Typography>
                      <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>
                        {product.stock_units} units • {product.margin_percentage}% margin
                      </Typography>
                    </div>
                    <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                      ${Number(product.retail_value || 0).toLocaleString()}
                    </Typography>
                  </div>
                ))}
              </div>
            ) : (
              <Typography variant="body2" style={{ color: 'var(--text-secondary)', padding: '1rem' }}>
                No high-value product data available
              </Typography>
            )}
          </div>
          
          {/* Highest Margin Products */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              📈 Highest Margin Products
            </div>
            {reportData.topPerformers.highest_margin_products?.length > 0 ? (
              <div>
                {reportData.topPerformers.highest_margin_products.map((product, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.75rem 0',
                      borderBottom: index < reportData.topPerformers.highest_margin_products.length - 1 ? '1px solid var(--border)' : 'none'
                    }}
                  >
                    <div>
                      <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                        {product.product_name || `Product ${product.product_no}`}
                      </Typography>
                      <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>
                        ${Number(product.potential_profit || 0).toLocaleString()} profit
                      </Typography>
                    </div>
                    <Typography variant="body2" style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>
                      {product.margin_percentage}%
                    </Typography>
                  </div>
                ))}
              </div>
            ) : (
              <Typography variant="body2" style={{ color: 'var(--text-secondary)', padding: '1rem' }}>
                No margin data available
              </Typography>
            )}
          </div>
          
          {/* Low Stock Alerts */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              ⚠️ Low Stock Alerts
            </div>
            {reportData.topPerformers.low_stock_alerts?.length > 0 ? (
              <div>
                {reportData.topPerformers.low_stock_alerts.map((product, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.75rem 0',
                      borderBottom: index < reportData.topPerformers.low_stock_alerts.length - 1 ? '1px solid var(--border)' : 'none'
                    }}
                  >
                    <div>
                      <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                        {product.product_name || `Product ${product.product_no}`}
                      </Typography>
                      <Typography variant="caption" style={{ color: 'var(--text-secondary)' }}>
                        {product.category || 'No category'}
                      </Typography>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Typography variant="body2" style={{ fontWeight: 'bold', color: 'var(--warning-color)' }}>
                        {product.current_stock} units
                      </Typography>
                      <Chip 
                        label={product.stock_status?.replace('_', ' ') || 'unknown'} 
                        size="small"
                        color={product.stock_status === 'out_of_stock' ? 'error' : 'warning'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Typography variant="body2" style={{ color: 'var(--text-secondary)', padding: '1rem' }}>
                No low stock alerts
              </Typography>
            )}
          </div>
          
          {/* Performance Charts */}
          <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
            <div className={styles.chartHeader}>Top Products by Value</div>
            <div className={styles.chartContainer}>
              {reportData.topPerformers.highest_value_products?.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.topPerformers.highest_value_products.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="product_name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => [`$${value}`, 'Value']} />
                    <Bar dataKey="retail_value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalyticsTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          Value vs Stock Analysis
        </div>
        <div className={styles.chartContainer}>
          {reportData?.inventory && (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={reportData.inventory.slice(0, 50)}>
                <CartesianGrid />
                <XAxis 
                  type="number" 
                  dataKey="storing_balance" 
                  name="Stock Units"
                  tickFormatter={formatNumber}
                />
                <YAxis 
                  type="number" 
                  dataKey="total_retail_value" 
                  name="Retail Value"
                  tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
                />
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => [
                    name === 'total_retail_value' ? formatCurrency(value) : formatNumber(value),
                    name === 'total_retail_value' ? 'Retail Value' : 'Stock Units'
                  ]}
                />
                <Scatter dataKey="total_retail_value" fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          Margin Distribution
        </div>
        <div className={styles.chartContainer}>
          {reportData?.inventory && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={reportData.inventory
                  .filter(item => parseFloat(item.margin_percentage) > 0)
                  .slice(0, 10)
                  .sort((a, b) => parseFloat(b.margin_percentage) - parseFloat(a.margin_percentage))
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="product_name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <RechartsTooltip 
                  formatter={(value) => [`${parseFloat(value).toFixed(2)}%`, 'Margin']}
                />
                <Bar dataKey="margin_percentage" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className={styles.inventoryReports}>
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
      <div className={styles.inventoryReports}>
        {/* Header */}
        <div className={styles.inventoryReportsHeader}>
          <button className={styles.backButton} onClick={handleBackClick}>
            <ArrowLeft size={20} />
            Back to Reports
          </button>
          <h1>Inventory Reports</h1>
          <p>Enterprise-level inventory analytics and reporting</p>
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

        <div className={styles.inventoryReportsContent}>
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
              Analytics
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 0 && renderOverviewTab()}
          {activeTab === 1 && renderDetailedAnalysisTab()}
          {activeTab === 2 && renderTopPerformersTab()}
          {activeTab === 3 && renderAnalyticsTab()}
          
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

export default InventoryReports;