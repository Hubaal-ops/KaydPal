// Customer Service for CRUD operations

const API_BASE = '/api/customers';

export async function getCustomers() {
  const token = localStorage.getItem('token');
  const res = await fetch(API_BASE, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Failed to fetch customers');
  return await res.json();
}

export async function addCustomer(customer) {
  const token = localStorage.getItem('token');
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(customer),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to add customer');
  }
  return await res.json();
}

export async function updateCustomer(customer_no, customer) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/${customer_no}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(customer),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update customer');
  }
  return await res.json();
}

export async function deleteCustomer(customer_no) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/${customer_no}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete customer');
  }
  return await res.json();
} 