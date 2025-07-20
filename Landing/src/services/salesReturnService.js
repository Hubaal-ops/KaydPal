import axios from 'axios';

const API_URL = '/api/sales-returns';

export const getSalesReturns = async () => {
  try {
    const res = await axios.get(API_URL);
    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message || 'Failed to fetch sales returns';
  }
};

export const createSalesReturn = async (data) => {
  try {
    const res = await axios.post(API_URL, data);
    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message || 'Failed to create sales return';
  }
};

export const updateSalesReturn = async (id, data) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data);
    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message || 'Failed to update sales return';
  }
};

export const deleteSalesReturn = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message || 'Failed to delete sales return';
  }
}; 