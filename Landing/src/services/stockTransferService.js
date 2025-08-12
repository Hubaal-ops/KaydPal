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