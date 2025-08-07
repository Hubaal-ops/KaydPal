const Notification = require('../models/Notification');

/**
 * Create a notification for admins
 * @param {Object} param0
 * @param {string} param0.title
 * @param {string} param0.description
 * @param {string} [param0.type] - info, success, warning, error
 * @param {string} [param0.category] - users, payments, system, security, messages, etc.
 */
async function notifyAdmin({ title, description, type = 'info', category = 'system' }) {
  try {
    await Notification.create({
      title,
      description,
      type,
      category,
      read: false,
      timestamp: new Date()
    });
  } catch (err) {
    // Optionally log error
  }
}

module.exports = { notifyAdmin };
