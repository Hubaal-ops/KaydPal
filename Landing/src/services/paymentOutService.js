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