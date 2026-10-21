const router = require('express').Router();
const {
  createOrder,
  verifyPayment,
  getPaymentConfig
} = require('../controllers/paymentController');
const fetchUser = require('../middlewares/fetchUser');

// Payment routes
router.get('/config', getPaymentConfig);
router.post('/create-order', fetchUser, createOrder);
router.post('/verify', fetchUser, verifyPayment);

module.exports = router;
