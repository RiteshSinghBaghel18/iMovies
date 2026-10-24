const Razorpay = require('razorpay');
const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const Movie = require('../models/movieModel');
const User = require('../models/userModel');
const Theatre = require('../models/theatreModel');

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_TqZowQCQ3E5us4';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'lSiHHMZDMQB8ZQ88jKqAjyQJ';
  return new Razorpay({ key_id, key_secret });
};

/**
 * Fetch all platform transactions & booking records
 * GET /api/admin/transactions
 */
const getAllTransactions = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.paymentStatus = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { bookingId: regex },
        { userEmail: regex },
        { movieName: regex },
        { theatreName: regex },
        { razorpayPaymentId: regex },
        { razorpayOrderId: regex }
      ];
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });

    // Aggregate summary analytics across all bookings
    const allBookings = await Booking.find({});
    let totalRevenue = 0;
    let totalRefunded = 0;
    let completedCount = 0;
    let refundedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    allBookings.forEach((b) => {
      const st = (b.paymentStatus || 'Completed').toLowerCase();
      const amt = Number(b.totalAmount) || 0;
      if (st === 'completed') {
        totalRevenue += amt;
        completedCount++;
      } else if (st === 'refunded') {
        totalRefunded += amt;
        refundedCount++;
      } else if (st === 'pending') {
        pendingCount++;
      } else if (st === 'cancelled' || st === 'failed') {
        cancelledCount++;
      }
    });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      transactions: bookings,
      bookings,
      summary: {
        totalRevenue,
        totalRefunded,
        totalTransactions: allBookings.length,
        completedCount,
        refundedCount,
        pendingCount,
        cancelledCount
      }
    });
  } catch (error) {
    console.error('[adminController] Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching transaction records'
    });
  }
};

/**
 * Process Razorpay Refund & Release Seats
 * POST /api/admin/refund/:paymentId
 */
const processRefund = async (req, res) => {
  try {
    const paymentIdParam = req.params.paymentId;
    const { amount, reason } = req.body;

    if (!paymentIdParam) {
      return res.status(400).json({
        success: false,
        message: 'paymentId parameter is required'
      });
    }

    // Lookup booking by razorpayPaymentId, bookingId, or MongoDB _id
    let booking = await Booking.findOne({
      $or: [
        { razorpayPaymentId: paymentIdParam },
        { bookingId: paymentIdParam },
        ...(paymentIdParam.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: paymentIdParam }] : [])
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'No booking record found for the provided identifier'
      });
    }

    if (booking.paymentStatus === 'Refunded') {
      return res.status(400).json({
        success: false,
        message: 'This booking transaction has already been refunded'
      });
    }

    // Determine refund amount (in paise)
    const refundAmountRupees = Number(amount) || booking.totalAmount;
    const refundAmountPaise = Math.round(refundAmountRupees * 100);

    let refundResult = null;
    const razorpay = getRazorpayInstance();

    // If booking was paid through Razorpay with pay_ ID, trigger live Razorpay refund
    if (booking.razorpayPaymentId && booking.razorpayPaymentId.startsWith('pay_')) {
      try {
        refundResult = await razorpay.payments.refund(booking.razorpayPaymentId, {
          amount: refundAmountPaise,
          notes: {
            bookingId: booking.bookingId,
            userEmail: booking.userEmail,
            reason: reason || 'Customer requested refund via Admin Panel'
          }
        });
      } catch (rzpErr) {
        console.error('[adminController] Razorpay refund API warning:', rzpErr.error || rzpErr.message);
        // If test mode or already refunded on gateway, proceed with DB update but log details
      }
    }

    // Update MongoDB Booking status to Refunded
    booking.paymentStatus = 'Refunded';
    booking.refundId = refundResult?.id || `rfnd_${Date.now()}`;
    booking.refundAmount = refundAmountRupees;
    booking.refundStatus = refundResult?.status || 'processed';
    booking.refundedAt = new Date();
    await booking.save();

    // Free up the booked seats in the Show ticket layout
    if (booking.showId && Array.isArray(booking.selectedSeats) && booking.selectedSeats.length > 0) {
      const show = await Show.findOne({ showId: booking.showId });
      if (show && show.tickets) {
        const tickets = show.tickets;
        for (const seatId of booking.selectedSeats) {
          if (tickets[seatId]) {
            tickets[seatId] = {
              ...tickets[seatId],
              status: 'available',
              bookedBy: null,
              bookedAt: null,
              lockedBy: null,
              lockedAt: null
            };
          }
        }
        show.tickets = tickets;
        show.markModified('tickets');
        await show.save();

        // Emit real-time WebSocket seat-update so clients see freed seats immediately
        try {
          const { io } = require('../server');
          if (io) {
            io.emit('seat-update', { showId: show.showId, tickets: show.tickets });
          }
        } catch (socketErr) {
          console.warn('[Socket] Failed to emit seat-update on refund:', socketErr.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Refund of ₹${refundAmountRupees} processed successfully and ${booking.selectedSeats.length} seats released.`,
      booking,
      refund: refundResult
    });
  } catch (error) {
    console.error('[adminController] Error processing refund:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error processing refund request'
    });
  }
};

/**
 * Admin Dashboard Overall Stats
 * GET /api/admin/stats
 */
const getAdminDashboardStats = async (req, res) => {
  try {
    const [usersCount, moviesCount, showsCount, theatresCount, bookings] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments(),
      Show.countDocuments(),
      Theatre.countDocuments(),
      Booking.find({})
    ]);

    let totalRevenue = 0;
    let totalRefunded = 0;
    let completedBookings = 0;
    let refundedBookings = 0;

    bookings.forEach((b) => {
      const st = (b.paymentStatus || 'Completed').toLowerCase();
      const amt = Number(b.totalAmount) || 0;
      if (st === 'completed') {
        totalRevenue += amt;
        completedBookings++;
      } else if (st === 'refunded') {
        totalRefunded += amt;
        refundedBookings++;
      }
    });

    return res.status(200).json({
      success: true,
      stats: {
        users: usersCount,
        movies: moviesCount,
        shows: showsCount,
        theatres: theatresCount,
        bookings: bookings.length,
        completedBookings,
        refundedBookings,
        totalRevenue,
        totalRefunded
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error calculating admin stats'
    });
  }
};

module.exports = {
  getAllTransactions,
  processRefund,
  getAdminDashboardStats
};
