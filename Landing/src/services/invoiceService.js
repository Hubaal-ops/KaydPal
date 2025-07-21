import axios from 'axios';
const API_URL = '/api/invoices';

export const getInvoices = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const getInvoiceById = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

export const createInvoice = async (data) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

export const updateInvoice = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
};

export const deleteInvoice = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
}; 