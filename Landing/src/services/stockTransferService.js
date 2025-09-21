import axios from 'axios';

const API_URL = '/api/stock-transfers';

// Helper to get token and set headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Handle errors (401/403)
const handleApiError = (err) => {
  if (err.response && (err.response.status === 401 || err.response.status === 403)) {
    // Optionally redirect to login or show message
    window.location.href = '/login';
    throw new Error('Unauthorized. Please login again.');
  }
  throw err;
};

export const createStockTransfer = async (data) => {
  try {
    const res = await axios.post(API_URL, data, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
};

export const getStockTransfers = async () => {
  try {
    const res = await axios.get(API_URL, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
};

// Export stock transfers to Excel
export const exportStockTransfers = async () => {
  try {
    const response = await axios.get(`${API_URL}/export`, {
      headers: getAuthHeaders(),
      responseType: 'blob'
    });
    return response.data;
  } catch (err) {
    handleApiError(err);
  }
};

// Import stock transfers from Excel
export const importStockTransfers = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_URL}/import`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (err) {
    handleApiError(err);
  }
};

// Download template for stock transfers
export const downloadTemplate = async () => {
  try {
    const response = await axios.get(`${API_URL}/template`, {
      headers: getAuthHeaders(),
      responseType: 'blob'
    });
    return response.data;
  } catch (err) {
    handleApiError(err);
  }
};