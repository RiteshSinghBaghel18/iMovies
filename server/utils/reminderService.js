const cron = require('node-cron');
const Booking = require('../models/bookingModel');
const Movie = require('../models/movieModel');
const { sendReminder } = require('./mailer');

// Run every hour
cron.schedule('0 * * * *', async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const bookings = await Booking.find({ showDate: tomorrowStr, paymentStatus: 'Completed' });
    console.log(`[ReminderService] Sending reminders for ${bookings.length} bookings`);
    for (const booking of bookings) {
      let movieName = 'Your Movie';
      try {
        if (booking.movieId) {
          const movie = await Movie.findById(booking.movieId);
          if (movie && movie.movieName) {
            movieName = movie.movieName;
          }
        }
      } catch (movieErr) {
        // Fallback to default movie name if lookup fails
      }

      await sendReminder(booking.userEmail, {
        movieName,
        showDate: booking.showDate,
        showTime: booking.showTime,
        theatreName: booking.theatreName
      });
    }
  } catch (err) {
    console.error('[ReminderService] Error:', err.message);
  }
});

console.log('[ReminderService] Email reminder scheduler started');
