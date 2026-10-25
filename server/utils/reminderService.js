const cron = require("node-cron");
const Booking = require("../models/bookingModel");
const { sendShowReminder } = require("./mailer");

/**
 * Check for upcoming shows and send reminder emails
 */
const checkAndSendReminders = async () => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Find active completed bookings for today
    const upcomingBookings = await Booking.find({
      paymentStatus: "Completed",
      showDate: { $regex: new RegExp(today) },
    });

    for (const booking of upcomingBookings) {
      if (!booking.reminderSent) {
        await sendShowReminder(booking.userEmail, booking);
        booking.reminderSent = true;
        await booking.save();
        console.log(`[ReminderService] Reminder sent to ${booking.userEmail} for show ${booking.showId}`);
      }
    }
  } catch (error) {
    console.error("[ReminderService] Error checking show reminders:", error.message);
  }
};

/**
 * Initialize reminder cron job
 * Runs every hour
 */
const initReminderCron = () => {
  const task = cron.schedule("0 * * * *", () => {
    checkAndSendReminders();
  });

  console.log("[ReminderService] Initialized email reminder cron job (every hour).");
  return task;
};

module.exports = {
  checkAndSendReminders,
  initReminderCron,
};
