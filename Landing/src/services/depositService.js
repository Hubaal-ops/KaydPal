const API_URL = '/api/deposits';

export async function getDeposits() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch deposits');
  return res.json();
}

export async function getDepositById(id) {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch deposit');
  return res.json();
}

export async function createDeposit(deposit) {
  // Only send account, amount
  const { account, amount } = deposit;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, amount })
  });
  if (!res.ok) throw new Error('Failed to create deposit');
  return res.json();
}

export async function updateDeposit(id, deposit) {
  // Only send account, amount
  const { account, amount } = deposit;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, amount })
  });
  if (!res.ok) throw new Error('Failed to update deposit');
  return res.json();
}

export async function deleteDeposit(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete deposit');
  return res.json();
} 