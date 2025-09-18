const API_URL = '/api/accounts';
const EXPORT_API_URL = '/api/export';
const IMPORT_API_URL = '/api/import';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getAccounts() {
  const res = await fetch(API_URL, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

export async function getAccountById(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch account');
  return res.json();
}

export async function createAccount(account) {
  // Send name, bank, balance, and account_id if present
  const { name, bank, balance, account_id } = account;
  const body = account_id !== undefined ? { name, bank, balance, account_id } : { name, bank, balance };
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Failed to create account');
  return res.json();
}

export async function updateAccount(id, account) {
  // Send name, bank, balance, and account_id if present
  const { name, bank, balance, account_id } = account;
  const body = account_id !== undefined ? { name, bank, balance, account_id } : { name, bank, balance };
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Failed to update account');
  return res.json();
}

export async function deleteAccount(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    }
  });
  if (!res.ok) throw new Error('Failed to delete account');
  return res.json();
}

/**
 * Helper function for file uploads
 */
const uploadFile = async (endpoint, file) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  console.log(`Preparing to upload file to ${endpoint}`, {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    fileLastModified: file.lastModified ? new Date(file.lastModified).toISOString() : 'unknown'
  });

  // Validate file is not empty
  if (!file || file.size === 0) {
    throw new Error('The selected file is empty');
  }

  const formData = new FormData();
  formData.append('file', file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      credentials: 'include',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const responseText = await response.text();
    
    try {
      const responseData = responseText ? JSON.parse(responseText) : {};
      
      if (!response.ok) {
        const error = new Error(responseData.error || responseData.message || 'Upload failed');
        error.status = response.status;
        error.details = responseData.details || responseText;
        throw error;
      }
      
      return responseData;
    } catch (parseError) {
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${responseText}`);
      }
      return { success: true, message: 'File uploaded successfully', data: responseText };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Upload error:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Failed to connect to the server. Please check your internet connection.');
    }
    
    throw error;
  }
};

/**
 * Export accounts to Excel
 */
export async function exportAccountsToExcel() {
  console.log('Exporting accounts to Excel...');
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
      credentials: 'include'
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
    
    let filename = `accounts_${new Date().toISOString().split('T')[0]}.xlsx`;
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
 * Import accounts from Excel file
 * @param {File} file - The Excel file to import
 */
export async function importAccountsFromExcel(file) {
  console.log('Importing accounts from Excel file:', file.name);
  return uploadFile('/import/excel', file);
}

/**
 * Download account import template
 */
export async function downloadAccountTemplate() {
  console.log('Downloading account import template...');
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
    a.download = 'account_import_template.xlsx';
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