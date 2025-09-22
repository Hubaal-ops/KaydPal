const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllAsRead,
  clearAll
} = require('../controllers/notificationController');

// All routes require authentication
router.use(verifyToken);

// Get user notifications
router.get('/', getUserNotifications);

// Mark notification as read
router.patch('/:id/read', markNotificationAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Mark all as read
router.patch('/mark-all-read', markAllAsRead);

// Clear all notifications
router.delete('/clear-all', clearAll);

module.exports = router;