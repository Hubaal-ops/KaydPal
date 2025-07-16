const API_URL = '/api/expenses';

export async function getExpenses() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch expenses');
  return res.json();
}

export async function getExpenseById(id) {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch expense');
  return res.json();
}

export async function createExpense(expense) {
  // Only send category, account, amount, description, expense_date
  const { category, account, amount, description, expense_date } = expense;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, account, amount, description, expense_date })
  });
  if (!res.ok) throw new Error('Failed to create expense');
  return res.json();
}

export async function updateExpense(id, expense) {
  // Only send category, account, amount, description, expense_date
  const { category, account, amount, description, expense_date } = expense;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, account, amount, description, expense_date })
  });
  if (!res.ok) throw new Error('Failed to update expense');
  return res.json();
}

export async function deleteExpense(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete expense');
  return res.json();
} 