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

// Export stock adjustments to Excel
export const exportStockAdjustments = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/export/excel`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to export stock adjustments');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_adjustments_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true, message: 'Stock adjustments exported successfully' };
  } catch (error) {
    throw new Error('Export failed: ' + error.message);
  }
};

// Import stock adjustments from Excel
export const importStockAdjustments = async (file) => {
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/import/excel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Note: Don't set Content-Type when sending FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to import stock adjustments');
    }

    return await response.json();
  } catch (error) {
    throw new Error('Import failed: ' + error.message);
  }
};

// Download stock adjustment import template
export const downloadTemplate = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/template/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to download template');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock_adjustment_import_template.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true, message: 'Template downloaded successfully' };
  } catch (error) {
    throw new Error('Template download failed: ' + error.message);
  }
};