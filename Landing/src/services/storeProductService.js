import axios from 'axios';

const API_URL = '/api/store-products';

export const getStoreProducts = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const getStoreProductById = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

export const createStoreProduct = async (data) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

export const updateStoreProduct = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
};

export const deleteStoreProduct = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
}; 