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
router.get('/admin/users', verifyToken, isAdmin, (req, res) => {
  res.json({ 
    success: true,
    message: 'Admin user management panel',
    data: {
      user: req.user,
      action: 'View all users',
      timestamp: new Date().toISOString(),
      managementFeatures: [
        'View All Users',
        'Create New Users',
        'Edit User Roles',
        'Deactivate Users',
        'View User Analytics'
      ]
    }
  });
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