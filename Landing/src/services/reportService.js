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
      responseType: 'blob',
      headers: getAuthHeaders(),
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `sales_report_${timestamp}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
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
