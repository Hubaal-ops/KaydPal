import axios from 'axios';

const API_URL = '/api/stores';

export const getStores = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const getStore = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

export const createStore = async (storeData) => {
  const res = await axios.post(API_URL, storeData);
  return res.data;
};

export const updateStore = async (id, storeData) => {
  const res = await axios.put(`${API_URL}/${id}`, storeData);
  return res.data;
};

export const deleteStore = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
}; 