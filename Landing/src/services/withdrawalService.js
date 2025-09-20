
const API_URL = '/api/withdrawals';

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
  // Handle file downloads
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || 
                      contentType.includes('text/csv'))) {
    return response.blob();
  }
  return response.json();
};

// Helper function to handle file uploads
const uploadFile = async (endpoint, file, options = {}) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: formData,
    ...options,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || 'Upload failed');
    error.status = response.status;
    error.errors = errorData.errors;
    throw error;
  }
  return response.json();
};
// Import withdrawals from file
export async function importWithdrawals(file) {
  return uploadFile('/import', file);
}

// Download withdrawal import template
export async function downloadWithdrawalTemplate() {
  return apiRequest('/import/template', {
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  });
}

// Export withdrawals to file
export async function exportWithdrawals(format = 'xlsx') {
  const response = await fetch(`${API_URL}/export/${format}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Accept': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to export withdrawals');
  }
  return response.blob();
}

export async function getWithdrawals() {
  const token = localStorage.getItem('token');
  const res = await fetch(API_URL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Failed to fetch withdrawals');
  return res.json();
}

export async function getWithdrawalById(id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Failed to fetch withdrawal');
  return res.json();
}

export async function createWithdrawal(withdrawal) {
  // Only send account, amount
  const { account, amount } = withdrawal;
  const token = localStorage.getItem('token');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ account, amount })
  });
  if (!res.ok) throw new Error('Failed to create withdrawal');
  return res.json();
}

export async function updateWithdrawal(id, withdrawal) {
  // Only send account, amount
  const { account, amount } = withdrawal;
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ account, amount })
  });
  if (!res.ok) throw new Error('Failed to update withdrawal');
  return res.json();
}

export async function deleteWithdrawal(id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Failed to delete withdrawal');
  return res.json();
} 