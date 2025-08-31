
const API_URL = '/api/purchase-returns';

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

export const getPurchaseReturns = async () => {
  try {
    console.log('🔍 Making API request to:', API_URL);
    const response = await apiRequest('/');
    console.log('📊 API response received:', response);
    
    // Handle different response formats
    if (Array.isArray(response)) {
      console.log('✅ Response is already an array:', response.length, 'items');
      return response;
    }
    
    if (response && response.data && Array.isArray(response.data)) {
      console.log('✅ Response has data array:', response.data.length, 'items');
      return response.data;
    }
    
    if (response && Array.isArray(response.data)) {
      console.log('✅ Response data is array:', response.data.length, 'items');
      return response.data;
    }
    
    console.log('⚠️ Unexpected response format, returning empty array');
    return [];
  } catch (error) {
    console.error('❌ Purchase returns API error:', error);
    throw error;
  }
};

export const createPurchaseReturn = async (purchaseReturnData) => {
  try {
    const data = await apiRequest('/', {
      method: 'POST',
      body: JSON.stringify(purchaseReturnData),
    });
    return data.data;
  } catch (error) {
    throw error;
  }
};

export const updatePurchaseReturn = async (id, purchaseReturnData) => {
  try {
    const data = await apiRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(purchaseReturnData),
    });
    return data.data;
  } catch (error) {
    throw error;
  }
};

export const deletePurchaseReturn = async (id) => {
  try {
    await apiRequest(`/${id}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    throw error;
  }
};