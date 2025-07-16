const API_URL = '/api/accounts';

export async function getAccounts() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

export async function getAccountById(id) {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch account');
  return res.json();
}

export async function createAccount(account) {
  // Only send name, bank, balance
  const { name, bank, balance } = account;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, bank, balance })
  });
  if (!res.ok) throw new Error('Failed to create account');
  return res.json();
}

export async function updateAccount(id, account) {
  // Only send name, bank, balance
  const { name, bank, balance } = account;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, bank, balance })
  });
  if (!res.ok) throw new Error('Failed to update account');
  return res.json();
}

export async function deleteAccount(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete account');
  return res.json();
} 