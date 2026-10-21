/**
 * testEmail.js — Diagnostic & Verification script for Brevo Transactional Email Service
 * Usage: node testEmail.js [optional_recipient_email]
 */

require('dotenv').config();
const config = require('./config/emailConfig');
const emailService = require('./services/emailService');

const targetEmail = process.argv[2] || config.senderEmail || 'test@imovies.internal';

console.log('====================================================');
console.log('🎬 iMovies — Brevo Transactional Email Test Runner');
console.log('====================================================');
console.log(`📡 Config Status:    ${config.isConfigured ? '✅ READY' : '❌ INCOMPLETE'}`);
console.log(`🔑 Brevo API Key:     ${config.apiKey ? config.apiKey.substring(0, 15) + '...' : 'NOT FOUND'}`);
console.log(`✉️  Sender Address:   ${config.senderEmail} (${config.senderName})`);
console.log(`🎯 Test Recipient:   ${targetEmail}`);
console.log('====================================================\n');

async function runTests() {
  const validation = config.validateConfig();
  if (!validation.isValid) {
    console.error('❌ Configuration validation failed! Missing:', validation.missing);
    process.exit(1);
  }

  // TEST 1: Booking Confirmation Email
  console.log('⏳ [1/3] Testing Booking Confirmation Email...');
  try {
    const bookingRes = await emailService.sendBookingConfirmationEmail(targetEmail, {
      bookingId: 'IMV-TEST-' + Math.floor(100000 + Math.random() * 900000),
      movieName: 'Avengers: Doomsday (IMAX 3D)',
      theatreName: 'iMovies Dolby Cinema',
      location: 'India',
      showDate: new Date().toISOString().split('T')[0],
      showTime: '08:15 PM',
      selectedSeats: ['B-A1', 'B-A2'],
      totalAmount: 700,
      userName: 'Valued Cinephile'
    });
    console.log('   ✅ Booking Confirmation sent successfully!');
    console.log(`      Message ID: ${bookingRes.messageId}\n`);
  } catch (err) {
    console.error('   ❌ Booking Confirmation Failed:');
    console.error(`      Status: ${err.statusCode || 'N/A'}`);
    console.error(`      Message: ${err.message}`);
    if (err.resolution) console.log(`      💡 Action: ${err.resolution}\n`);
  }

  // TEST 2: Account Verification Email
  console.log('⏳ [2/3] Testing Account Verification Email...');
  try {
    const verifyRes = await emailService.sendVerificationEmail(
      targetEmail,
      'http://localhost:5173/verify?token=SECURE_VERIFY_TOKEN_12345',
      'Cinema Fan'
    );
    console.log('   ✅ Verification email sent successfully!');
    console.log(`      Message ID: ${verifyRes.messageId}\n`);
  } catch (err) {
    console.error('   ❌ Verification Email Failed:');
    console.error(`      Status: ${err.statusCode || 'N/A'}`);
    console.error(`      Message: ${err.message}`);
    if (err.resolution) console.log(`      💡 Action: ${err.resolution}\n`);
  }

  // TEST 3: Password Reset Email
  console.log('⏳ [3/3] Testing Password Reset Email...');
  try {
    const resetRes = await emailService.sendPasswordResetEmail(
      targetEmail,
      'http://localhost:5173/reset-password?token=PASSWORD_RESET_98765',
      'Cinema Fan'
    );
    console.log('   ✅ Password Reset email sent successfully!');
    console.log(`      Message ID: ${resetRes.messageId}\n`);
  } catch (err) {
    console.error('   ❌ Password Reset Email Failed:');
    console.error(`      Status: ${err.statusCode || 'N/A'}`);
    console.error(`      Message: ${err.message}`);
    if (err.resolution) console.log(`      💡 Action: ${err.resolution}\n`);
  }

  console.log('====================================================');
  console.log('🏁 Brevo Test Runner Finished.');
  console.log('====================================================');
}

runTests().catch((e) => {
  console.error('Fatal Test Runner Exception:', e);
});
