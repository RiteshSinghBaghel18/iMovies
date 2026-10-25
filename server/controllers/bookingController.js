const Show = require("../models/showModel");
const Booking = require("../models/bookingModel");
const Movie = require("../models/movieModel");
const Theatre = require("../models/theatreModel");
const { sendBookingConfirmation } = require("../utils/mailer");
const {
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail,
} = require("../services/emailService");
const { isShowPast } = require("../utils/dateTime");

// Helper to get socket.io instance
const getIO = (req) => {
  return req.app.get("io");
};

// 1. TEMPORARILY LOCK SEATS (TTL 10 mins)
exports.lockSeats = async (req, res) => {
  try {
    const { showId, seats } = req.body;
    const userEmail = req.user.email;

    if (!showId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide showId and an array of seats to lock." });
    }

    const show = await Show.findOne({
      $or: [{ showId }, { _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }],
    });

    if (!show) {
      return res.status(404).json({ success: false, message: "Show not found." });
    }

    // Reject locking seats for past showtimes
    if (isShowPast(show.showDate, show.showTime)) {
      return res.status(400).json({
        success: false,
        message: `This show scheduled for ${show.showDate} at ${show.showTime} has already ended or started. Booking is closed for past shows.`,
      });
    }

    const now = new Date();
    const lockExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

    // Check availability of each seat
    const conflictSeats = [];
    seats.forEach((seatId) => {
      const seat = show.tickets[seatId];
      if (!seat) {
        conflictSeats.push(`${seatId} (invalid seat)`);
      } else if (seat.status === "booked") {
        conflictSeats.push(`${seatId} (already booked)`);
      } else if (seat.status === "locked" && seat.lockedBy !== userEmail && seat.lockExpiresAt && new Date(seat.lockExpiresAt) > now) {
        conflictSeats.push(`${seatId} (locked by another user)`);
      }
    });

    if (conflictSeats.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Seats cannot be locked: ${conflictSeats.join(", ")}`,
        conflicts: conflictSeats,
      });
    }

    // Apply lock
    seats.forEach((seatId) => {
      const seat = show.tickets[seatId];
      seat.status = "locked";
      seat.lockedBy = userEmail;
      seat.lockExpiresAt = lockExpiresAt;
    });

    show.markModified("tickets");
    await show.save();

    // Broadcast live update via Socket.io
    const io = getIO(req);
    if (io) {
      io.to(`show_${show.showId}`).emit("seatsUpdated", {
        showId: show.showId,
        tickets: show.tickets,
        action: "locked",
        seats,
      });
    }

    res.json({
      success: true,
      message: `${seats.length} seat(s) temporarily locked for 10 minutes.`,
      lockExpiresAt,
      lockedSeats: seats,
      tickets: show.tickets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. UNLOCK SEATS (Manual release)
exports.unlockSeats = async (req, res) => {
  try {
    const { showId, seats } = req.body;
    const userEmail = req.user.email;

    if (!showId || !Array.isArray(seats)) {
      return res.status(400).json({ success: false, message: "Please provide showId and seats array." });
    }

    const show = await Show.findOne({
      $or: [{ showId }, { _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }],
    });

    if (!show) {
      return res.status(404).json({ success: false, message: "Show not found." });
    }

    seats.forEach((seatId) => {
      const seat = show.tickets[seatId];
      // Only unlock if locked by this user (or if admin)
      if (seat && (seat.lockedBy === userEmail || req.user.role === "admin")) {
        seat.status = "available";
        seat.lockedBy = null;
        seat.lockExpiresAt = null;
      }
    });

    show.markModified("tickets");
    await show.save();

    const io = getIO(req);
    if (io) {
      io.to(`show_${show.showId}`).emit("seatsUpdated", {
        showId: show.showId,
        tickets: show.tickets,
        action: "unlocked",
        seats,
      });
    }

    res.json({ success: true, message: "Seats unlocked successfully.", tickets: show.tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. CONFIRM BOOKING & PAYMENT
exports.confirmBooking = async (req, res) => {
  try {
    const { showId, selectedSeats, paymentMethod } = req.body;
    const userEmail = req.user.email;

    if (!showId || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid booking request parameters." });
    }

    const show = await Show.findOne({
      $or: [{ showId }, { _id: showId.match(/^[0-9a-fA-F]{24}$/) ? showId : null }],
    });

    if (!show) {
      return res.status(404).json({ success: false, message: "Show not found." });
    }

    // Reject locking seats for past showtimes
    if (isShowPast(show.showDate, show.showTime)) {
      return res.status(400).json({
        success: false,
        message: `This show scheduled for ${show.showDate} at ${show.showTime} has already ended or started. Booking is closed for past shows.`,
      });
    }

    const now = new Date();
    let totalAmount = 0;
    const ticketsData = {};

    // Validate seats
    for (const seatId of selectedSeats) {
      const seat = show.tickets[seatId];
      if (!seat) {
        return res.status(400).json({ success: false, message: `Seat ${seatId} does not exist.` });
      }
      if (seat.status === "booked") {
        return res.status(400).json({ success: false, message: `Seat ${seatId} is already booked!` });
      }
      // Check if locked by someone else
      if (seat.status === "locked" && seat.lockedBy !== userEmail && seat.lockExpiresAt && new Date(seat.lockExpiresAt) > now) {
        return res.status(400).json({ success: false, message: `Seat ${seatId} is currently reserved by someone else.` });
      }

      totalAmount += seat.price || 200;
      ticketsData[seatId] = {
        seatNumber: seat.seatNumber,
        tier: seat.tier,
        price: seat.price,
      };
    }

    // Add convenience fee / tax
    const convenienceFee = Math.round(totalAmount * 0.05); // 5% fee
    const grandTotal = totalAmount + convenienceFee;

    const generatedBookingId = "BK-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

    // Mark seats as booked
    selectedSeats.forEach((seatId) => {
      const seat = show.tickets[seatId];
      seat.status = "booked";
      seat.lockedBy = null;
      seat.lockExpiresAt = null;
      seat.bookingId = generatedBookingId;
    });

    show.markModified("tickets");
    await show.save();

    // Fetch movie and theatre for rich snapshot
    const movie = await Movie.findById(show.movieId);
    let theatre = null;
    if (show.theatreId) {
      theatre = await Theatre.findOne({ theatreId: show.theatreId });
    }

    const booking = await Booking.create({
      bookingId: generatedBookingId,
      userEmail,
      showId: show.showId,
      ticketsData,
      selectedSeats,
      totalAmount: grandTotal,
      paymentStatus: "Completed",
      paymentMethod: paymentMethod || "Credit Card",
      movieDetails: {
        movieId: movie?._id.toString() || show.movieId,
        movieName: movie?.movieName || "Movie",
        posterUrl: movie?.posterUrl || "",
        duration: movie?.duration || "2h 30m",
        language: movie?.language || "English",
      },
      theatreDetails: {
        theatreName: show.theatreName,
        location: theatre?.location || "Main Cinema Multiplex",
      },
      showDate: show.showDate,
      showTime: show.showTime,
    });

    // Notify connected clients via Socket.io
    const io = getIO(req);
    if (io) {
      io.to(`show_${show.showId}`).emit("seatsUpdated", {
        showId: show.showId,
        tickets: show.tickets,
        action: "booked",
        seats: selectedSeats,
      });
    }

    // Send Brevo transactional confirmation email asynchronously
    sendBookingConfirmationEmail(booking.userEmail, booking).catch((err) => {
      console.error("[BookingController] Brevo confirmation email failed:", err.message);
    });
    // Send fallback SMTP if configured
    sendBookingConfirmation(booking).catch(() => {});

    res.status(201).json({
      success: true,
      message: "Ticket booking confirmed successfully!",
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. GET CURRENT USER'S BOOKINGS
exports.getMyBookings = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const bookings = await Booking.find({ userEmail }).sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. GET SINGLE BOOKING BY ID
exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    // Ensure authorized: owner or admin
    if (booking.userEmail !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized to access this booking." });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. CANCEL BOOKING
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.userEmail !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized to cancel this booking." });
    }

    if (booking.paymentStatus === "Cancelled") {
      return res.status(400).json({ success: false, message: "Booking is already cancelled." });
    }

    booking.paymentStatus = "Cancelled";
    await booking.save();

    // Release seats back to show
    const show = await Show.findOne({ showId: booking.showId });
    if (show && show.tickets) {
      booking.selectedSeats.forEach((seatId) => {
        const seat = show.tickets[seatId];
        if (seat && seat.bookingId === bookingId) {
          seat.status = "available";
          seat.lockedBy = null;
          seat.lockExpiresAt = null;
          seat.bookingId = null;
        }
      });
      show.markModified("tickets");
      await show.save();

      const io = getIO(req);
      if (io) {
        io.to(`show_${show.showId}`).emit("seatsUpdated", {
          showId: show.showId,
          tickets: show.tickets,
          action: "cancelled",
          seats: booking.selectedSeats,
        });
      }
    }

    // Send status update email via Brevo
    sendBookingStatusUpdateEmail(booking.userEmail, {
      bookingId: booking.bookingId,
      movieName: booking.movieDetails?.movieName || "Movie",
      status: "Cancelled",
      reason: "Reservation cancelled by user.",
    }).catch((err) => {
      console.error("[BookingController] Cancellation email failed:", err.message);
    });

    res.json({
      success: true,
      message: "Booking has been cancelled and seats released. Refund initiated.",
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. GET ALL PLATFORM BOOKINGS (Admin)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
