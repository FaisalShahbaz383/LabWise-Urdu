const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getAllUsers,
  updateUserRole,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public auth endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private authenticated user endpoints
router.get('/me', protect, getMe);

// Admin user management endpoints
router.get('/users', protect, adminMiddleware, getAllUsers);
router.put('/users/:id/role', protect, adminMiddleware, updateUserRole);

module.exports = router;
