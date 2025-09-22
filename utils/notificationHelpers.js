const Notification = require('../models/Notification');

/**
 * Create a notification for a specific user
 * @param {string} userId - The ID of the user to notify
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 * @param {string} type - Notification type (info, success, warning, error)
 * @param {string} category - Notification category (optional)
 */
exports.createNotification = async (userId, title, description, type = 'info', category = 'general') => {
  try {
    const notification = new Notification({
      user: userId,
      title,
      description,
      type,
      category
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create a notification for multiple users
 * @param {Array} userIds - Array of user IDs to notify
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 * @param {string} type - Notification type (info, success, warning, error)
 * @param {string} category - Notification category (optional)
 */
exports.createNotificationsForUsers = async (userIds, title, description, type = 'info', category = 'general') => {
  try {
    const notifications = userIds.map(userId => ({
      user: userId,
      title,
      description,
      type,
      category
    }));
    
    const result = await Notification.insertMany(notifications);
    return result;
  } catch (error) {
    console.error('Error creating notifications for users:', error);
    throw error;
  }
};

/**
 * Create a system-wide notification for all users
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 * @param {string} type - Notification type (info, success, warning, error)
 * @param {string} category - Notification category (optional)
 */
exports.createSystemNotification = async (title, description, type = 'info', category = 'general') => {
  try {
    // This would require getting all user IDs from the User model
    // For now, we'll just return a placeholder
    console.log('System notification created:', { title, description, type, category });
    // In a real implementation, you would:
    // 1. Get all user IDs from the User model
    // 2. Call createNotificationsForUsers with all user IDs
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
};