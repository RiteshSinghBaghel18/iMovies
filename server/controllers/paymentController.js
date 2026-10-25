const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/bookingModel");
const Show = require("../models/showModel");
const Movie = require("../models/movieModel");
const Theatre = require("../models/theatreModel");
const { sendBookingConfirmation } = require("../utils/mailer");
const { sendBookingConfirmationEmail } = require("../services/emailService");
const { isShowPast } = require("../utils/dateTime");

// Initialize Razorpay client with test credentials
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_TrN3oYMB1qro7m";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "51hFZxESV6J4mA43UAGAyHc0";
  return new Razorpay({ key_id, key_secret });
};

// Helper to get socket.io instance
const getIO = (req) => req.app.get("io");

/**
 * GET /api/payment/get-key
 * Returns public Razorpay Key ID
 */
exports.getKey = (req, res) => {
  res.json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID || "rzp_test_TrN3oYMB1qro7m",
  });
};

/**
 * Step 2 & 3: POST /api/payment/create-order
 * Initializes a Razorpay order with amount (in paise) and currency (INR)
 * Creates a provisional "Pending" booking in MongoDB
 */
exports.createOrder = async (req, res) => {
  try {
    const { showId, selectedSeats, amount } = req.body;
    const userEmail = req.user.email;

    if (!showId || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide showId and an array of selected seats.",
      });
    }

    // Lookup show
    const show = await Show.findOne({
      $or: [
        { showId },
        { _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null },
      ],
    });

    if (!show) {
      return res.status(404).json({ success: false, message: "Show not found." });
    }

    if (isShowPast(show.showDate, show.showTime)) {
      return res.status(400).json({
        success: false,
        message: "This show has already ended or started. Cannot create payment order for past shows.",
      });
    }

    const now = new Date();
    let seatSubtotal = 0;
    const ticketsData = {};

    // Validate that seats exist and are not already booked by another user
    for (const seatId of selectedSeats) {
      const seat = show.tickets[seatId];
      if (!seat) {
        return res.status(400).json({ success: false, message: `Seat ${seatId} does not exist.` });
      }
      if (seat.status === "booked") {
        return res.status(400).json({ success: false, message: `Seat ${seatId} is already booked!` });
      }
      if (
        seat.status === "locked" &&
        seat.lockedBy &&
        seat.lockedBy !== userEmail &&
        seat.lockExpiresAt &&
        new Date(seat.lockExpiresAt) > now
      ) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seatId} is currently reserved by another user.`,
        });
      }

      seatSubtotal += seat.price || 200;
      ticketsData[seatId] = {
        seatNumber: seat.seatNumber,
        tier: seat.tier,
        price: seat.price,
      };
    }

    // Convenience fee (5%) and taxes (2.5%)
    const convenienceFee = Math.round(seatSubtotal * 0.05);
    const taxes = Math.round(seatSubtotal * 0.025);
    const grandTotal = amount ? Number(amount) : (seatSubtotal + convenienceFee + taxes);

    // Convert INR to paise (smallest subunit)
    const amountInPaise = Math.round(grandTotal * 100);

    // Communicate with Razorpay Gateway
    const razorpay = getRazorpayInstance();
    const receiptId = `rcpt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const orderOptions = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        showId: show.showId,
        userEmail,
        seats: selectedSeats.join(","),
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Generate unique iMovies Booking ID
    const generatedBookingId = "BK-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

    // Fetch movie and theatre snapshots
    const movie = await Movie.findById(show.movieId);
    let theatre = null;
    if (show.theatreId) {
      theatre = await Theatre.findOne({ theatreId: show.theatreId });
    }

    // Create provisional "Pending" booking in database
    const provisionalBooking = await Booking.create({
      bookingId: generatedBookingId,
      userEmail,
      showId: show.showId,
      ticketsData,
      selectedSeats,
      totalAmount: grandTotal,
      paymentStatus: "Pending",
      paymentMethod: "Razorpay (Test Mode)",
      razorpayOrderId: razorpayOrder.id,
      movieDetails: {
        movieId: movie?._id.toString() || show.movieId,
        movieName: movie?.movieName || "Movie",
        posterUrl: movie?.posterUrl || "",
        duration: movie?.duration || "2h 30m",
        language: movie?.language || "English",
      },
      theatreDetails: {
        theatreName: show.theatreName,
        location: theatre?.location || "Multiplex Multiplex",
      },
      showDate: show.showDate,
      showTime: show.showTime,
    });

    res.status(201).json({
      success: true,
      message: "Razorpay order created successfully.",
      order: razorpayOrder,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_TrN3oYMB1qro7m",
      bookingId: provisionalBooking.bookingId,
      grandTotal,
      currency: "INR",
    });
  } catch (error) {
    console.error("[Razorpay createOrder Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create Razorpay order.",
    });
  }
};

/**
 * Step 4: POST /api/payment/verify
 * Cryptographic signature verification using HMAC-SHA256
 * Updates booking to "Completed", marks seats as "booked", sends confirmation
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;
    const userEmail = req.user.email;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay verification parameters (order_id, payment_id, signature).",
      });
    }

    // 1. Cryptographic Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET || "51hFZxESV6J4mA43UAGAyHc0";
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isSignatureValid = generatedSignature === razorpay_signature;

    if (!isSignatureValid) {
      // Mark booking as Failed if found
      if (bookingId || razorpay_order_id) {
        await Booking.findOneAndUpdate(
          { $or: [{ bookingId }, { razorpayOrderId: razorpay_order_id }] },
          { paymentStatus: "Failed" }
        );
      }
      return res.status(400).json({
        success: false,
        message: "Cryptographic signature verification failed! Invalid payment signature.",
      });
    }

    // 2. Find the provisional booking
    let booking = await Booking.findOne({
      $or: [
        { bookingId },
        { razorpayOrderId: razorpay_order_id },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Corresponding booking record not found.",
      });
    }

    // 3. Mark booking as Completed
    booking.paymentStatus = "Completed";
    booking.paymentMethod = "Razorpay (Test Mode)";
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpayOrderId = razorpay_order_id;
    booking.razorpaySignature = razorpay_signature;
    booking.transactionId = razorpay_payment_id;
    await booking.save();

    // 4. Mark seats as "booked" in Show document
    const show = await Show.findOne({ showId: booking.showId });
    if (show && show.tickets) {
      booking.selectedSeats.forEach((seatId) => {
        const seat = show.tickets[seatId];
        if (seat) {
          seat.status = "booked";
          seat.lockedBy = null;
          seat.lockExpiresAt = null;
          seat.bookingId = booking.bookingId;
        }
      });
      show.markModified("tickets");
      await show.save();

      // Broadcast real-time availability update via Socket.io
      const io = getIO(req);
      if (io) {
        io.to(`show_${show.showId}`).emit("seatsUpdated", {
          showId: show.showId,
          tickets: show.tickets,
          action: "booked",
          seats: booking.selectedSeats,
        });
      }
    }

    // 5. Send automated confirmation email via Brevo
    sendBookingConfirmationEmail(booking.userEmail, booking).catch((err) => {
      console.error("[PaymentController] Brevo confirmation email failed:", err.message);
    });
    // Fallback mailer
    sendBookingConfirmation(booking).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Payment successfully verified and booking confirmed! 🎉",
      booking,
    });
  } catch (error) {
    console.error("[Razorpay verifyPayment Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error verifying payment signature.",
    });
  }
};
