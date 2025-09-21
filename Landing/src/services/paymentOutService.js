const API_URL = '/api/paymentouts';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export async function getPaymentsOut() {
  const res = await fetch(API_URL, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch payments out');
  const data = await res.json();
  return data.data || [];
}

export async function getPaymentOutById(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch payment out');
  return res.json();
}

export async function createPaymentOut(payment) {
  const { supplier_no, account_id, amount, description } = payment;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ supplier_no, account_id, amount, description })
  });
  if (!res.ok) throw new Error('Failed to create payment out');
  return res.json();
}

export async function updatePaymentOut(id, payment) {
  const { supplier_no, account_id, amount, description } = payment;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ supplier_no, account_id, amount, description })
  });
  if (!res.ok) throw new Error('Failed to update payment out');
  return res.json();
}

export async function deletePaymentOut(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete payment out');
  return res.json();
}

// Export payments out to Excel
export async function exportPaymentsOut() {
  try {
    const res = await fetch(`${API_URL}/export/excel`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to export payments out');
    }
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_out_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true, message: 'Payments out exported successfully' };
  } catch (error) {
    throw new Error('Export failed: ' + error.message);
  }
}

// Import payments out from Excel
export async function importPaymentsOut(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_URL}/import/excel`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeaders().Authorization
        // Note: Don't set Content-Type when sending FormData
      },
      body: formData
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to import payments out');
    }
    
    return await res.json();
  } catch (error) {
    throw new Error('Import failed: ' + error.message);
  }
}

// Download payment out import template
export async function downloadPaymentOutTemplate() {
  try {
    const res = await fetch(`${API_URL}/template/download`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to download template');
    }
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment_out_import_template.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true, message: 'Template downloaded successfully' };
  } catch (error) {
    throw new Error('Template download failed: ' + error.message);
  }
}