const API_URL = '/api/transfers';

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

export async function getTransfers() {
  return apiRequest('/');
}

export async function getTransferById(id) {
  return apiRequest(`/${id}`);
}

export async function createTransfer(transfer) {
  // Only send from_account, to_account, amount, description
  const { from_account, to_account, amount, description } = transfer;
  return apiRequest('/', {
    method: 'POST',
    body: JSON.stringify({ from_account, to_account, amount, description })
  });
}

export async function updateTransfer(id, transfer) {
  // Only send from_account, to_account, amount, description
  const { from_account, to_account, amount, description } = transfer;
  return apiRequest(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ from_account, to_account, amount, description })
  });
}

export async function deleteTransfer(id) {
  return apiRequest(`/${id}`, { method: 'DELETE' });
}

// Import transfers from file
export async function importTransfers(file) {
  return uploadFile('/import', file);
}

// Download transfer import template
export async function downloadTransferTemplate() {
  const response = await fetch(`${API_URL}/import/template`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to download template');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transfer_import_template.xlsx';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Export transfers to file
export async function exportTransfers(format = 'xlsx') {
  const response = await fetch(`${API_URL}/export/${format}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to export transfers');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transfers_${new Date().toISOString().split('T')[0]}.${format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}