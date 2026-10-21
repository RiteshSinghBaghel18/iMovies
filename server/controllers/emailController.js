/**
 * emailController.js — Controller handling Brevo transactional email endpoints
 */

const emailService = require('../services/emailService');
const config = require('../config/emailConfig');

/**
 * Send Dedicated Clean OTP Email
 * POST /api/email/otp
 */
const sendOTP = async (req, res) => {
  try {
    const { email, otp, name, templateId } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required.'
      });
    }

    // Clean primitive OTP code (e.g. "482910") decoupled from email
    const rawOtp = otp || Math.floor(100000 + Math.random() * 900000).toString();
    const cleanOtp = String(rawOtp).trim().split('&')[0].replace(/^.*=/, '').trim();
    const cleanEmail = email.trim().toLowerCase();

    const response = await emailService.sendOTPEmail(cleanEmail, cleanOtp, name, templateId);

    return res.status(200).json({
      success: true,
      message: 'Clean OTP verification code dispatched successfully via Brevo.',
      otp: cleanOtp,
      email: cleanEmail,
      data: response
    });
  } catch (error) {
    console.error('[emailController] sendOTP error:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to dispatch OTP verification code.',
      resolution: error.resolution || null,
      details: error.details || null
    });
  }
};

/**
 * Send Account Verification Email
 * POST /api/email/verify
 */
const sendVerification = async (req, res) => {
  try {
    const { email, token, otp, link, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required.'
      });
    }

    const verificationTokenOrOtp = token || otp || link || Math.floor(100000 + Math.random() * 900000).toString();
    const cleanEmail = email.trim().toLowerCase();

    const response = await emailService.sendVerificationEmail(cleanEmail, verificationTokenOrOtp, name, link || null);

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully via Brevo.',
      email: cleanEmail,
      data: response
    });
  } catch (error) {
    console.error('[emailController] sendVerification error:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to send verification email.',
      resolution: error.resolution || null,
      details: error.details || null
    });
  }
};

/**
 * Send Password Reset Email
 * POST /api/email/reset-password
 */
const sendPasswordReset = async (req, res) => {
  try {
    const { email, token, link, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required.'
      });
    }

    const resetTokenOrLink = link || token || 'RESET_' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const response = await emailService.sendPasswordResetEmail(email, resetTokenOrLink, name);

    return res.status(200).json({
      success: true,
      message: 'Password reset recovery email sent successfully via Brevo.',
      data: response
    });
  } catch (error) {
    console.error('[emailController] sendPasswordReset error:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to send password reset email.',
      resolution: error.resolution || null,
      details: error.details || null
    });
  }
};

/**
 * Send Booking Confirmation Receipt Email
 * POST /api/email/booking-confirmation
 */
const sendBookingConfirmation = async (req, res) => {
  try {
    const { email, bookingDetails } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required.'
      });
    }

    if (!bookingDetails || typeof bookingDetails !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'bookingDetails object is required (including movieName, bookingId, showDate, showTime, selectedSeats, totalAmount).'
      });
    }

    const response = await emailService.sendBookingConfirmationEmail(email, bookingDetails);

    return res.status(200).json({
      success: true,
      message: 'Booking confirmation email sent successfully via Brevo.',
      data: response
    });
  } catch (error) {
    console.error('[emailController] sendBookingConfirmation error:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to send booking confirmation email.',
      resolution: error.resolution || null,
      details: error.details || null
    });
  }
};

/**
 * Send Custom Transactional Email
 * POST /api/email/send
 */
const sendCustomEmail = async (req, res) => {
  try {
    const { to, subject, htmlContent, textContent, params, replyTo, tags } = req.body;

    if (!to || !subject || !htmlContent) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: "to", "subject", and "htmlContent" are mandatory.'
      });
    }

    const response = await emailService.sendEmail({
      to,
      subject,
      htmlContent,
      textContent,
      params,
      replyTo,
      tags
    });

    return res.status(200).json({
      success: true,
      message: 'Custom transactional email sent successfully.',
      data: response
    });
  } catch (error) {
    console.error('[emailController] sendCustomEmail error:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to send custom email.',
      resolution: error.resolution || null,
      details: error.details || null
    });
  }
};

/**
 * Get Brevo Service Status & Diagnostics
 * GET /api/email/status
 */
const getEmailStatus = async (req, res) => {
  return res.status(200).json({
    success: true,
    provider: 'Brevo (Sendinblue)',
    isConfigured: config.isConfigured,
    senderEmail: config.senderEmail,
    senderName: config.senderName,
    hasApiKey: Boolean(config.apiKey)
  });
};

/**
 * Quick Test Trigger Endpoint
 * POST /api/email/test
 */
const testEmail = async (req, res) => {
  try {
    const recipient = req.body.email || config.senderEmail;
    const response = await emailService.sendBookingConfirmationEmail(recipient, {
      bookingId: 'TEST-' + Math.floor(100000 + Math.random() * 900000),
      movieName: 'Avengers: Doomsday (Test Booking)',
      theatreName: 'iMovies Dolby Cinema',
      location: 'India',
      showDate: new Date().toISOString().split('T')[0],
      showTime: '08:00 PM',
      selectedSeats: ['B-A1', 'B-A2'],
      totalAmount: 700
    });

    return res.status(200).json({
      success: true,
      message: `Test booking confirmation email sent to ${recipient}`,
      data: response
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
      resolution: error.resolution || null,
      details: error.details || null
    });
  }
};

module.exports = {
  sendOTP,
  sendVerification,
  sendPasswordReset,
  sendBookingConfirmation,
  sendCustomEmail,
  getEmailStatus,
  testEmail
};
