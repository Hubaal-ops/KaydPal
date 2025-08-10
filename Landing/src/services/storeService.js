import axios from 'axios';

const API_URL = '/api/stores';

export const getStores = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get(API_URL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};

export const getStore = async (id) => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_URL}/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};

export const createStore = async (storeData) => {
  const token = localStorage.getItem('token');
  const res = await axios.post(API_URL, storeData, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};

export const updateStore = async (id, storeData) => {
  const token = localStorage.getItem('token');
  const res = await axios.put(`${API_URL}/${id}`, storeData, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};

export const deleteStore = async (id) => {
  const token = localStorage.getItem('token');
  const res = await axios.delete(`${API_URL}/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};