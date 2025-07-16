const API_URL = '/api/withdrawals';

export async function getWithdrawals() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch withdrawals');
  return res.json();
}

export async function getWithdrawalById(id) {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch withdrawal');
  return res.json();
}

export async function createWithdrawal(withdrawal) {
  // Only send account, amount
  const { account, amount } = withdrawal;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, amount })
  });
  if (!res.ok) throw new Error('Failed to create withdrawal');
  return res.json();
}

export async function updateWithdrawal(id, withdrawal) {
  // Only send account, amount
  const { account, amount } = withdrawal;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, amount })
  });
  if (!res.ok) throw new Error('Failed to update withdrawal');
  return res.json();
}

export async function deleteWithdrawal(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete withdrawal');
  return res.json();
} 