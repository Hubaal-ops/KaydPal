
const API_URL = '/api/stock-adjustments';

// Helper function to handle API requests with token
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || 'Request failed');
    error.status = response.status;
    error.errors = errorData.errors;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
};

export const getAllStockAdjustments = async () => {
  return apiRequest('/');
};

export const addStockAdjustment = async (data) => {
  return apiRequest('/', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};