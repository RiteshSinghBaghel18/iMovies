/**
 * emailRoutes.js — Express routes for Brevo Transactional Email Service
 */

const router = require('express').Router();
const {
  sendOTP,
  sendVerification,
  sendPasswordReset,
  sendBookingConfirmation,
  sendCustomEmail,
  getEmailStatus,
  testEmail
} = require('../controllers/emailController');

// Status & Verification Diagnostics
router.get('/status', getEmailStatus);
router.post('/test', testEmail);

// Core Transactional Email Endpoints
router.post('/otp', sendOTP);
router.post('/verify', sendVerification);
router.post('/reset-password', sendPasswordReset);
router.post('/booking-confirmation', sendBookingConfirmation);
router.post('/send', sendCustomEmail);

module.exports = router;
