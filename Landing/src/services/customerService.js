// Customer Service for CRUD operations

const API_BASE = '/api/customers';

export async function getCustomers() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Failed to fetch customers');
  return await res.json();
}

export async function addCustomer(customer) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to add customer');
  }
  return await res.json();
}

export async function updateCustomer(customer_no, customer) {
  const res = await fetch(`${API_BASE}/${customer_no}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update customer');
  }
  return await res.json();
}

export async function deleteCustomer(customer_no) {
  const res = await fetch(`${API_BASE}/${customer_no}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete customer');
  }
  return await res.json();
} 