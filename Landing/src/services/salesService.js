const API_URL = '/api/sales';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getSales() {
  const res = await fetch(API_URL, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch sales');
  return res.json();
}

export async function getSale(saleId) {
  const res = await fetch(`${API_URL}/${saleId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch sale');
  const result = await res.json();
  return result.success ? result.data : result;
}

export async function addSale(sale) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(sale),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to add sale');
  }
  return res.json();
}

export async function updateSale(saleId, sale) {
  const res = await fetch(`${API_URL}/${saleId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(sale),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to update sale');
  }
  return res.json();
}

export async function deleteSale(saleId) {
  const res = await fetch(`${API_URL}/${saleId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to delete sale');
  }
  return res.json();
}

// Status management functions
export async function confirmSale(saleId) {
  const res = await fetch(`${API_URL}/${saleId}/confirm`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to confirm sale');
  }
  return res.json();
}

export async function cancelSale(saleId) {
  const res = await fetch(`${API_URL}/${saleId}/cancel`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to cancel sale');
  }
  return res.json();
}

export async function deliverSale(saleId, deliveryDate = null) {
  const res = await fetch(`${API_URL}/${saleId}/deliver`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(deliveryDate ? { delivery_date: deliveryDate } : {}),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to mark sale as delivered');
  }
  return res.json();
}

// Helper function to get status display information
export function getStatusInfo(status) {
  const statusConfig = {
    draft: { label: 'Draft', color: '#6b7280', bgColor: '#f3f4f6' },
    pending: { label: 'Pending', color: '#f59e0b', bgColor: '#fef3c7' },
    confirmed: { label: 'Confirmed', color: '#3b82f6', bgColor: '#dbeafe' },
    delivered: { label: 'Delivered', color: '#10b981', bgColor: '#d1fae5' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bgColor: '#fee2e2' }
  };
  return statusConfig[status] || statusConfig.draft;
}

export default {
  getSales,
  getSale,
  addSale,
  updateSale,
  deleteSale,
  confirmSale,
  cancelSale,
  deliverSale,
  getStatusInfo
};