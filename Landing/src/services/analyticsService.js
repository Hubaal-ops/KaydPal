import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = '/api/analytics';

// Get authentication headers
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Helper to handle API errors
const handleError = (error) => {
  console.error('Analytics API Error:', error);
  const message = error.response?.data?.message || 'Failed to fetch analytics data';
  toast.error(message);
  throw new Error(message);
};

export const fetchAnalytics = async (params = {}) => {
  try {
    // Default to last 30 days if no date range provided
    const defaultParams = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      ...params
    };

    const response = await axios.get(API_URL, { 
      params: defaultParams,
      headers: getAuthHeaders(),
      timeout: 30000 // 30 second timeout
    });
    
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Fetch analytics summary for dashboard cards
export const fetchAnalyticsSummary = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/summary`, { 
      params,
      headers: getAuthHeaders(),
      timeout: 20000 // 20 second timeout
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Export analytics data as CSV
export const exportAnalytics = async (params = {}) => {
  try {
    const response = await axios({
      url: `${API_URL}/export`,
      method: 'GET',
      params,
      headers: getAuthHeaders(),
      responseType: 'blob', // Important for file download
      timeout: 60000 // 60 second timeout for larger exports
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error) {
    return handleError(error);
  }
};
