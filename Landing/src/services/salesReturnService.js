import axios from 'axios';

const API_URL = '/api/sales-returns';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getSalesReturns = async () => {
  try {
    const res = await axios.get(API_URL, { headers: getAuthHeaders() });
    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message || 'Failed to fetch sales returns';
  }
};

export const createSalesReturn = async (data) => {
  try {
    const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message || 'Failed to create sales return';
  }
};

export const updateSalesReturn = async (id, data) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message || 'Failed to update sales return';
  }
};

export const deleteSalesReturn = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message || 'Failed to delete sales return';
  }
};