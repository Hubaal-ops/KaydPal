const User = require('../models/User');
const express = require('express');
const { verifyToken, isAdmin, isUser } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/protected/admin
 * @desc    Admin-only route (exactly as Developer 2 requested)
 * @access  Admin only
 */
router.get('/admin', verifyToken, isAdmin, (req, res) => {
  res.json({ 
    success: true,
    message: 'Welcome Admin',
    data: {
      user: req.user,
      timestamp: new Date().toISOString(),
      adminFeatures: [
        'User Management',
        'System Settings',
        'Analytics Dashboard',
        'Content Moderation'
      ]
    }
  });
});

/**
 * @route   GET /api/protected/user
 * @desc    User-only route
 * @access  User only
 */
router.get('/user', verifyToken, isUser, (req, res) => {
  res.json({ 
    success: true,
    message: 'Welcome User',
    data: {
      user: req.user,
      timestamp: new Date().toISOString(),
      userFeatures: [
        'Profile Management',
        'Personal Dashboard',
        'Settings',
        'Notifications'
      ]
    }
  });
});

/**
 * @route   GET /api/protected/dashboard
 * @desc    Dashboard accessible by any authenticated user
 * @access  Authenticated users
 */
router.get('/dashboard', verifyToken, (req, res) => {
  const isAdminUser = req.user.role === 'admin';
  
  res.json({ 
    success: true,
    message: 'Welcome to Dashboard',
    data: {
      user: req.user,
      role: req.user.role,
      timestamp: new Date().toISOString(),
      features: isAdminUser ? [
        'Full System Access',
        'User Management',
        'Analytics',
        'Settings',
        'Reports'
      ] : [
        'Personal Dashboard',
        'Profile Settings',
        'Notifications',
        'Basic Reports'
      ]
    }
  });
});

/**
 * @route   GET /api/protected/admin/users
 * @desc    Admin user management panel
 * @access  Admin only
 */
// List all users (for admin panel)
router.get('/admin/users/list', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password -loginAttempts -lockUntil');
    res.json({
      success: true,
      message: 'User list fetched successfully',
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

/**
 * @route   POST /api/protected/admin/users
 * @desc    Create a new user (admin only)
 * @access  Admin only
 */
router.post('/admin/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role, isActive } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    }
    const user = new User({ name, email, password, role, isActive });
    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json({ success: true, message: 'User created successfully', data: userObj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
});

/**
 * @route   PUT /api/protected/admin/users/:id
 * @desc    Update a user (admin only)
 * @access  Admin only
 */
router.put('/admin/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, isActive } = req.body;
    const update = { name, email, role, isActive };
    // Only update password if provided
    if (password) update.password = password;
    // Remove undefined fields
    Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // If password is being updated, let pre-save hash it
    Object.assign(user, update);
    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    res.json({ success: true, message: 'User updated successfully', data: userObj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
});

/**
 * @route   DELETE /api/protected/admin/users/:id
 * @desc    Delete a user (admin only)
 * @access  Admin only
 */
router.delete('/admin/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
});

/**
 * @route   GET /api/protected/user/profile
 * @desc    User profile page
 * @access  User only
 */
router.get('/user/profile', verifyToken, isUser, (req, res) => {
  res.json({ 
    success: true,
    message: 'User profile page',
    data: {
      user: req.user,
      action: 'View own profile',
      timestamp: new Date().toISOString(),
      profileFeatures: [
        'Edit Personal Information',
        'Change Password',
        'Privacy Settings',
        'Notification Preferences'
      ]
    }
  });
});

/**
 * @route   GET /api/protected/content
 * @desc    Content page with role-based access
 * @access  Authenticated users
 */
router.get('/content', verifyToken, (req, res) => {
  const isAdminUser = req.user.role === 'admin';
  
  res.json({ 
    success: true,
    message: 'Content page',
    data: {
      user: req.user,
      isAdmin: isAdminUser,
      timestamp: new Date().toISOString(),
      content: isAdminUser ? {
        type: 'Full content access',
        features: [
          'Create Content',
          'Edit All Content',
          'Delete Content',
          'Moderate Comments',
          'Publish/Unpublish'
        ]
      } : {
        type: 'Limited content access',
        features: [
          'View Content',
          'Create Personal Content',
          'Edit Own Content',
          'Comment on Content'
        ]
      }
    }
  });
});

/**
 * @route   GET /api/protected/admin/analytics
 * @desc    Admin analytics dashboard
 * @access  Admin only
 */
router.get('/admin/analytics', verifyToken, isAdmin, (req, res) => {
  res.json({ 
    success: true,
    message: 'Admin analytics dashboard',
    data: {
      user: req.user,
      timestamp: new Date().toISOString(),
      analytics: {
        totalUsers: 1250,
        activeUsers: 890,
        newUsersThisMonth: 45,
        revenue: '$15,000',
        topContent: [
          'Getting Started Guide',
          'API Documentation',
          'Tutorial Videos'
        ]
      }
    }
  });
});

/**
 * @route   GET /api/protected/user/settings
 * @desc    User settings page
 * @access  User only
 */
router.get('/user/settings', verifyToken, isUser, (req, res) => {
  res.json({ 
    success: true,
    message: 'User settings page',
    data: {
      user: req.user,
      timestamp: new Date().toISOString(),
      settings: {
        notifications: {
          email: true,
          push: false,
          sms: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          allowMessages: true
        },
        preferences: {
          language: 'en',
          timezone: 'UTC',
          theme: 'light'
        }
      }
    }
  });
});

/**
 * @route   GET /api/protected/public
 * @desc    Public content (any authenticated user)
 * @access  Authenticated users
 */
router.get('/public', verifyToken, (req, res) => {
  res.json({ 
    success: true,
    message: 'Public content area',
    data: {
      user: req.user,
      timestamp: new Date().toISOString(),
      publicContent: [
        'Announcements',
        'News',
        'Updates',
        'Community Guidelines'
      ]
    }
  });
});

module.exports = router; 