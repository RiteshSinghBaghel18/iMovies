const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { fetchUser, fetchAdmin } = require("../middlewares/fetchUser");

// Public User Auth
router.post("/register", authController.registerUser);
router.post("/user/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/user/login", authController.loginUser);

// Email Verification & Password Recovery
router.get("/verify-email", authController.verifyEmail);
router.post("/verify-email", authController.verifyEmail);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-verification", authController.resendVerification);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Admin Auth
router.post("/admin/login", authController.loginAdmin);
router.post("/admin/register", fetchAdmin, authController.registerAdmin);

// Authenticated User / Admin details
router.get("/me", fetchUser, authController.getMe);

// Admin Moderation & Stats
router.get("/admin/stats", fetchAdmin, authController.getAdminStats);
router.get("/admin/users", fetchAdmin, authController.getAllUsers);

module.exports = router;
