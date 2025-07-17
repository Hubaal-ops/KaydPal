const API_BASE = '/api/purchases';

export async function getPurchases() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Failed to fetch purchases');
  return await res.json();
}

export async function addPurchase(purchase) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchase),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to add purchase');
  }
  return await res.json();
}

export async function updatePurchase(purchase_no, purchase) {
  const res = await fetch(`${API_BASE}/${purchase_no}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchase),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update purchase');
  }
  return await res.json();
}

export async function deletePurchase(purchase_no) {
  const res = await fetch(`${API_BASE}/${purchase_no}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete purchase');
  }
  return await res.json();
} 