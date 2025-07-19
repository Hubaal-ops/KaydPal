const API_URL = '/api/payments';

export async function getPayments() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch payments');
  const data = await res.json();
  return data.data || [];
}

export async function getPaymentById(id) {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch payment');
  return res.json();
}

export async function createPayment(payment) {
  const { customer_id, account_id, amount } = payment;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id, account_id, amount })
  });
  if (!res.ok) throw new Error('Failed to create payment');
  return res.json();
}

export async function updatePayment(id, payment) {
  const { customer_id, account_id, amount } = payment;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id, account_id, amount })
  });
  if (!res.ok) throw new Error('Failed to update payment');
  return res.json();
}

export async function deletePayment(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete payment');
  return res.json();
} 