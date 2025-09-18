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
    const error = new Error(errorData.error || errorData.message || 'Request failed');
    error.status = response.status;
    error.errors = errorData.errors || errorData.details;
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

  console.log(`Preparing to upload file to ${endpoint}`, {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    fileLastModified: file.lastModified ? new Date(file.lastModified).toISOString() : 'unknown',
    fileProperties: Object.keys(file)
  });

  // Validate file is not empty
  if (!file || file.size === 0) {
    throw new Error('The selected file is empty');
  }

  const formData = new FormData();
  formData.append('file', file);

  // Log FormData contents for debugging
  console.log('FormData contents:');
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header - let the browser set it with the correct boundary
      },
      body: formData,
      credentials: 'include', // Include cookies for session handling
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    console.log('Upload response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Get response text first to handle both JSON and non-JSON responses
    const responseText = await response.text();
    
    // Try to parse as JSON if possible
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
      // If not JSON, handle as text response
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${responseText}`);
      }
      return { success: true, message: 'File uploaded successfully', data: responseText };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Upload error:', error);
    
    // Enhance error with more context
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Failed to connect to the server. Please check your internet connection.');
    }
    
    throw error;
  }
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

// Export categories to Excel
export async function exportCategoriesToExcel() {
  console.log('Exporting categories to Excel...');
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
    
    // Clone the response so we can read it multiple times if needed
    const responseClone = response.clone();
    
    // First check if the response is an error
    if (!response.ok) {
      try {
        // Try to parse as JSON first
        const errorData = await response.json();
        const error = new Error(errorData.error || errorData.message || 'Export failed');
        error.status = response.status;
        error.errors = errorData.errors || errorData.details;
        throw error;
      } catch (jsonError) {
        // If JSON parse fails, try to get as text
        const errorText = await response.text();
        console.error('Export error response:', errorText);
        throw new Error(`Export failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
    }

    // If we get here, the response should be our file
    const contentType = response.headers.get('content-type') || '';
    const contentDisposition = response.headers.get('content-disposition') || '';
    
    console.log('Export response headers:', {
      contentType,
      contentDisposition,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Handle file download
    const blob = await response.blob();
    
    // Try to get filename from content-disposition header, or generate one
    let filename = `expense_categories_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }

    // Create and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return {
      success: true,
      message: 'Export completed successfully',
      filename: filename
    };
  } catch (error) {
    console.error('Export error:', error);
    
    // Enhance error with more context
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Failed to connect to the server. Please check your internet connection.');
    }
    
    throw error;
  }
}

// Import categories from Excel
export async function importCategoriesFromExcel(file) {
  try {
    console.log('Importing categories from Excel file:', file.name);
    
    if (!file) {
      throw new Error('No file provided for import');
    }
    
    // More permissive file validation - primarily check file extension
    const validExtensions = ['.xlsx', '.xls', '.xlsm', '.xlsb', '.csv'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isExtensionValid = validExtensions.includes(fileExt.toLowerCase());
    
    // Log detailed file information for debugging
    console.log('File validation details:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileExtension: fileExt,
      fileProperties: Object.keys(file),
      isExtensionValid,
      validExtensions
    });
    
    // If we can't determine the type from extension, check the content type as fallback
    if (!isExtensionValid) {
      const validMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream',
        'application/vnd.ms-excel.sheet.macroEnabled.12',
        'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
        'application/vnd.ms-excel.sheet.macroEnabled.12+xml',
        'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
        'application/zip',
        'application/x-zip-compressed',
        'application/x-zip',
        'application/x-excel',
        'application/x-msexcel',
        'application/vnd.ms-office',
        'application/x-ole-storage'
      ];
      
      const isMimeTypeValid = validMimeTypes.some(type => 
        file.type && file.type.toLowerCase().includes(type.toLowerCase())
      );
      
      console.log('MIME type validation fallback:', {
        fileType: file.type,
        isMimeTypeValid,
        validMimeTypes
      });
      
      if (!isMimeTypeValid) {
        throw new Error(`Invalid file type. Please upload a valid Excel file (${validExtensions.join(', ')})`);
      }
      
      console.warn('File accepted based on MIME type despite unknown extension:', file.name);
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds the maximum limit of 5MB');
    }
    
    console.log('Uploading file for import...');
    const result = await uploadFile('/import/excel', file);
    console.log('Import result:', result);
    
    return {
      success: true,
      message: result.message || 'Import completed successfully',
      imported: result.imported || 0,
      skipped: result.skipped || 0,
      errors: result.errors || []
    };
  } catch (error) {
    console.error('Import error:', error);
    
    // Handle different types of errors
    let errorMessage = 'Failed to import categories';
    let errorDetails = [];
    
    if (error.errors && Array.isArray(error.errors)) {
      errorDetails = error.errors;
      errorMessage = error.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw {
      message: errorMessage,
      errors: errorDetails,
      status: error.status || 500
    };
  }
}

// Download import template
export function downloadImportTemplate() {
  // Create a simple template with headers
  const templateData = [
    { 'Name': 'Office Supplies', 'Description': 'Pens, paper, etc.' },
    { 'Name': 'Utilities', 'Description': 'Electricity, water, internet' },
    { 'Name': 'Rent', 'Description': 'Office space rent' },
  ];

  let csvContent = 'data:text/csv;charset=utf-8,';
  
  // Add headers
  csvContent += Object.keys(templateData[0]).join(',') + '\r\n';
  
  // Add data rows
  templateData.forEach(row => {
    csvContent += Object.values(row).map(value => 
      `"${value.toString().replace(/"/g, '""')}"`
    ).join(',') + '\r\n';
  });
  
  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'expense_categories_import_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}