const nodemailer = require("nodemailer");

let transporter = null;

// Initialize transporter
const initMailer = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log("[Mailer] Configured with custom SMTP host.");
  } else {
    // Fallback Ethereal test account or simulated logger
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log("[Mailer] Configured with Ethereal Test Account:", testAccount.user);
    } catch (err) {
      console.warn("[Mailer] Could not create Ethereal account, falling back to simulated mailer:", err.message);
      transporter = {
        sendMail: async (opts) => {
          console.log(`[Simulated Email Sent] To: ${opts.to} | Subject: ${opts.subject}`);
          return { messageId: "simulated-" + Date.now() };
        },
      };
    }
  }
};

initMailer().catch((e) => console.error("Mailer init error:", e));

/**
 * Send Booking Confirmation Email
 */
const sendBookingConfirmation = async (booking) => {
  try {
    if (!transporter) await initMailer();

    const mailOptions = {
      from: '"iMovies Box Office" <no-reply@imovies.com>',
      to: booking.userEmail,
      subject: `🎟️ Booking Confirmed: ${booking.movieDetails?.movieName || "Movie Ticket"} - Booking #${booking.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto;">
          <div style="text-align: center; border-bottom: 2px solid #e50914; padding-bottom: 15px;">
            <h1 style="color: #e50914; margin: 0; font-size: 28px; letter-spacing: 2px;">iMovies</h1>
            <p style="color: #9ca3af; margin: 5px 0 0;">Movie ticket booking made simple</p>
          </div>
          
          <div style="padding: 20px 0;">
            <h2 style="color: #ffffff; margin-top: 0;">Your Booking is Confirmed! 🎉</h2>
            <p style="color: #d1d5db;">Thank you for booking with iMovies. Here are your booking details:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; color: #e5e7eb;">
              <tr>
                <td style="padding: 8px 0; color: #9ca3af;">Booking ID:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #e50914;">${booking.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #9ca3af;">Movie:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.movieDetails?.movieName || "Movie"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #9ca3af;">Theatre:</td>
                <td style="padding: 8px 0; text-align: right;">${booking.theatreDetails?.theatreName || "Cinema Hall"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #9ca3af;">Date & Time:</td>
                <td style="padding: 8px 0; text-align: right;">${booking.showDate} at ${booking.showTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #9ca3af;">Seats Reserved:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #10b981;">${booking.selectedSeats?.join(", ") || "N/A"}</td>
              </tr>
              <tr style="border-top: 1px solid #374151;">
                <td style="padding: 12px 0 0; font-size: 16px; color: #9ca3af;">Total Paid:</td>
                <td style="padding: 12px 0 0; font-size: 18px; font-weight: bold; text-align: right; color: #fbbf24;">₹${booking.totalAmount}</td>
              </tr>
            </table>

            <div style="margin-top: 25px; padding: 15px; background-color: #1f2937; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">Show your Digital Ticket or Booking ID at the cinema entrance.</p>
              <p style="margin: 5px 0 0; color: #d1d5db; font-size: 14px; font-weight: bold;">Gate opens 20 minutes before showtime.</p>
            </div>
          </div>

          <div style="border-top: 1px solid #374151; padding-top: 15px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} iMovies Inc. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Confirmation sent to ${booking.userEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("[Mailer] Error sending confirmation email:", error.message);
    return null;
  }
};

/**
 * Send Upcoming Show Reminder Email
 */
const sendShowReminder = async (userEmail, booking) => {
  try {
    if (!transporter) await initMailer();

    const mailOptions = {
      from: '"iMovies Reminders" <reminders@imovies.com>',
      to: userEmail,
      subject: `🍿 Reminder: Your movie starts soon! - ${booking.movieDetails?.movieName || "Upcoming Movie"}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 25px; border-radius: 12px; max-width: 600px; margin: auto;">
          <h2 style="color: #e50914; margin-top: 0;">Don't Forget the Popcorn! 🍿</h2>
          <p style="color: #d1d5db;">This is a friendly reminder that your show is scheduled for today:</p>
          <div style="background-color: #1f2937; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0; color: #ffffff;"><strong>Movie:</strong> ${booking.movieDetails?.movieName || "Movie"}</p>
            <p style="margin: 5px 0; color: #ffffff;"><strong>Theatre:</strong> ${booking.theatreDetails?.theatreName || "Cinema Hall"}</p>
            <p style="margin: 5px 0; color: #ffffff;"><strong>Time:</strong> ${booking.showTime}</p>
            <p style="margin: 5px 0; color: #10b981;"><strong>Seats:</strong> ${booking.selectedSeats?.join(", ")}</p>
          </div>
          <p style="color: #9ca3af; font-size: 13px;">Please arrive 15 minutes before the show to ensure smooth entry.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Reminder sent to ${userEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("[Mailer] Error sending reminder email:", error.message);
    return null;
  }
};

module.exports = {
  sendBookingConfirmation,
  sendShowReminder,
};
