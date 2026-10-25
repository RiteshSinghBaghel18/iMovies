const Show = require("../models/showModel");
const Movie = require("../models/movieModel");
const Theatre = require("../models/theatreModel");
const { isShowPast } = require("../utils/dateTime");

// Helper to generate seat tickets from theatre config (supports user-defined tiers & custom sections)
const generateShowTickets = (theatre) => {
  const tickets = {};

  const tiers = [
    { name: "balcony", label: "Balcony (VIP)", price: theatre.balconySeatPrice, config: theatre.balconySeats },
    { name: "middle", label: "Middle (Premium)", price: theatre.middleSeatPrice, config: theatre.middleSeats },
    { name: "lower", label: "Lower (Standard)", price: theatre.lowerSeatPrice, config: theatre.lowerSeats },
  ];

  // If theatre has extra custom sections, include them
  if (Array.isArray(theatre.customSections)) {
    theatre.customSections.forEach((cs) => {
      tiers.push({
        name: cs.name || cs.label?.toLowerCase().replace(/\s+/g, "_") || "custom",
        label: cs.label || "Special Section",
        price: cs.price || theatre.middleSeatPrice || 250,
        config: {
          rows: cs.rows || ["X", "Y"],
          seatsPerRow: cs.seatsPerRow || 10,
        },
      });
    });
  }

  tiers.forEach((tier) => {
    let rows = [];
    if (Array.isArray(tier.config?.rows) && tier.config.rows.length > 0) {
      rows = tier.config.rows;
    } else if (typeof tier.config?.rows === "number") {
      const startChar = tier.name === "balcony" ? 65 : tier.name === "middle" ? 67 : 71; // A, C, G
      rows = Array.from({ length: tier.config.rows }, (_, i) => String.fromCharCode(startChar + i));
    } else {
      rows = tier.name === "balcony" ? ["A", "B"] : tier.name === "middle" ? ["C", "D", "E"] : ["F", "G"];
    }

    const seatsPerRow = Number(tier.config?.seatsPerRow || tier.config?.cols) || (tier.name === "balcony" ? 10 : 12);

    rows.forEach((row) => {
      for (let col = 1; col <= seatsPerRow; col++) {
        const seatId = `${row}${col}`;
        tickets[seatId] = {
          seatId: seatId,
          seatNumber: seatId,
          row,
          col,
          tier: tier.name,
          tierLabel: tier.label,
          price: tier.price,
          status: "available", // "available" | "locked" | "booked"
          lockedBy: null,
          lockExpiresAt: null,
          bookingId: null,
        };
      }
    });
  });

  return tickets;
};

// GET ALL SHOWS
exports.getAllShows = async (req, res) => {
  try {
    const { movieId, theatreId, showDate } = req.query;
    const filter = {};

    if (movieId) filter.movieId = movieId;
    if (theatreId) filter.theatreId = theatreId;
    if (showDate) filter.showDate = showDate;

    const shows = await Show.find(filter).select('-tickets').sort({ showDate: 1, showTime: 1 });
    res.json({ success: true, count: shows.length, shows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET SHOWS BY MOVIE ID
exports.getShowsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { date } = req.query;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found." });
    }

    const filter = { movieId };
    if (date) {
      filter.showDate = date;
    }

    let shows = await Show.find(filter).select('-tickets').sort({ showDate: 1, showTime: 1 });

    // On-demand auto-scheduler: If this movie doesn't have shows for this date,
    // generate shows across active theatres so every live TMDB movie is instantly bookable!
    if (shows.length === 0 && date) {
      const theatres = await Theatre.find();
      if (theatres.length > 0) {
        const times = ["10:30 AM", "02:15 PM", "06:45 PM", "10:00 PM"];
        const showsToCreate = [];

        theatres.forEach((theatre, tIdx) => {
          // Schedule 2 distinct showtimes per theatre
          const slot1 = times[(tIdx * 2) % times.length];
          const slot2 = times[(tIdx * 2 + 1) % times.length];

          [slot1, slot2].forEach((slot) => {
            const tickets = generateShowTickets(theatre);
            const generatedShowId = "show-live-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

            showsToCreate.push({
              adminEmail: "admin@imovies.com",
              showId: generatedShowId,
              movieId: movie._id.toString(),
              theatreName: theatre.theatreName,
              theatreId: theatre.theatreId,
              showDate: date,
              showTime: slot,
              pricing: {
                balcony: theatre.balconySeatPrice,
                middle: theatre.middleSeatPrice,
                lower: theatre.lowerSeatPrice,
              },
              tickets,
            });
          });
        });

        if (showsToCreate.length > 0) {
          shows = await Show.insertMany(showsToCreate);
        }
      }
    }

    const enrichedShows = shows.map((s) => {
      const obj = s.toObject ? s.toObject() : { ...s };
      obj.isPast = isShowPast(obj.showDate, obj.showTime);
      return obj;
    });

    res.json({
      success: true,
      movie,
      count: enrichedShows.length,
      shows: enrichedShows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET SINGLE SHOW BY showId (with seats)
exports.getShowById = async (req, res) => {
  try {
    const show = await Show.findOne({
      $or: [{ showId: req.params.showId }, { _id: req.params.showId.match(/^[0-9a-fA-F]{24}$/) ? req.params.showId : null }],
    });

    if (!show) {
      return res.status(404).json({ success: false, message: "Show not found." });
    }

        // Auto-release any expired locks in this show and normalize seat IDs
    const now = new Date();
    let modified = false;

    if (show.tickets && typeof show.tickets === "object" && !Array.isArray(show.tickets)) {
      Object.entries(show.tickets).forEach(([key, t]) => {
        if (!t) return;
        const sId = String(t.seatNumber || t.seatId || key);
        const row = t.row || sId.replace(/\d+/g, "").replace(/^[A-Za-z]+-/, "") || "A";
        const col = Number(t.col) || parseInt(sId.match(/\d+/)?.[0] || "1", 10);

        t.seatNumber = sId;
        t.seatId = sId;
        t.row = row;
        t.col = col;

        if (t.status === "locked" && t.lockExpiresAt && new Date(t.lockExpiresAt) <= now) {
          t.status = "available";
          t.lockedBy = null;
          t.lockExpiresAt = null;
          modified = true;
        }
      });

      if (modified) {
        show.markModified("tickets");
        await show.save();
      }
    }

    // Also populate movie details
    let movie = null;
    if (show.movieId) {
      movie = await Movie.findById(show.movieId);
    }

    // Populate theatre details
    let theatre = null;
    if (show.theatreId) {
      theatre = await Theatre.findOne({ theatreId: show.theatreId });
    } else {
      theatre = await Theatre.findOne({ theatreName: show.theatreName });
    }

    res.json({
      success: true,
      show,
      movie,
      theatre,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE SHOW (Admin)
exports.createShow = async (req, res) => {
  try {
    const { movieId, theatreName, theatreId, showDate, showTime, pricing } = req.body;
    const adminEmail = req.user?.email || req.body.adminEmail;

    if (!adminEmail || !movieId || !theatreName || !showDate || !showTime) {
      return res.status(400).json({
        success: false,
        message: "Please provide adminEmail, movieId, theatreName, showDate, and showTime.",
      });
    }

    // Verify movie
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Selected movie does not exist." });
    }

    // Look up theatre for seat layout and pricing
    let theatre = null;
    if (theatreId) {
      theatre = await Theatre.findOne({ theatreId });
    }
    if (!theatre) {
      theatre = await Theatre.findOne({ theatreName });
    }

    // If theatre not found in DB, create fallback config
    const theatreConfig = theatre || {
      balconySeatPrice: pricing?.balcony || 350,
      middleSeatPrice: pricing?.middle || 250,
      lowerSeatPrice: pricing?.lower || 150,
      balconySeats: { rows: ["A", "B"], seatsPerRow: 10 },
      middleSeats: { rows: ["C", "D", "E", "F"], seatsPerRow: 12 },
      lowerSeats: { rows: ["G", "H"], seatsPerRow: 12 },
    };

    const generatedShowId = "show-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const tickets = generateShowTickets(theatreConfig);

    const newShow = await Show.create({
      adminEmail,
      showId: generatedShowId,
      movieId: movie._id.toString(),
      theatreName: theatre ? theatre.theatreName : theatreName,
      theatreId: theatre ? theatre.theatreId : "th-default",
      showDate,
      showTime,
      pricing: {
        balcony: theatreConfig.balconySeatPrice,
        middle: theatreConfig.middleSeatPrice,
        lower: theatreConfig.lowerSeatPrice,
      },
      tickets,
    });

    res.status(201).json({
      success: true,
      message: "Show scheduled successfully!",
      show: newShow,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE SHOW (Admin)
exports.deleteShow = async (req, res) => {
  try {
    const show = await Show.findOneAndDelete({
      $or: [{ showId: req.params.showId }, { _id: req.params.showId.match(/^[0-9a-fA-F]{24}$/) ? req.params.showId : null }],
    });

    if (!show) {
      return res.status(404).json({ success: false, message: "Show not found." });
    }

    res.json({ success: true, message: "Show deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
