const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'labwise_urdu_super_secure_jwt_secret_key_2026';

/**
 * Strict authentication middleware:
 * Requires valid Bearer JWT token in Authorization header.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.',
        });
      }
      return next();
    } catch (error) {
      console.error('[Auth Middleware] Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no bearer token provided.',
    });
  }
};

/**
 * Optional authentication middleware:
 * If Bearer token is provided, verify and attach req.user.
 * If no token is provided, proceed without attaching req.user (for public / guest workflows).
 */
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (token && token !== 'null' && token !== 'undefined') {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      }
    } catch (err) {
      console.warn('[Auth Middleware] Optional token invalid or expired, continuing as guest.');
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
};
