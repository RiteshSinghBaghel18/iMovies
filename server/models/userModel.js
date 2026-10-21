const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, minlength: 3, maxlength: 20, unique: true, trim: true },
  email: { type: String, required: true, unique: true, maxlength: 50, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  favorites: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationTokenExpires: { type: Date, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
