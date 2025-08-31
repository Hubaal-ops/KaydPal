const API_URL = '/api/accounts';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getAccounts() {
  const res = await fetch(API_URL, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

export async function getAccountById(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch account');
  return res.json();
}

export async function createAccount(account) {
  // Send name, bank, balance, and account_id if present
  const { name, bank, balance, account_id } = account;
  const body = account_id !== undefined ? { name, bank, balance, account_id } : { name, bank, balance };
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Failed to create account');
  return res.json();
}

export async function updateAccount(id, account) {
  // Send name, bank, balance, and account_id if present
  const { name, bank, balance, account_id } = account;
  const body = account_id !== undefined ? { name, bank, balance, account_id } : { name, bank, balance };
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Failed to update account');
  return res.json();
}

export async function deleteAccount(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    }
  });
  if (!res.ok) throw new Error('Failed to delete account');
  return res.json();
} 