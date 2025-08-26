const API_BASE = '/api/suppliers';

// Helper function to get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getSuppliers() {
  const res = await fetch(API_BASE, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch suppliers');
  return await res.json();
}

export async function addSupplier(supplier) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(supplier),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to add supplier');
  }
  return await res.json();
}

export async function updateSupplier(supplier_no, supplier) {
  const res = await fetch(`${API_BASE}/${supplier_no}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(supplier),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update supplier');
  }
  return await res.json();
}

export async function deleteSupplier(supplier_no) {
  const res = await fetch(`${API_BASE}/${supplier_no}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete supplier');
  }
  return await res.json();
} 