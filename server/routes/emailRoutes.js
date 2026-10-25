const express = require("express");
const router = express.Router();
const emailController = require("../controllers/emailController");
const authController = require("../controllers/authController");

// Status & Health
router.get("/status", emailController.getEmailStatus);

// Test Dispatch
router.post("/test", emailController.sendTestEmail);

// Resend verification convenience endpoint
router.post("/resend-verification", authController.resendVerification);

module.exports = router;
