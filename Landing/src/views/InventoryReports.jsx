import React, { useState, useEffect } from 'react';
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
  Warning as WarningIcon
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const InventoryReports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

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
            const currentStock = item.current_stock || 0;
            const retailPrice = parseFloat(item.retail_price || 0);
            const costPrice = parseFloat(item.cost_price || 0);
            const totalValue = currentStock * retailPrice;
            const stockStatus = currentStock <= (item.min_stock || 0) ? 'Low' : 'Normal';
            
            const rowData = [
              item.store_name || '',
              item.product_name || '',
              item.category || '',
              currentStock.toString(),
              (item.min_stock || 0).toString(),
              `$${retailPrice.toFixed(2)}`,
              `$${costPrice.toFixed(2)}`,
              `$${totalValue.toFixed(2)}`,
              stockStatus
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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Products
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(summary.total_products)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {summary.total_categories} categories
                  </Typography>
                </Box>
                <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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
                    Total Stock Units
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(summary.total_stock_units)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Across {summary.total_stores} stores
                  </Typography>
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
                    Total Retail Value
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(summary.total_retail_value)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Cost: {formatCurrency(summary.total_cost_value)}
                  </Typography>
                </Box>
                <ValueIcon sx={{ fontSize: 40, color: 'success.main' }} />
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
                    Average Margin
                  </Typography>
                  <Typography variant="h4">
                    {formatPercentage(summary.average_margin_percentage)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Potential profit: {formatCurrency(summary.total_potential_profit)}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main' }} />
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
            <TextField
              fullWidth
              size="small"
              label="Store No"
              value={filters.store_no}
              onChange={(e) => handleFilterChange('store_no', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Category"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Stock Status</InputLabel>
              <Select
                value={filters.stock_status}
                label="Stock Status"
                onChange={(e) => handleFilterChange('stock_status', e.target.value)}
              >
                {stockStatusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Min Stock"
              type="number"
              value={filters.min_stock}
              onChange={(e) => handleFilterChange('min_stock', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Max Stock"
              type="number"
              value={filters.max_stock}
              onChange={(e) => handleFilterChange('max_stock', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Min Value"
              type="number"
              value={filters.min_value}
              onChange={(e) => handleFilterChange('min_value', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Max Value"
              type="number"
              value={filters.max_value}
              onChange={(e) => handleFilterChange('max_value', e.target.value)}
            />
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
      
      {reportData?.grouped_data && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Inventory Distribution by {filters.groupBy}
            </Typography>
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
          </CardContent>
        </Card>
      )}

      {reportData?.summary?.stock_status_breakdown && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Stock Status Distribution
                </Typography>
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
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Stock Efficiency Metrics
                </Typography>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h3" color="primary" gutterBottom>
                    {formatPercentage(reportData.summary.stock_efficiency)}
                  </Typography>
                  <Typography variant="body1" color="textSecondary" gutterBottom>
                    Stock Efficiency Rate
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="h6" color="success.main">
                        {formatNumber(reportData.summary.stock_status_breakdown.in_stock)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        In Stock
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6" color="error.main">
                        {formatNumber(reportData.summary.stock_status_breakdown.out_of_stock)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Out of Stock
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
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
          Detailed Inventory Analysis
        </Typography>
        
        {reportData?.inventory && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Cost Value</TableCell>
                  <TableCell>Retail Value</TableCell>
                  <TableCell>Margin %</TableCell>
                  <TableCell>Potential Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.inventory
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow key={item.product_no}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {item.product_name || item.product_no}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.product_no}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{item.category || 'N/A'}</TableCell>
                      <TableCell>{formatNumber(item.storing_balance)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.stock_status?.replace('_', ' ') || 'unknown'} 
                          size="small"
                          color={getStockStatusColor(item.stock_status)}
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(item.total_cost_value)}</TableCell>
                      <TableCell>{formatCurrency(item.total_retail_value)}</TableCell>
                      <TableCell>{formatPercentage(item.margin_percentage)}</TableCell>
                      <TableCell>{formatCurrency(item.potential_profit)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={reportData.inventory.length}
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
          {/* Highest Value Products */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  💎 Highest Value Products
                </Typography>
                {reportData.topPerformers.highest_value_products?.length > 0 ? (
                  <Box>
                    {reportData.topPerformers.highest_value_products.map((product, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: index < reportData.topPerformers.highest_value_products.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {product.product_name || `Product ${product.product_no}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.stock_units} units • {product.margin_percentage}% margin
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${Number(product.retail_value || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No high-value product data available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Highest Margin Products */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  📈 Highest Margin Products
                </Typography>
                {reportData.topPerformers.highest_margin_products?.length > 0 ? (
                  <Box>
                    {reportData.topPerformers.highest_margin_products.map((product, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: index < reportData.topPerformers.highest_margin_products.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {product.product_name || `Product ${product.product_no}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ${Number(product.potential_profit || 0).toLocaleString()} profit
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {product.margin_percentage}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No margin data available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Low Stock Alerts */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  ⚠️ Low Stock Alerts
                </Typography>
                {reportData.topPerformers.low_stock_alerts?.length > 0 ? (
                  <Box>
                    {reportData.topPerformers.low_stock_alerts.map((product, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: index < reportData.topPerformers.low_stock_alerts.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {product.product_name || `Product ${product.product_no}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.category || 'No category'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                            {product.current_stock} units
                          </Typography>
                          <Chip 
                            label={product.stock_status?.replace('_', ' ') || 'unknown'} 
                            size="small"
                            color={product.stock_status === 'out_of_stock' ? 'error' : 'warning'}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No low stock alerts</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Performance Charts */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Top Products by Value</Typography>
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
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderAnalyticsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Value vs Stock Analysis
            </Typography>
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
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Margin Distribution
            </Typography>
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
          </CardContent>
        </Card>
      </Grid>
    </Grid>
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
              Inventory Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enterprise-level inventory analytics and reporting
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
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Detailed Analysis" />
            <Tab label="Top Performers" />
            <Tab label="Analytics" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {activeTab === 0 && renderOverviewTab()}
        {activeTab === 1 && renderDetailedAnalysisTab()}
        {activeTab === 2 && renderTopPerformersTab()}
        {activeTab === 3 && renderAnalyticsTab()}
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default InventoryReports;
