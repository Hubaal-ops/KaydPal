const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Professional JWT Token Verification Middleware
 * Verifies if a valid JWT token is present in the request headers
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      message: 'Token missing or malformed',
      error: 'AUTH_TOKEN_MISSING'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired',
        error: 'AUTH_TOKEN_EXPIRED'
      });
    }
    
    return res.status(403).json({ 
      success: false,
      message: 'Invalid or expired token',
      error: 'AUTH_TOKEN_INVALID'
    });
  }
}

/**
 * Admin Role Verification Middleware
 * Ensures only users with 'admin' role can access the route
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function isAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Admins only',
      error: 'INSUFFICIENT_PERMISSIONS',
      requiredRole: 'admin',
      currentRole: req.user?.role || 'none'
    });
  }
  next();
}

/**
 * User Role Verification Middleware
 * Ensures only users with 'user' role can access the route
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function isUser(req, res, next) {
  if (req.user?.role !== 'user') {
    return res.status(403).json({ 
      success: false,
      message: 'Users only',
      error: 'INSUFFICIENT_PERMISSIONS',
      requiredRole: 'user',
      currentRole: req.user?.role || 'none'
    });
  }
  next();
}

/**
 * Enhanced Authentication Middleware with User Lookup
 * Verifies JWT token and fetches complete user data from database
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.',
        error: 'AUTH_TOKEN_MISSING'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token. User not found.',
        error: 'AUTH_USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Account is deactivated.',
        error: 'AUTH_ACCOUNT_INACTIVE'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired',
        error: 'AUTH_TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token.',
      error: 'AUTH_TOKEN_INVALID'
    });
  }
};

/**
 * Enhanced Admin Authentication Middleware
 * Verifies JWT token, fetches user data, and checks admin role
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. Admin role required.',
          error: 'INSUFFICIENT_PERMISSIONS',
          requiredRole: 'admin',
          currentRole: req.user.role
        });
      }
      next();
    });
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed.',
      error: 'AUTH_FAILED'
    });
  }
};

/**
 * Role-Based Access Control Middleware
 * Allows access based on specified roles
 * 
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required',
        error: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        currentRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Optional Authentication Middleware
 * Sets user data if token is provided, but doesn't require it
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  // Developer 2's required functions (exactly as specified)
  verifyToken,
  isAdmin,
  isUser,
  
  // Enhanced functions for better integration
  auth,
  adminAuth,
  requireRole,
  optionalAuth
}; 