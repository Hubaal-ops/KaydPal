const ADMIN_API_URL = '/api/protected/admin/notifications';

// Helper function to handle API requests with token
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${ADMIN_API_URL}${endpoint}`, {
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
 * Send notification to all users
 * @param {Object} notificationData - Notification details
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.description - Notification description
 * @param {string} notificationData.type - Notification type (info, success, warning, error)
 * @param {string} notificationData.category - Notification category
 */
export async function sendGlobalNotification(notificationData) {
  return apiRequest('/send/global', {
    method: 'POST',
    body: JSON.stringify(notificationData)
  });
}

/**
 * Send notification to specific users
 * @param {Object} notificationData - Notification details
 * @param {Array} notificationData.userIds - Array of user IDs
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.description - Notification description
 * @param {string} notificationData.type - Notification type (info, success, warning, error)
 * @param {string} notificationData.category - Notification category
 */
export async function sendUserNotification(notificationData) {
  return apiRequest('/send/users', {
    method: 'POST',
    body: JSON.stringify(notificationData)
  });
}

/**
 * Send notification to users by role
 * @param {Object} notificationData - Notification details
 * @param {Array} notificationData.roles - Array of roles
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.description - Notification description
 * @param {string} notificationData.type - Notification type (info, success, warning, error)
 * @param {string} notificationData.category - Notification category
 */
export async function sendRoleNotification(notificationData) {
  return apiRequest('/send/roles', {
    method: 'POST',
    body: JSON.stringify(notificationData)
  });
}

/**
 * Get all users for notification targeting
 */
export async function getUsersForNotifications() {
  return apiRequest('/users');
}