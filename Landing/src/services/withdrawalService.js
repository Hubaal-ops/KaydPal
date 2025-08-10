const API_URL = '/api/withdrawals';

export async function getWithdrawals() {
  const token = localStorage.getItem('token');
  const res = await fetch(API_URL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Failed to fetch withdrawals');
  return res.json();
}

export async function getWithdrawalById(id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Failed to fetch withdrawal');
  return res.json();
}

export async function createWithdrawal(withdrawal) {
  // Only send account, amount
  const { account, amount } = withdrawal;
  const token = localStorage.getItem('token');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ account, amount })
  });
  if (!res.ok) throw new Error('Failed to create withdrawal');
  return res.json();
}

export async function updateWithdrawal(id, withdrawal) {
  // Only send account, amount
  const { account, amount } = withdrawal;
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ account, amount })
  });
  if (!res.ok) throw new Error('Failed to update withdrawal');
  return res.json();
}

export async function deleteWithdrawal(id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Failed to delete withdrawal');
  return res.json();
} 