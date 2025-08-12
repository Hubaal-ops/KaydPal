
const API_URL = '/api/expense-categories';

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

export async function getExpenseCategories() {
  return apiRequest('/');
}

export async function getExpenseCategoryById(id) {
  return apiRequest(`/${id}`);
}

export async function createExpenseCategory(category) {
  const { name, description } = category;
  return apiRequest('/', {
    method: 'POST',
    body: JSON.stringify({ name, description })
  });
}

export async function updateExpenseCategory(id, category) {
  const { name, description } = category;
  return apiRequest(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, description })
  });
}

export async function deleteExpenseCategory(id) {
  return apiRequest(`/${id}`, {
    method: 'DELETE'
  });
}