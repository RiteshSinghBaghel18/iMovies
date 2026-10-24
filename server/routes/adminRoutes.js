const router = require('express').Router();
const {
  getAllTransactions,
  processRefund,
  getAdminDashboardStats,
  getAllUsers,
  deleteUser
} = require('../controllers/adminController');
const fetchUser = require('../middlewares/fetchUser');

// Admin transaction and refund management routes
router.get('/transactions', fetchUser, getAllTransactions);
router.post('/refund/:paymentId', fetchUser, processRefund);
router.get('/stats', fetchUser, getAdminDashboardStats);

// Admin user directory & account management routes
router.get('/users', fetchUser, getAllUsers);
router.delete('/users/:id', fetchUser, deleteUser);

module.exports = router;
