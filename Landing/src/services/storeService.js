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

// Import stores from Excel file
export const importStores = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/import`, formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error importing stores:', error);
    throw error;
  }
};

// Download store import template
export const downloadTemplate = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/template`, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'store_import_template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return { success: true };
  } catch (error) {
    console.error('Error downloading template:', error);
    throw error;
  }
};