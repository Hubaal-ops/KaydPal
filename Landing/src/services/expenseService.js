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

// Helper function for file uploads
const uploadFile = async (endpoint, file) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      const error = new Error(errorData.error || errorData.message || 'Upload failed');
      error.status = response.status;
      error.errors = errorData.errors || errorData.details;
      throw error;
    } catch (jsonError) {
      const errorText = await response.text();
      const error = new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      error.status = response.status;
      throw error;
    }
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

/**
 * Export expenses to Excel
 */
export async function exportExpensesToExcel() {
  console.log('Exporting expenses to Excel...');
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_URL}/export/excel`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      credentials: 'include' // Include cookies for session handling
    });

    console.log('Export response status:', response.status);
    
    const responseClone = response.clone();
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        const error = new Error(errorData.error || errorData.message || 'Export failed');
        error.status = response.status;
        error.errors = errorData.errors || errorData.details;
        throw error;
      } catch (jsonError) {
        const errorText = await response.text();
        console.error('Export error response:', errorText);
        throw new Error(`Export failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
    }

    const contentType = response.headers.get('content-type') || '';
    const contentDisposition = response.headers.get('content-disposition') || '';
    
    console.log('Export response headers:', {
      contentType,
      contentDisposition,
      headers: Object.fromEntries(response.headers.entries())
    });

    const blob = await response.blob();
    
    let filename = `expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return {
      success: true,
      message: 'Export completed successfully',
      filename: filename
    };
  } catch (error) {
    console.error('Export error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Failed to connect to the server. Please check your internet connection.');
    }
    
    throw error;
  }
}

/**
 * Import expenses from Excel file
 * @param {File} file - The Excel file to import
 */
export async function importExpensesFromExcel(file) {
  console.log('Importing expenses from Excel file:', file.name);
  return uploadFile('/import/excel', file);
}

/**
 * Download expense import template
 */
export async function downloadExpenseTemplate() {
  console.log('Downloading expense import template...');
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_URL}/template/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || errorData.message || 'Failed to download template');
      error.status = response.status;
      error.details = errorData.details;
      throw error;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'expense_import_template.xlsx';
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return {
      success: true,
      message: 'Template downloaded successfully'
    };
  } catch (error) {
    console.error('Download template error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Failed to connect to the server. Please check your internet connection.');
    }
    
    throw error;
  }
}