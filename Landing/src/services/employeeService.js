const API_URL = '/api/employees';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleApiError = (res) => {
  if (res.status === 401 || res.status === 403) {
    window.location.href = '/login';
    throw new Error('Unauthorized. Please login again.');
  }
};

export async function getEmployees() {
  const res = await fetch(API_URL, {
    headers: getAuthHeaders()
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to fetch employees');
  return res.json();
}

export async function getEmployeeById(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders()
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to fetch employee');
  return res.json();
}

export async function createEmployee(employee) {
  const { name, position, store, contact, date_hired } = employee;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ name, position, store, contact, date_hired })
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to create employee');
  return res.json();
}

export async function updateEmployee(id, employee) {
  const { name, position, store, contact, date_hired } = employee;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ name, position, store, contact, date_hired })
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to update employee');
  return res.json();
}

export async function deleteEmployee(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to delete employee');
  return res.json();
}