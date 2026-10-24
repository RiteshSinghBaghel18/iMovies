const router = require('express').Router();
const {
  getAllTransactions,
  processRefund,
  getAdminDashboardStats
} = require('../controllers/adminController');
const fetchUser = require('../middlewares/fetchUser');

// Admin transaction and refund management routes
router.get('/transactions', fetchUser, getAllTransactions);
router.post('/refund/:paymentId', fetchUser, processRefund);
router.get('/stats', fetchUser, getAdminDashboardStats);

module.exports = router;
