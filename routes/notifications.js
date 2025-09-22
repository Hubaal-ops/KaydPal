const express = require('express');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all notifications (admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', verifyToken, isAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
});

// Delete notification
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

// Mark all as read
router.patch('/mark-all-read', verifyToken, isAdmin, async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

// Clear all notifications
router.delete('/clear-all', verifyToken, isAdmin, async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear all notifications' });
  }
});

// Send notification to all users
router.post('/send/global', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, description, type, category } = req.body;
    
    // Validate input
    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and description are required' 
      });
    }
    
    // Get all users
    const users = await User.find({}, '_id');
    const userIds = users.map(user => user._id);
    
    // Create notifications for all users
    const notifications = userIds.map(userId => ({
      user: userId,
      title,
      description,
      type: type || 'info',
      category: category || 'system'
    }));
    
    // Insert all notifications
    const result = await Notification.insertMany(notifications);
    
    res.json({
      success: true,
      message: `Notification sent to ${result.length} users`,
      data: { sentTo: result.length }
    });
  } catch (error) {
    console.error('Error sending global notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

// Send notification to specific users
router.post('/send/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const { userIds, title, description, type, category } = req.body;
    
    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'User IDs array is required' 
      });
    }
    
    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and description are required' 
      });
    }
    
    // Create notifications for specified users
    const notifications = userIds.map(userId => ({
      user: userId,
      title,
      description,
      type: type || 'info',
      category: category || 'system'
    }));
    
    // Insert all notifications
    const result = await Notification.insertMany(notifications);
    
    res.json({
      success: true,
      message: `Notification sent to ${result.length} users`,
      data: { sentTo: result.length }
    });
  } catch (error) {
    console.error('Error sending user notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

// Send notification to users by role
router.post('/send/roles', verifyToken, isAdmin, async (req, res) => {
  try {
    const { roles, title, description, type, category } = req.body;
    
    // Validate input
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Roles array is required' 
      });
    }
    
    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and description are required' 
      });
    }
    
    // Get users by role
    const users = await User.find({ role: { $in: roles } }, '_id');
    const userIds = users.map(user => user._id);
    
    // Create notifications for specified users
    const notifications = userIds.map(userId => ({
      user: userId,
      title,
      description,
      type: type || 'info',
      category: category || 'system'
    }));
    
    // Insert all notifications
    const result = await Notification.insertMany(notifications);
    
    res.json({
      success: true,
      message: `Notification sent to ${result.length} users with roles: ${roles.join(', ')}`,
      data: { sentTo: result.length, roles }
    });
  } catch (error) {
    console.error('Error sending role notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

// Get all users for notification targeting
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '_id username email role createdAt');
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

module.exports = router;