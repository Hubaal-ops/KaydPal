
const API_URL = '/api/deposits';

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

export async function getDeposits() {
  return apiRequest('/');
}

export async function getDepositById(id) {
  return apiRequest(`/${id}`);
}

export async function createDeposit(deposit) {
  const { account, amount } = deposit;
  return apiRequest('/', {
    method: 'POST',
    body: JSON.stringify({ account, amount })
  });
}

export async function updateDeposit(id, deposit) {
  const { account, amount } = deposit;
  return apiRequest(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ account, amount })
  });
}

export async function deleteDeposit(id) {
  return apiRequest(`/${id}`, {
    method: 'DELETE'
  });
}