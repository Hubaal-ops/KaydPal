const API_URL = '/api/salaries';

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

export async function getSalaries() {
  const res = await fetch(API_URL, {
    headers: getAuthHeaders()
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to fetch salaries');
  return res.json();
}

export async function getSalaryById(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders()
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to fetch salary');
  return res.json();
}

export async function createSalary(salary) {
  const { employee, account, amount, pay_date, description } = salary;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ employee, account, amount, pay_date, description })
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to create salary');
  return res.json();
}

export async function updateSalary(id, salary) {
  const { employee, account, amount, pay_date, description } = salary;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ employee, account, amount, pay_date, description })
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to update salary');
  return res.json();
}

export async function deleteSalary(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  handleApiError(res);
  if (!res.ok) throw new Error('Failed to delete salary');
  return res.json();
}