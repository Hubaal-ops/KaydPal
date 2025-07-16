const API_URL = '/api/employees';

export async function getEmployees() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch employees');
  return res.json();
}

export async function getEmployeeById(id) {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch employee');
  return res.json();
}

export async function createEmployee(employee) {
  // Only send name, position, store, contact, date_hired
  const { name, position, store, contact, date_hired } = employee;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, position, store, contact, date_hired })
  });
  if (!res.ok) throw new Error('Failed to create employee');
  return res.json();
}

export async function updateEmployee(id, employee) {
  // Only send name, position, store, contact, date_hired
  const { name, position, store, contact, date_hired } = employee;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, position, store, contact, date_hired })
  });
  if (!res.ok) throw new Error('Failed to update employee');
  return res.json();
}

export async function deleteEmployee(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete employee');
  return res.json();
} 