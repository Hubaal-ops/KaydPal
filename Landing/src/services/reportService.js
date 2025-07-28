import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api/reports';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

// Generate a report
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

// Get available report types
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

// Export report to different formats
export const exportReport = async (reportType, format, params) => {
  try {
    const response = await axios({
      url: `${API_BASE_URL}/export/${reportType}`,
      method: 'POST',
      data: params,
      responseType: 'blob',
      headers: getAuthHeaders(),
    });
    
    // Create a download link
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
