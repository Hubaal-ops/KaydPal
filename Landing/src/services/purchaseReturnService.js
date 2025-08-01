import axios from 'axios';

const API_URL = '/api/purchase-returns';

export const getPurchaseReturns = async () => {
  try {
    const res = await axios.get(API_URL);
    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message || 'Failed to fetch purchase returns';
  }
};

export const createPurchaseReturn = async (data) => {
  try {
    const res = await axios.post(API_URL, data);
    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message || 'Failed to create purchase return';
  }
};

export const updatePurchaseReturn = async (id, data) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data);
    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message || 'Failed to update purchase return';
  }
};

export const deletePurchaseReturn = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message || 'Failed to delete purchase return';
  }
}; 