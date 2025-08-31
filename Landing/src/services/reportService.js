import axios from 'axios';

const API_BASE_URL = '/api/reports';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

// Generate advanced sales report with enterprise features
export const generateAdvancedSalesReport = async (filters = {}) => {
  try {
    console.log('🔍 Generating advanced sales report with filters:', filters);
    
    const params = new URLSearchParams();
    
    // Add all filter parameters
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (key === 'startDate' || key === 'endDate') {
          // Convert date objects to ISO strings
          params.append(key, filters[key] instanceof Date ? filters[key].toISOString() : filters[key]);
        } else {
          params.append(key, filters[key]);
        }
      }
    });
    
    const response = await axios.get(
      `${API_BASE_URL}/sales/advanced?${params.toString()}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('✅ Advanced sales report generated successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error generating advanced sales report:', error);
    throw error.response?.data || error;
  }
};

// Export sales report to different formats
export const exportSalesReport = async (filters = {}, format = 'csv') => {
  try {
    console.log(`🔄 Exporting sales report as ${format}...`);
    
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (key === 'startDate' || key === 'endDate') {
          params.append(key, filters[key] instanceof Date ? filters[key].toISOString() : filters[key]);
        } else {
          params.append(key, filters[key]);
        }
      }
    });
    params.append('format', format);
    
    const response = await axios({
      url: `${API_BASE_URL}/sales/export?${params.toString()}`,
      method: 'GET',
      responseType: format === 'pdf' ? 'json' : 'blob',
      headers: getAuthHeaders(),
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'pdf') {
      // Handle PDF generation on frontend with improved table layout
      const { jsPDF } = await import('jspdf');
      
      const pdfData = response.data;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      
      // Add title and metadata
      doc.setFontSize(16);
      doc.text(pdfData.title || 'Sales Report', 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${pdfData.generated_at}`, 14, 30);
      if (pdfData.period) {
        doc.text(`Period: ${pdfData.period}`, 14, 35);
      }
      
      // Table setup with better column widths for landscape A4 (297mm width)
      const startY = 45;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margins = { left: 10, right: 10 };
      const tableWidth = pageWidth - margins.left - margins.right;
      
      // Define column widths (total should be ≤ tableWidth)
      const columnWidths = [25, 30, 40, 30, 50, 20, 25, 25, 30]; // Adjusted widths
      const headers = pdfData.headers || ['Sale No', 'Date', 'Customer', 'Store', 'Product', 'Qty', 'Unit Price', 'Total', 'Status'];
      
      // Draw table headers with borders
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      let xPos = margins.left;
      let yPos = startY;
      
      // Header background
      doc.setFillColor(240, 240, 240);
      doc.rect(margins.left, yPos - 5, tableWidth, 8, 'F');
      
      // Header text and borders
      headers.forEach((header, index) => {
        if (index < columnWidths.length) {
          // Draw cell border
          doc.setDrawColor(0, 0, 0);
          doc.rect(xPos, yPos - 5, columnWidths[index], 8);
          
          // Add text (truncate if too long)
          const truncatedHeader = header.length > 12 ? header.substring(0, 12) + '...' : header;
          doc.text(truncatedHeader, xPos + 2, yPos);
          xPos += columnWidths[index];
        }
      });
      
      // Data rows
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      yPos += 10;
      
      const dataRows = pdfData.data || [];
      const maxRowsPerPage = Math.floor((doc.internal.pageSize.getHeight() - yPos - 20) / 8);
      
      dataRows.slice(0, maxRowsPerPage).forEach((row, rowIndex) => {
        xPos = margins.left;
        
        // Alternate row background
        if (rowIndex % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margins.left, yPos - 3, tableWidth, 6, 'F');
        }
        
        row.forEach((cell, cellIndex) => {
          if (cellIndex < columnWidths.length) {
            // Draw cell border
            doc.setDrawColor(200, 200, 200);
            doc.rect(xPos, yPos - 3, columnWidths[cellIndex], 6);
            
            // Truncate cell content to fit column width
            let cellText = String(cell || '');
            const maxChars = Math.floor(columnWidths[cellIndex] / 2.5); // Approximate chars per mm
            if (cellText.length > maxChars) {
              cellText = cellText.substring(0, maxChars - 3) + '...';
            }
            
            doc.text(cellText, xPos + 1, yPos);
            xPos += columnWidths[cellIndex];
          }
        });
        
        yPos += 6;
        
        // Check if we need a new page
        if (yPos > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPos = 20;
        }
      });
      
      // Add footer with page info
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
        doc.text(`Total Records: ${dataRows.length}`, margins.left, doc.internal.pageSize.getHeight() - 10);
      }
      
      doc.save(`sales_report_${timestamp}.pdf`);
    } else {
      // Handle other formats (CSV, Excel)
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Set correct file extension based on format
      let fileExtension = format;
      if (format === 'excel') fileExtension = 'xlsx';
      
      link.setAttribute('download', `sales_report_${timestamp}.${fileExtension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
    
    console.log(`✅ Sales report exported as ${format}`);
    return true;
  } catch (error) {
    console.error(`❌ Error exporting sales report as ${format}:`, error);
    throw error.response?.data || error;
  }
};

// Get sales analytics dashboard data
export const getSalesAnalytics = async (period = 'last_30_days') => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/sales/analytics?period=${period}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    throw error.response?.data || error;
  }
};

// Get sales forecasting data
export const getSalesForecasting = async (months = 3) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/sales/forecast?months=${months}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching sales forecasting:', error);
    throw error.response?.data || error;
  }
};

// Legacy functions for backward compatibility
export const generateReport = async (reportType, params) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/${reportType}`,
      params,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

export const getReportTypes = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/types`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching report types:', error);
    throw error;
  }
};

export const exportReport = async (reportType, format, params) => {
  try {
    const response = await axios({
      url: `${API_BASE_URL}/export/${reportType}`,
      method: 'POST',
      data: params,
      responseType: 'blob',
      headers: getAuthHeaders(),
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}_report.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error) {
    console.error('Error exporting report:', error);
    throw error;
  }
};