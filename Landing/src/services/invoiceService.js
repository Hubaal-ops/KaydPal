import axios from 'axios';
const API_URL = '/api/invoices';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getInvoices = async () => {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
};

export const getInvoiceById = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
};

export const createInvoice = async (data) => {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
};

export const updateInvoice = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
};

export const deleteInvoice = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
};