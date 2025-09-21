const API_URL = '/api/salaries';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleApiError = (res) => {
  if (res.status === 401 || res.status === 403) {
    window.location.href = '/login';
    throw new Error('Unauthorized. Please login again.');
  }
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

export async function getSalaries() {
  const res = await fetch(API_URL, {
    headers: getAuthHeaders()
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to fetch salaries');
  return res.json();
}

export async function getSalaryById(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders()
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to fetch salary');
  return res.json();
}

export async function createSalary(salary) {
  const { employee, account, amount, pay_date, description } = salary;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ employee, account, amount, pay_date, description })
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to create salary');
  return res.json();
}

export async function updateSalary(id, salary) {
  const { employee, account, amount, pay_date, description } = salary;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ employee, account, amount, pay_date, description })
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to update salary');
  return res.json();
}

export async function deleteSalary(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to delete salary');
  return res.json();
}

/**
 * Export salaries to Excel
 */
export async function exportSalariesToExcel() {
  console.log('Exporting salaries to Excel...');
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
    
    let filename = `salaries_${new Date().toISOString().split('T')[0]}.xlsx`;
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
 * Import salaries from Excel file
 * @param {File} file - The Excel file to import
 */
export async function importSalariesFromExcel(file) {
  console.log('Importing salaries from Excel file:', file.name);
  return uploadFile('/import/excel', file);
}

/**
 * Download salary import template
 */
export async function downloadSalaryTemplate() {
  console.log('Downloading salary import template...');
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
    a.download = 'salary_import_template.xlsx';
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