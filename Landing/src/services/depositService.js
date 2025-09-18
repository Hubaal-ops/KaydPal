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

// Import deposits from file
export async function importDeposits(file) {
  return uploadFile('/import', file);
}

// Download deposit import template
export async function downloadDepositTemplate() {
  return apiRequest('/import/template', {
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  });
}

// Export deposits to file
export async function exportDeposits(format = 'xlsx') {
  const response = await fetch(`${API_URL}/export/${format}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Accept': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to export deposits');
  }

  return response.blob();
}