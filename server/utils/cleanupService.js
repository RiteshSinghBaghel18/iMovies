const cron = require('node-cron');
const Show = require('../models/showModel');

// Run every minute to release expired seat locks (older than 10 min)
cron.schedule('* * * * *', async () => {
  try {
    const shows = await Show.find({});
    const TEN_MINUTES = 10 * 60 * 1000;
    let releasedCount = 0;
    for (const show of shows) {
      let modified = false;
      const tickets = show.tickets || {};
      for (const seatId in tickets) {
        const seat = tickets[seatId];
        if (seat.status === 'locked' && seat.lockedAt && (Date.now() - new Date(seat.lockedAt).getTime()) > TEN_MINUTES) {
          tickets[seatId] = { ...tickets[seatId], status: 'available', lockedBy: null, lockedAt: null };
          modified = true;
          releasedCount++;
        }
      }
      if (modified) {
        show.tickets = tickets;
        show.markModified('tickets');
        await show.save();
      }
    }
    if (releasedCount > 0) console.log(`[CleanupService] Released ${releasedCount} expired seat locks`);
  } catch (err) {
    console.error('[CleanupService] Error:', err.message);
  }
});

console.log('[CleanupService] Seat lock cleanup scheduler started');
