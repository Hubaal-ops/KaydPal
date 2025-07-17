const API_URL = '/api/sales';

export async function getSales() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch sales');
  return res.json();
}

export async function addSale(sale) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sale),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to add sale');
  return res.json();
}

export async function updateSale(sel_no, sale) {
  const res = await fetch(`${API_URL}/${sel_no}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sale),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update sale');
  return res.json();
}

export async function deleteSale(sel_no) {
  const res = await fetch(`${API_URL}/${sel_no}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete sale');
  return res.json();
} 