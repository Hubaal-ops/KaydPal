const API_URL = '/api/transfers';

export async function getTransfers() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch transfers');
  return res.json();
}

export async function getTransferById(id) {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch transfer');
  return res.json();
}

export async function createTransfer(transfer) {
  // Only send from_account, to_account, amount, description
  const { from_account, to_account, amount, description } = transfer;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from_account, to_account, amount, description })
  });
  if (!res.ok) throw new Error('Failed to create transfer');
  return res.json();
}

export async function updateTransfer(id, transfer) {
  // Only send from_account, to_account, amount, description
  const { from_account, to_account, amount, description } = transfer;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from_account, to_account, amount, description })
  });
  if (!res.ok) throw new Error('Failed to update transfer');
  return res.json();
}

export async function deleteTransfer(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete transfer');
  return res.json();
} 