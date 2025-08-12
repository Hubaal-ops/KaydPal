
const API_URL = '/api/expenses';

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

export async function getExpenses() {
  return apiRequest('/');
}

export async function getExpenseById(id) {
  return apiRequest(`/${id}`);
}

export async function createExpense(expense) {
  const { category, account, amount, description, expense_date } = expense;
  return apiRequest('/', {
    method: 'POST',
    body: JSON.stringify({ category, account, amount, description, expense_date })
  });
}

export async function updateExpense(id, expense) {
  const { category, account, amount, description, expense_date } = expense;
  return apiRequest(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ category, account, amount, description, expense_date })
  });
}

export async function deleteExpense(id) {
  return apiRequest(`/${id}`, {
    method: 'DELETE'
  });
}