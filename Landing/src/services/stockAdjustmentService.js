import axios from 'axios';

const API_URL = '/api/stock-adjustments';

export const getAllStockAdjustments = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const addStockAdjustment = async (data) => {
  const res = await axios.post(API_URL, data);
  return res.data;
}; 