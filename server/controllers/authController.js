const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');
const Movie = require('../models/movieModel');
const Theatre = require('../models/theatreModel');
const Show = require('../models/showModel');
const Booking = require('../models/bookingModel');
const emailService = require('../services/emailService');

// Register a new user (with mandatory Brevo email verification)
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    // Check if verified user exists
    const existingUser = await User.findOne({ $or: [{ email: cleanEmail }, { username: cleanUsername }] });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: existingUser.email === cleanEmail ? 'Email already registered' : 'Username already taken'
        });
      }

      // If user exists but is unverified, regenerate token & resend verification
      const salt = await bcrypt.genSalt(10);
      existingUser.password = await bcrypt.hash(password, salt);
      existingUser.username = cleanUsername;
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      existingUser.verificationToken = verificationCode;
      existingUser.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await existingUser.save();

      const actionUrl = `http://localhost:5173/verify?token=${verificationCode}&email=${encodeURIComponent(cleanEmail)}`;
      try {
        await emailService.sendVerificationEmail(cleanEmail, verificationCode, cleanUsername, actionUrl);
      } catch (mailErr) {
        console.warn('[authController] Brevo verification email dispatch warning:', mailErr.message);
      }

      return res.status(200).json({
        success: true,
        requireVerification: true,
        email: cleanEmail,
        message: 'A verification link has been sent to your email. Please verify to activate your account.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6-digit verification code / token
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      isVerified: false,
      verificationToken: verificationCode,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const actionUrl = `http://localhost:5173/verify?token=${verificationCode}&email=${encodeURIComponent(cleanEmail)}`;
    try {
      await emailService.sendVerificationEmail(cleanEmail, verificationCode, cleanUsername, actionUrl);
    } catch (mailErr) {
      console.warn('[authController] Brevo verification email dispatch warning:', mailErr.message);
    }

    return res.status(201).json({
      success: true,
      requireVerification: true,
      email: user.email,
      message: 'Account created! Please check your email to verify and activate your account before signing in.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

// Verify email address with token or 6-digit code
const verifyEmail = async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    const user = await User.findOne({
      email: cleanEmail,
      verificationToken: cleanToken,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new one.'
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, username: user.username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully! Welcome to iMovies.',
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: 'user'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error during verification' });
  }
};

// Resend verification email
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account registered with this email address.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'This account is already verified. Please sign in.' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationToken = verificationCode;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const actionUrl = `http://localhost:5173/verify?token=${verificationCode}&email=${encodeURIComponent(cleanEmail)}`;
    try {
      await emailService.sendVerificationEmail(cleanEmail, verificationCode, user.username, actionUrl);
    } catch (mailErr) {
      console.warn('[authController] Brevo resend warning:', mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'A new verification code has been dispatched to your email address.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error resending verification email.' });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    // Mandatory Email Verification Check
    if (user.isVerified === false) {
      return res.status(403).json({
        success: false,
        isUnverified: true,
        email: user.email,
        message: 'Your account is not verified yet. Please verify your email address to log in.'
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: 'user'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error during login' });
  }
};

// Register admin
const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: existingAdmin.email === email ? 'Admin email already registered' : 'Admin username already taken'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword
    });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        role: 'admin'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error during admin registration' });
  }
};

// Login admin
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin logged in successfully',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        role: 'admin'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error during admin login' });
  }
};

// Forgot Password — Generates reset token and dispatches Brevo recovery email
const forgotPassword = async (req, res) => {
  try {
    const { email, role = 'user' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const Model = role === 'admin' ? Admin : User;
    const account = await Model.findOne({ email: cleanEmail });

    if (!account) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email address, a password recovery link has been dispatched.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    account.resetPasswordToken = resetToken;
    account.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await account.save();

    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}&role=${role}`;
    try {
      await emailService.sendPasswordResetEmail(cleanEmail, resetToken, account.username, resetLink);
    } catch (mailErr) {
      console.warn('[authController] Brevo reset email error:', mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'A secure password recovery link has been sent to your email.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error processing forgot password.' });
  }
};

// Reset Password — Verifies token and updates password
const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword, role = 'user' } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, token, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();
    const Model = role === 'admin' ? Admin : User;

    const account = await Model.findOne({
      email: cleanEmail,
      resetPasswordToken: cleanToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!account) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link. Please request a new one.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    account.password = await bcrypt.hash(newPassword, salt);
    account.resetPasswordToken = null;
    account.resetPasswordExpires = null;
    await account.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully! You can now sign in with your new password.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error resetting password.' });
  }
};

// Update Profile (Change Name and/or Password)
const updateProfile = async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const role = req.user.role || 'user';

    const Model = role === 'admin' ? Admin : User;
    const account = await Model.findById(userId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    const updatedFields = [];

    // 1. Change username
    if (username && username.trim() !== account.username) {
      const cleanUsername = username.trim();
      const existing = await Model.findOne({ username: cleanUsername, _id: { $ne: userId } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Username is already taken by another user.' });
      }
      account.username = cleanUsername;
      updatedFields.push('name');
    }

    // 2. Change password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, account.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      }
      const salt = await bcrypt.genSalt(10);
      account.password = await bcrypt.hash(newPassword, salt);
      updatedFields.push('password');
    }

    if (updatedFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No profile updates were provided.' });
    }

    await account.save();

    return res.status(200).json({
      success: true,
      message: `Profile updated successfully (${updatedFields.join(' & ')} updated).`,
      user: {
        id: account._id,
        email: account.email,
        username: account.username,
        role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error updating profile.' });
  }
};

// Validate token and return decoded user info
const validateToken = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error validating token' });
  }
};

// Aggregate counts and stats for admin dashboard
const getAdminStats = async (req, res) => {
  try {
    const [users, admins, movies, theatres, shows, bookings, revenueData] = await Promise.all([
      User.countDocuments(),
      Admin.countDocuments(),
      Movie.countDocuments(),
      Theatre.countDocuments(),
      Show.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { paymentStatus: 'Completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ])
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    return res.status(200).json({
      success: true,
      stats: {
        users,
        admins,
        movies,
        theatres,
        shows,
        bookings,
        totalRevenue
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching stats' });
  }
};

module.exports = {
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
};
