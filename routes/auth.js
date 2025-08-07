const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const { logAudit } = require('../utils/auditLog');
const router = express.Router();

/**
 * Input validation rules
 */
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Role must be either "admin" or "user"')
];

const loginValidation = [
  body('identifier')
    .isLength({ min: 2, max: 50 })
    .withMessage('Identifier must be between 2 and 50 characters'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Generate JWT Token
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      role: user.role,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '1h' 
    }
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await logAudit({ action: 'user_register', description: `Failed registration for ${req.body.email}`, status: 'failure', ip: req.ip });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    const { name, email, password, role = 'user' } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await logAudit({ action: 'user_register', description: `Failed registration for ${email} (already exists)`, status: 'failure', ip: req.ip });
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
        error: 'USER_ALREADY_EXISTS'
      });
    }
    const user = new User({ name, email, password, role });
    await user.save();
    const token = generateToken(user);
    await logAudit({ action: 'user_register', description: `User ${user.email} registered`, user, ip: req.ip });
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    await logAudit({ action: 'user_register', description: `Failed registration for ${req.body.email}`, status: 'failure', ip: req.ip });
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
        error: 'DUPLICATE_EMAIL'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await logAudit({ action: 'user_login', description: `Failed login for ${req.body.identifier}`, status: 'failure', ip: req.ip });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    const { identifier, password } = req.body;
    const user = await User.findByEmailOrUsernameForAuth(identifier);
    if (!user) {
      await logAudit({ action: 'user_login', description: `Failed login for ${req.body.identifier} (user not found)`, status: 'failure', ip: req.ip });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }
    if (user.isLocked) {
      await logAudit({ action: 'user_login', description: `Locked account login attempt for ${user.email}`, user, status: 'failure', ip: req.ip });
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts',
        error: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil
      });
    }
    if (!user.isActive) {
      await logAudit({ action: 'user_login', description: `Inactive account login attempt for ${user.email}`, user, status: 'failure', ip: req.ip });
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        error: 'ACCOUNT_INACTIVE'
      });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      await logAudit({ action: 'user_login', description: `Failed login for ${user.email} (bad password)`, user, status: 'failure', ip: req.ip });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }
    await user.resetLoginAttempts();
    const token = generateToken(user);
    await logAudit({ action: 'user_login', description: `User ${user.email} logged in`, user, ip: req.ip });
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    await logAudit({ action: 'user_login', description: `Failed login for ${req.body.identifier}`, status: 'failure', ip: req.ip });
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }

    const { name, email } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.user._id } 
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email is already taken',
          error: 'EMAIL_ALREADY_EXISTS'
        });
      }
      
      updates.email = email;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', auth, async (req, res) => {
  try {
    // In a more advanced setup, you might want to blacklist the token
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token validity
 * @access  Private
 */
router.get('/verify', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token verification',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

module.exports = router; 