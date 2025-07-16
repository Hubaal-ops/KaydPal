const API_URL = '/api/salaries';

export async function getSalaries() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch salaries');
  return res.json();
}

export async function getSalaryById(id) {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch salary');
  return res.json();
}

export async function createSalary(salary) {
  // Only send employee, account, amount, pay_date, description
  const { employee, account, amount, pay_date, description } = salary;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee, account, amount, pay_date, description })
  });
  if (!res.ok) throw new Error('Failed to create salary');
  return res.json();
}

export async function updateSalary(id, salary) {
  // Only send employee, account, amount, pay_date, description
  const { employee, account, amount, pay_date, description } = salary;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee, account, amount, pay_date, description })
  });
  if (!res.ok) throw new Error('Failed to update salary');
  return res.json();
}

export async function deleteSalary(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete salary');
  return res.json();
} 