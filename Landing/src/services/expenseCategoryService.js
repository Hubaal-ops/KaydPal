const API_URL = '/api/expense-categories';

export async function getExpenseCategories() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch expense categories');
  return res.json();
}

export async function getExpenseCategoryById(id) {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch expense category');
  return res.json();
}

export async function createExpenseCategory(category) {
  // Only send name, description
  const { name, description } = category;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) throw new Error('Failed to create expense category');
  return res.json();
}

export async function updateExpenseCategory(id, category) {
  // Only send name, description
  const { name, description } = category;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) throw new Error('Failed to update expense category');
  return res.json();
}

export async function deleteExpenseCategory(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete expense category');
  return res.json();
} 