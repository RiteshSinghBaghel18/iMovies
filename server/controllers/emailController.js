/**
 * Email Controller
 * Exposes endpoints for email service health checks, testing, and manual dispatches.
 */

const emailConfig = require("../config/emailConfig");
const {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail,
} = require("../services/emailService");

/**
 * GET /api/email/status
 * Returns current configuration status and Brevo readiness
 */
exports.getEmailStatus = async (req, res) => {
  try {
    const isConfigured = emailConfig.isConfigured();
    res.json({
      success: true,
      service: "Brevo (Sendinblue) Transactional Mailer",
      isConfigured,
      senderEmail: emailConfig.senderEmail,
      senderName: emailConfig.senderName,
      hasApiKey: Boolean(emailConfig.apiKey),
      apiKeyPrefix: emailConfig.apiKey ? emailConfig.apiKey.substring(0, 12) + "..." : null,
      clientUrl: emailConfig.clientUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/email/test
 * Sends a live transactional test email via Brevo to verify credentials
 */
exports.sendTestEmail = async (req, res) => {
  try {
    const { to, type = "generic" } = req.body;
    const recipient = to || emailConfig.senderEmail;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: "Please provide a recipient email address in 'to'.",
      });
    }

    let result;

    const clientUrl = emailConfig.getClientUrl(req);

    switch (type) {
      case "verification":
        result = await sendVerificationEmail(
          recipient,
          `${clientUrl}/verify-email?token=sample_test_token_12345`,
          "Test Cinephile"
        );
        break;

      case "password_reset":
        result = await sendPasswordResetEmail(
          recipient,
          `${clientUrl}/reset-password?token=sample_reset_token_67890`,
          "Test Cinephile"
        );
        break;

      case "booking_confirmation":
        result = await sendBookingConfirmationEmail(recipient, {
          bookingId: "BK-TEST-" + Date.now().toString(36).toUpperCase(),
          movieDetails: {
            movieName: "Dune: Part Two",
            duration: "2h 46m",
            language: "English",
            posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
          },
          theatreDetails: {
            theatreName: "IMAX Laser Cinema 4D",
            location: "Downtown City Center",
          },
          showDate: "Tomorrow",
          showTime: "07:30 PM",
          selectedSeats: ["B4", "B5"],
          totalAmount: 640,
          paymentMethod: "Razorpay (Test Mode)",
        });
        break;

      case "status_update":
        result = await sendBookingStatusUpdateEmail(recipient, {
          bookingId: "BK-REFUND-999",
          movieName: "Interstellar",
          status: "Refunded",
          reason: "Customer requested cancellation before showtime",
          refundAmount: 500,
          refundId: "rfnd_test_demo123",
        });
        break;

      default:
        result = await sendEmail({
          to: recipient,
          subject: "🧪 iMovies Brevo Transactional Service Verification",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; background: #0b0f19; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 550px; margin: auto;">
              <h2 style="color: #ef4444; margin-top: 0;">iMovies Transactional Email Test 🚀</h2>
              <p style="color: #cbd5e1;">This is a test notification confirming that the <strong>Brevo (Sendinblue)</strong> integration is operating successfully in your iMovies platform.</p>
              <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #94a3b8; font-size: 13px;">Provider: <strong>@getbrevo/brevo SDK</strong></p>
                <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Sender: <strong>${emailConfig.senderName} (${emailConfig.senderEmail})</strong></p>
                <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Timestamp: <strong>${new Date().toLocaleString()}</strong></p>
              </div>
              <p style="color: #10b981; font-weight: bold; margin: 0;">Everything is working as expected!</p>
            </div>
          `,
          textContent: "iMovies Brevo Transactional Test Email. Your Brevo integration is working properly!",
        });
        break;
    }

    res.status(200).json({
      success: true,
      message: `Test email (${type}) processed successfully.`,
      recipient,
      details: result,
    });
  } catch (error) {
    console.error("[EmailController sendTestEmail Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process test email.",
    });
  }
};
