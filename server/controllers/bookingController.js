const { v4: uuidv4 } = require('uuid');
const Show = require('../models/showModel');
const Booking = require('../models/bookingModel');
const Movie = require('../models/movieModel');
const { sendBookingConfirmation } = require('../utils/mailer');
const { isShowExpired } = require('../utils/showTimeHelper');

// Lock seats for booking process
const lockSeats = async (req, res) => {
  try {
    const { showId, selectedSeats } = req.body;
    const userEmail = req.body.userEmail || req.user?.email;

    if (!showId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'showId and an array of selectedSeats are required'
      });
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'userEmail is required to lock seats'
      });
    }

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
        message: 'This showtime has already passed and is no longer available for seat selection or booking.'
      });
    }

    const tickets = show.tickets || {};

    // Validate that each seat is available (or already locked by this same user)
    for (const seatId of selectedSeats) {
      const seat = tickets[seatId];
      if (!seat) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seatId} does not exist in this show`
        });
      }

      if (seat.status !== 'available' && !(seat.status === 'locked' && seat.lockedBy === userEmail)) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seatId} already taken`
        });
      }
    }

    // Mark seats as locked
    for (const seatId of selectedSeats) {
      tickets[seatId] = {
        ...tickets[seatId],
        status: 'locked',
        lockedBy: userEmail,
        lockedAt: new Date()
      };
    }

    show.tickets = tickets;
    show.markModified('tickets');
    await show.save();

    // Emit socket event to notify other clients in real time
    try {
      const { io } = require('../server');
      if (io) {
        io.emit('seat-update', { showId, tickets: show.tickets });
      }
    } catch (socketErr) {
      console.error('[Socket] Failed to emit seat-update:', socketErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Seats locked',
      show
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error locking seats'
    });
  }
};

// Create confirmed booking
const createBooking = async (req, res) => {
  try {
    const {
      showId,
      selectedSeats,
      totalAmount,
      ticketsData,
      movieId,
      theatreName,
      showDate,
      showTime
    } = req.body;

    const userEmail = req.body.userEmail || req.user?.email;

    if (!showId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'showId and selectedSeats are required'
      });
    }

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
        message: 'This showtime has already passed. Tickets cannot be booked for past shows.'
      });
    }

    const tickets = show.tickets || {};

    // Verify each seat is still locked by this user
    for (const seatId of selectedSeats) {
      const seat = tickets[seatId];
      if (!seat) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seatId} not found`
        });
      }

      if (seat.status !== 'locked' || seat.lockedBy !== userEmail) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seatId} lock has expired or is not held by user`
        });
      }
    }

    // Mark seats as booked
    for (const seatId of selectedSeats) {
      tickets[seatId] = {
        ...tickets[seatId],
        status: 'booked',
        bookedBy: userEmail,
        bookedAt: new Date(),
        lockedBy: null,
        lockedAt: null
      };
    }

    show.tickets = tickets;
    show.markModified('tickets');
    await show.save();

    const bookingId = uuidv4();
    const booking = new Booking({
      bookingId,
      userEmail,
      showId,
      movieId,
      theatreName: theatreName || show.theatreName,
      showDate: showDate || show.showDate,
      showTime: showTime || show.showTime,
      ticketsData: ticketsData || tickets,
      selectedSeats,
      totalAmount: Number(totalAmount) || 0,
      paymentStatus: 'Completed'
    });

    await booking.save();

    // Emit socket event
    try {
      const { io } = require('../server');
      if (io) {
        io.emit('seat-update', { showId, tickets: show.tickets });
      }
    } catch (socketErr) {
      console.error('[Socket] Failed to emit seat-update:', socketErr.message);
    }

    // Send confirmation email
    try {
      let movieName = 'Movie';
      if (movieId) {
        const movie = await Movie.findById(movieId);
        if (movie) movieName = movie.movieName;
      }

      await sendBookingConfirmation(userEmail, {
        bookingId,
        movieName,
        theatreName: booking.theatreName,
        showDate: booking.showDate,
        showTime: booking.showTime,
        selectedSeats,
        totalAmount: booking.totalAmount
      });
    } catch (emailErr) {
      console.error('[Mailer] Confirmation email error:', emailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating booking'
    });
  }
};

// Get bookings for currently authenticated user
const getUserBookings = async (req, res) => {
  try {
    const userEmail = req.user?.email || req.query.email;
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email not found in token or query'
      });
    }

    const bookings = await Booking.find({ userEmail }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: bookings,
      bookings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user bookings'
    });
  }
};

// Cancel booking and release seats
const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.body.bookingId || req.params.bookingId;
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'bookingId is required'
      });
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const show = await Show.findOne({ showId: booking.showId });
    if (show && show.tickets) {
      const tickets = show.tickets;
      for (const seatId of booking.selectedSeats || []) {
        if (tickets[seatId]) {
          tickets[seatId] = {
            ...tickets[seatId],
            status: 'available',
            lockedBy: null,
            lockedAt: null,
            bookedBy: null,
            bookedAt: null
          };
        }
      }
      show.tickets = tickets;
      show.markModified('tickets');
      await show.save();

      try {
        const { io } = require('../server');
        if (io) {
          io.emit('seat-update', { showId: show.showId, tickets: show.tickets });
        }
      } catch (socketErr) {
        console.error('[Socket] Failed to emit seat-update:', socketErr.message);
      }
    }

    booking.paymentStatus = 'Failed';
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling booking'
    });
  }
};

// Get all bookings (admin view)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: bookings,
      bookings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching all bookings'
    });
  }
};

module.exports = {
  lockSeats,
  createBooking,
  getUserBookings,
  cancelBooking,
  getAllBookings
};
