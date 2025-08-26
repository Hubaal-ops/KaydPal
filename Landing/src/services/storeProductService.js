import axios from 'axios';

const API_URL = '/api/store-products';

// Helper function to get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Handle API errors (401/403)
const handleApiError = (err) => {
  if (err.response && (err.response.status === 401 || err.response.status === 403)) {
    // Optionally redirect to login or show message
    window.location.href = '/login';
    throw new Error('Unauthorized. Please login again.');
  }
  throw err;
};

export const getStoreProducts = async () => {
  try {
    const res = await axios.get(API_URL, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
};

export const getStoreProductById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
};

export const createStoreProduct = async (data) => {
  try {
    const res = await axios.post(API_URL, data, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
};

export const updateStoreProduct = async (id, data) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
};

export const deleteStoreProduct = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (err) {
    handleApiError(err);
  }
}; 