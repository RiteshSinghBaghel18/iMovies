const cron = require("node-cron");
const Show = require("../models/showModel");

/**
 * Cleanup expired temporary seat locks
 * @param {object} io - Optional Socket.io instance
 */
const cleanupExpiredLocks = async (io = null) => {
  try {
    const now = new Date();
    const shows = await Show.find({});

    for (const show of shows) {
      let modified = false;
      const tickets = show.tickets;

      if (!tickets) continue;

      if (Array.isArray(tickets)) {
        for (const seat of tickets) {
          if (seat.status === "locked" && seat.lockExpiresAt && new Date(seat.lockExpiresAt) <= now) {
            seat.status = "available";
            delete seat.lockedBy;
            delete seat.lockExpiresAt;
            modified = true;
          }
        }
      } else if (typeof tickets === "object") {
        for (const [seatId, seat] of Object.entries(tickets)) {
          if (seat && seat.status === "locked" && seat.lockExpiresAt && new Date(seat.lockExpiresAt) <= now) {
            seat.status = "available";
            delete seat.lockedBy;
            delete seat.lockExpiresAt;
            modified = true;
          }
        }
      }

      if (modified) {
        show.markModified("tickets");
        await show.save();
        console.log(`[CleanupService] Released expired seat locks for show: ${show.showId}`);

        if (io) {
          io.to(`show_${show.showId}`).emit("seatsUpdated", {
            showId: show.showId,
            tickets: show.tickets,
            message: "Some expired seat locks were released.",
          });
        }
      }
    }
  } catch (error) {
    console.error("[CleanupService] Error releasing expired seat locks:", error.message);
  }
};

/**
 * Start the cleanup cron job (runs every 30 seconds for responsive seat release)
 * @param {object} io - Socket.io instance
 */
const initCleanupCron = (io = null) => {
  // Run every 30 seconds
  const task = cron.schedule("*/30 * * * * *", () => {
    cleanupExpiredLocks(io);
  });

  console.log("[CleanupService] Initialized seat TTL cleanup cron job (every 30s).");
  return task;
};

module.exports = {
  cleanupExpiredLocks,
  initCleanupCron,
};
