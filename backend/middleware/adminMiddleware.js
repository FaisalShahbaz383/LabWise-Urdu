/**
 * Admin authorization middleware:
 * Ensures the authenticated user has the 'admin' role.
 * Requires `protect` middleware to run prior to this.
 */
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required.',
    });
  }
};

module.exports = adminMiddleware;
