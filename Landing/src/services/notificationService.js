const API_URL = '/api/protected/user/notifications';

// Helper function to handle API requests with token
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || 'Request failed');
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
};

/**
 * Get user notifications
 */
export async function getUserNotifications() {
  return apiRequest('/');
}

/**
 * Mark a notification as read
 * @param {string} id - Notification ID
 */
export async function markNotificationAsRead(id) {
  return apiRequest(`/${id}/read`, {
    method: 'PATCH'
  });
}

/**
 * Delete a notification
 * @param {string} id - Notification ID
 */
export async function deleteNotification(id) {
  return apiRequest(`/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
  return apiRequest('/mark-all-read', {
    method: 'PATCH'
  });
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  return apiRequest('/clear-all', {
    method: 'DELETE'
  });
}