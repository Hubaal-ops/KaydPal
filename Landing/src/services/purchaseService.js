
const API_BASE = '/api/purchases';

// Helper function to handle API requests with token
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}${endpoint}`, {
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

export async function getPurchases() {
  return apiRequest('/');
}

export async function addPurchase(purchase) {
  return apiRequest('/', {
    method: 'POST',
    body: JSON.stringify(purchase),
  });
}

export async function updatePurchase(purchase_no, purchase) {
  return apiRequest(`/${purchase_no}`, {
    method: 'PUT',
    body: JSON.stringify(purchase),
  });
}

export async function deletePurchase(purchase_no) {
  return apiRequest(`/${purchase_no}`, {
    method: 'DELETE',
  });
}