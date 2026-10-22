const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const Movie = require('../models/movieModel');
const { sendBookingConfirmation } = require('../utils/mailer');
const { isShowExpired } = require('../utils/showTimeHelper');

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_TqZowQCQ3E5us4';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'lSiHHMZDMQB8ZQ88jKqAjyQJ';
  return new Razorpay({ key_id, key_secret });
};

/**
 * Step 2 & 3: Create Razorpay Order
 * POST /api/payment/create-order
 */
const createOrder = async (req, res) => {
  try {
    const {
      showId,
      selectedSeats,
      totalAmount,
      movieId,
      theatreName,
      showDate,
      showTime,
      ticketsData
    } = req.body;

    const userEmail = req.body.userEmail || req.user?.email;

    if (!showId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'showId and an array of selectedSeats are required'
      });
    }

    if (!totalAmount || Number(totalAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid totalAmount greater than 0 is required'
      });
    }

    // Verify show existence
    const show = await Show.findOne({ showId });
    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    if (isShowExpired(show.showDate, show.showTime)) {
      return res.status(400).json({
        success: false,
        message: 'This showtime has already passed and is no longer available for booking.'
      });
    }

    // Convert INR to smallest currency unit (paise)
    const amountInPaise = Math.round(Number(totalAmount) * 100);

    // Initialize Razorpay client
    const razorpay = getRazorpayInstance();
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        showId,
        userEmail: userEmail || 'user@imovies.com',
        seats: selectedSeats.join(', ')
      }
    };

    const order = await razorpay.orders.create(options);

    // Fetch movie name if available
    let resolvedMovieName = 'Cinema Feature';
    if (movieId) {
      try {
        const movieDoc = await Movie.findById(movieId);
        if (movieDoc) resolvedMovieName = movieDoc.movieName;
      } catch (mErr) {
        // non-fatal
      }
    }

    // Create a pending booking record to track the order
    const bookingId = uuidv4();
    const pendingBooking = new Booking({
      bookingId,
      userEmail: userEmail || 'user@imovies.com',
      showId,
      movieId: movieId || show.movieId,
      movieName: resolvedMovieName,
      theatreName: theatreName || show.theatreName,
      showDate: showDate || show.showDate,
      showTime: showTime || show.showTime,
      ticketsData: ticketsData || show.tickets,
      selectedSeats,
      totalAmount: Number(totalAmount),
      paymentStatus: 'Pending',
      paymentMethod: 'Razorpay',
      razorpayOrderId: order.id
    });

    await pendingBooking.save();

    return res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TqZowQCQ3E5us4',
      bookingId,
      booking: pendingBooking
    });
  } catch (error) {
    console.error('[paymentController] Error creating Razorpay order:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize payment order'
    });
  }
};

/**
 * Step 4: Verify Payment Signature & Finalize Booking
 * POST /api/payment/verify
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required'
      });
    }

    // Cryptographic signature verification using HMAC SHA256
    const secret = process.env.RAZORPAY_KEY_SECRET || 'lSiHHMZDMQB8ZQ88jKqAjyQJ';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    const isAuthentic = generatedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error('[paymentController] Invalid signature verification failed');
      if (bookingId || razorpay_order_id) {
        await Booking.findOneAndUpdate(
          { $or: [{ bookingId }, { razorpayOrderId: razorpay_order_id }] },
          { paymentStatus: 'Failed' }
        );
      }
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Signature mismatch'
      });
    }

    // Find and update booking
    let booking = await Booking.findOne({
      $or: [
        { bookingId: bookingId || '' },
        { razorpayOrderId: razorpay_order_id }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Associated booking reservation not found'
      });
    }

    booking.paymentStatus = 'Completed';
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    await booking.save();

    // Mark seats as permanently booked on the show
    const show = await Show.findOne({ showId: booking.showId });
    if (show && show.tickets) {
      const tickets = show.tickets;
      for (const seatId of booking.selectedSeats) {
        if (tickets[seatId]) {
          tickets[seatId] = {
            ...tickets[seatId],
            status: 'booked',
            bookedBy: booking.userEmail,
            bookedAt: new Date(),
            lockedBy: null,
            lockedAt: null
          };
        }
      }
      show.tickets = tickets;
      show.markModified('tickets');
      await show.save();

      // Emit real-time WebSocket seat-update
      try {
        const { io } = require('../server');
        if (io) {
          io.emit('seat-update', { showId: show.showId, tickets: show.tickets });
        }
      } catch (socketErr) {
        console.warn('[Socket] Failed to emit seat-update on payment verify:', socketErr.message);
      }
    }

    // Step 5: Trigger email notification asynchronously
    try {
      await sendBookingConfirmation(booking.userEmail, {
        bookingId: booking.bookingId,
        movieName: booking.movieName || 'Movie',
        theatreName: booking.theatreName,
        showDate: booking.showDate,
        showTime: booking.showTime,
        selectedSeats: booking.selectedSeats,
        totalAmount: booking.totalAmount
      });
    } catch (mailErr) {
      console.warn('[Mailer] Confirmation email warning:', mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and tickets booked successfully!',
      booking
    });
  } catch (error) {
    console.error('[paymentController] Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Payment verification processing error'
    });
  }
};

/**
 * Public Config Endpoint: returns key_id for frontend initialization
 * GET /api/payment/config
 */
const getPaymentConfig = async (req, res) => {
  return res.status(200).json({
    success: true,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TqZowQCQ3E5us4'
  });
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentConfig
};
