const router = require('express').Router();
const {
  registerUser,
  verifyEmail,
  resendVerification,
  loginUser,
  registerAdmin,
  loginAdmin,
  forgotPassword,
  resetPassword,
  updateProfile,
  validateToken,
  getAdminStats
} = require('../controllers/authController');
const fetchUser = require('../middlewares/fetchUser');

// Authentication routes
router.post('/register', registerUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', loginUser);
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

// Password recovery routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Profile management routes
router.put('/profile', fetchUser, updateProfile);

// Token & Admin routes
router.get('/validate', fetchUser, validateToken);
router.get('/admin/stats', fetchUser, getAdminStats);

// User directory & management (Admin)
const { getAllUsers, deleteUser } = require('../controllers/adminController');
router.get('/users', fetchUser, getAllUsers);
router.delete('/users/:id', fetchUser, deleteUser);

module.exports = router;
