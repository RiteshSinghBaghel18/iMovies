/**
 * Brevo Transactional Email Integration Test Script
 * Tests all 4 transactional email wrappers:
 * 1. Account Verification Email
 * 2. Password Reset Email
 * 3. Booking Confirmation Email with Digital Ticket
 * 4. Booking Status / Refund Update Email
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const emailConfig = require("../config/emailConfig");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail,
} = require("../services/emailService");

async function runEmailTests() {
  console.log("\n========================================================");
  console.log("🚀 STARTING BREVO TRANSACTIONAL EMAIL VERIFICATION TESTS");
  console.log("========================================================");
  console.log(`[Config] API Key present: ${Boolean(emailConfig.apiKey)}`);
  console.log(`[Config] Sender Email:   ${emailConfig.senderEmail}`);
  const clientUrl = emailConfig.getClientUrl();
  console.log(`[Config] Sender Name:    ${emailConfig.senderName}`);
  console.log(`[Config] Client URL:     ${clientUrl}`);
  console.log("========================================================\n");

  const targetEmail = process.argv[2] || emailConfig.senderEmail;

  try {
    // 1. Account Verification Email
    console.log(`\n--- [TEST 1/4] Testing sendVerificationEmail() ---`);
    const verifyRes = await sendVerificationEmail(
      targetEmail,
      `${clientUrl}/verify-email?token=test_token_verification_12345`,
      "Cinema Fanatic"
    );
    console.log("Test 1 Result:", verifyRes);

    // 2. Password Reset Email
    console.log(`\n--- [TEST 2/4] Testing sendPasswordResetEmail() ---`);
    const resetRes = await sendPasswordResetEmail(
      targetEmail,
      `${clientUrl}/reset-password?token=test_token_reset_67890`,
      "Cinema Fanatic"
    );
    console.log("Test 2 Result:", resetRes);

    // 3. Booking Confirmation Email
    console.log(`\n--- [TEST 3/4] Testing sendBookingConfirmationEmail() ---`);
    const bookingRes = await sendBookingConfirmationEmail(targetEmail, {
      bookingId: "BK-LIVE-" + Date.now().toString(36).toUpperCase(),
      movieDetails: {
        movieName: "Gladiator II",
        duration: "2h 28m",
        language: "English",
        posterUrl: "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
      },
      theatreDetails: {
        theatreName: "PVR Directors Cut",
        location: "Mall of the Emirates, Screen 1",
      },
      showDate: "Tomorrow",
      showTime: "8:00 PM",
      selectedSeats: ["VIP-1", "VIP-2"],
      totalAmount: 1100,
      paymentMethod: "Razorpay (Test Mode)",
    });
    console.log("Test 3 Result:", bookingRes);

    // 4. Status Update / Refund Email
    console.log(`\n--- [TEST 4/4] Testing sendBookingStatusUpdateEmail() ---`);
    const statusRes = await sendBookingStatusUpdateEmail(targetEmail, {
      bookingId: "BK-REF-55442",
      movieName: "Avatar: The Way of Water",
      status: "Refunded",
      reason: "Show cancelled due to auditorium technical maintenance",
      refundAmount: 950,
      refundId: "rfnd_test_maintenance_01",
    });
    console.log("Test 4 Result:", statusRes);

    console.log("\n========================================================");
    console.log("✅ ALL 4 BREVO TRANSACTIONAL EMAIL FLOWS TESTED SUCCESSFULLY!");
    console.log("========================================================\n");
  } catch (err) {
    console.error("❌ Test suite encountered an error:", err);
  }
}

runEmailTests();
