import axios from 'axios';

const API_URL = '/api/stock-transfers';

export const createStockTransfer = async (data) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

export const getStockTransfers = async () => {
  const res = await axios.get(API_URL);
  return res.data;
}; 