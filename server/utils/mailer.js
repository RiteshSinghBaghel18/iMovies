const nodemailer = require('nodemailer');
const emailService = require('../services/emailService');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendBookingConfirmation = async (to, bookingDetails) => {
  try {
    // Primary: Send via official Brevo Transactional Email Service
    return await emailService.sendBookingConfirmationEmail(to, bookingDetails);
  } catch (brevoErr) {
    console.warn('[mailer] Brevo email dispatch warning, attempting fallback:', brevoErr.message);
    const { bookingId, movieName, theatreName, showDate, showTime, selectedSeats, totalAmount } = bookingDetails;
    const mailOptions = {
      from: `"iMovies" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`,
      to,
      subject: '🎬 iMovies - Booking Confirmed!',
      html: `<div style="font-family:Arial,sans-serif;background:#09090b;color:#fff;padding:30px;border:1px solid #27272a;"><h1 style="color:#ff6600;">🎬 iMovies</h1><h2>Booking Confirmed!</h2><p><strong>Booking ID:</strong> ${bookingId}</p><p><strong>Movie:</strong> ${movieName}</p><p><strong>Theatre:</strong> ${theatreName}</p><p><strong>Date:</strong> ${showDate}</p><p><strong>Time:</strong> ${showTime}</p><p><strong>Seats:</strong> ${Array.isArray(selectedSeats) ? selectedSeats.join(', ') : selectedSeats}</p><p><strong>Total:</strong> ₹${totalAmount}</p><p style="color:#aaa">Enjoy your movie! 🍿</p></div>`
    };
    return transporter.sendMail(mailOptions);
  }
};

const sendReminder = async (to, showDetails) => {
  const { movieName, showDate, showTime, theatreName } = showDetails;
  try {
    return await emailService.sendEmail({
      to,
      subject: `🎬 iMovies Reminder: ${movieName} Tomorrow!`,
      htmlContent: `<div style="font-family:Arial,sans-serif;background:#09090b;color:#fff;padding:30px;border:1px solid #27272a;"><h1 style="color:#ff6600;">🎬 iMovies</h1><h2>Your movie is tomorrow!</h2><p><strong>Movie:</strong> ${movieName}</p><p><strong>Theatre:</strong> ${theatreName}</p><p><strong>Date:</strong> ${showDate}</p><p><strong>Time:</strong> ${showTime}</p><p>Don't forget to arrive 15 minutes early! 🎟️</p></div>`
    });
  } catch (brevoErr) {
    const mailOptions = {
      from: `"iMovies" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`,
      to,
      subject: '🎬 iMovies - Movie Reminder Tomorrow!',
      html: `<div style="font-family:Arial,sans-serif;background:#09090b;color:#fff;padding:30px;border:1px solid #27272a;"><h1 style="color:#ff6600;">🎬 iMovies</h1><h2>Your movie is tomorrow!</h2><p><strong>Movie:</strong> ${movieName}</p><p><strong>Theatre:</strong> ${theatreName}</p><p><strong>Date:</strong> ${showDate}</p><p><strong>Time:</strong> ${showTime}</p><p>Don't forget to arrive 15 minutes early! 🎟️</p></div>`
    };
    return transporter.sendMail(mailOptions);
  }
};

module.exports = { sendBookingConfirmation, sendReminder };
