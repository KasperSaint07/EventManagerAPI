/**
 * Authentication & Authorization Middleware
 * 
 * auth     - Verifies JWT token and attaches user to request
 * authorize - Checks if user has the required role(s)
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ======================
// AUTH MIDDLEWARE
// ======================

/**
 * Protect routes - verify JWT token
 * Extracts token from Authorization header (Bearer <token>)
 * Attaches user object to req.user
 */
const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    // Check if header exists and starts with "Bearer"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided'
      });
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by id from token and exclude password
    const user = await User.findById(decoded.id).select('-password');

    // Check if user still exists in database
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is invalid'
      });
    }

    // Attach user to request object
    req.user = user;

    // Continue to next middleware/route
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// ======================
// AUTHORIZE MIDDLEWARE
// ======================

/**
 * Restrict access to specific roles
 * Must be used AFTER auth middleware
 * @param  {...string} roles - Allowed roles (e.g. 'organizer', 'super_admin')
 * @returns {Function} Middleware function
 * 
 * Usage example:
 *   router.get('/admin', auth, authorize('super_admin'), controller)
 *   router.get('/manage', auth, authorize('organizer', 'super_admin'), controller)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized`
      });
    }

    // User has the required role, continue
    next();
  };
};

module.exports = { auth, authorize };
