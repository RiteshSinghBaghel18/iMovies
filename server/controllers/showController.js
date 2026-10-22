const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Show = require('../models/showModel');
const Theatre = require('../models/theatreModel');
const Movie = require('../models/movieModel');
const { ensureShowsForMovie } = require('../utils/showGenerator');
const { isShowExpired } = require('../utils/showTimeHelper');

// Helper to generate seat labels: 0 -> A, 1 -> B, ... 26 -> AA
const getRowLabel = (index) => {
  let label = '';
  while (index >= 0) {
    label = String.fromCharCode((index % 26) + 65) + label;
    index = Math.floor(index / 26) - 1;
  }
  return label;
};

// Get all shows, with optional movieId query filter
const getAllShows = async (req, res) => {
  try {
    const filter = {};
    if (req.query.movieId) {
      filter.movieId = req.query.movieId;
    }
    const shows = await Show.find(filter).sort({ createdAt: -1 });
    const enrichedShows = shows.map((s) => {
      const obj = s.toObject ? s.toObject() : { ...s };
      obj.isExpired = isShowExpired(obj.showDate, obj.showTime);
      return obj;
    });

    return res.status(200).json({
      success: true,
      count: enrichedShows.length,
      data: enrichedShows,
      shows: enrichedShows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching shows'
    });
  }
};

// Get show by showId, enriched with movie, theatre, and isExpired status
const getShowById = async (req, res) => {
  try {
    const showId = req.params.showId || req.params.id;
    let show = await Show.findOne({ showId });
    if (!show && showId.match(/^[0-9a-fA-F]{24}$/)) {
      show = await Show.findById(showId);
    }

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    const [movie, theatre] = await Promise.all([
      Movie.findById(show.movieId),
      Theatre.findOne({ theatreId: show.theatreId })
    ]);

    const showObj = show.toObject ? show.toObject() : { ...show };
    showObj.isExpired = isShowExpired(showObj.showDate, showObj.showTime);

    return res.status(200).json({
      success: true,
      data: {
        show: showObj,
        movie,
        theatre
      },
      show: showObj,
      movie,
      theatre
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching show details'
    });
  }
};

// Add a new show and initialize tickets based on theatre layout
const addShow = async (req, res) => {
  try {
    const { movieId, theatreId, showDate, showTime, ticketPrice } = req.body;

    // Validate required fields
    if (!movieId) {
      return res.status(400).json({ success: false, message: 'movieId is required' });
    }
    if (!theatreId) {
      return res.status(400).json({ success: false, message: 'theatreId is required' });
    }
    if (!showTime) {
      return res.status(400).json({ success: false, message: 'showTime is required' });
    }

    const formattedDate = showDate || new Date().toISOString().split('T')[0];

    // Find theatre flexibly by MongoDB ObjectId or theatreId string
    let theatre = null;
    if (mongoose.Types.ObjectId.isValid(theatreId)) {
      theatre = await Theatre.findById(theatreId);
    }
    if (!theatre) {
      theatre = await Theatre.findOne({ theatreId });
    }
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Associated theatre not found. Please select a valid theatre.'
      });
    }

    // Find movie flexibly by MongoDB ObjectId, tmdbId, or exact title
    let movie = null;
    if (mongoose.Types.ObjectId.isValid(movieId)) {
      movie = await Movie.findById(movieId);
    }
    if (!movie) {
      movie = await Movie.findOne({
        $or: [
          { tmdbId: Number(movieId) || -1 },
          { movieName: String(movieId).trim() }
        ]
      });
    }
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Associated movie not found. Please select a valid movie.'
      });
    }

    // Ticket pricing calculations
    const baseTicketPrice = Number(ticketPrice) > 0
      ? Number(ticketPrice)
      : Number(theatre.middleSeatPrice) || 250;

    const balconyPrice = Number(theatre.balconySeatPrice) || Math.round(baseTicketPrice * 1.4);
    const middlePrice = Number(theatre.middleSeatPrice) || baseTicketPrice;
    const lowerPrice = Number(theatre.lowerSeatPrice) || Math.round(baseTicketPrice * 0.7);

    // Build tickets object
    const tickets = {};
    const tiers = [
      { key: 'balcony', prefix: 'B', config: theatre.balconySeats, price: balconyPrice },
      { key: 'middle', prefix: 'M', config: theatre.middleSeats, price: middlePrice },
      { key: 'lower', prefix: 'L', config: theatre.lowerSeats, price: lowerPrice }
    ];

    tiers.forEach(({ key, prefix, config, price }) => {
      if (config && config.rows && config.cols) {
        for (let r = 0; r < config.rows; r++) {
          const rowLetter = getRowLabel(r);
          for (let c = 1; c <= config.cols; c++) {
            const seatId = `${prefix}-${rowLetter}${c}`;
            tickets[seatId] = {
              seatId,
              tier: key,
              price,
              status: 'available',
              lockedBy: null,
              lockedAt: null
            };
          }
        }
      }
    });

    const showId = uuidv4();
    const adminEmail = req.user?.email || req.body.adminEmail || theatre.adminEmail || 'admin@imovies.com';
    const theatreName = theatre.theatreName || req.body.theatreName;
    const movieName = movie.movieName;

    const newShow = new Show({
      adminEmail,
      showId,
      movieId: String(movie._id),
      theatreId: String(theatre.theatreId || theatre._id),
      theatreName,
      location: theatre.location || 'City Centre',
      movieName,
      showDate: formattedDate,
      showTime,
      ticketPrice: baseTicketPrice,
      balconyPrice,
      middlePrice,
      lowerPrice,
      tickets
    });

    await newShow.save();

    return res.status(201).json({
      success: true,
      message: `Show scheduled successfully for "${movieName}" at ${theatreName}!`,
      data: newShow,
      show: newShow
    });
  } catch (error) {
    console.error('[showController] Error in addShow:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error adding show'
    });
  }
};

// Update show by showId
const updateShow = async (req, res) => {
  try {
    const showId = req.params.showId || req.params.id;
    let show = await Show.findOneAndUpdate(
      { showId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!show && showId.match(/^[0-9a-fA-F]{24}$/)) {
      show = await Show.findByIdAndUpdate(showId, req.body, { new: true, runValidators: true });
    }

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Show updated successfully',
      data: show,
      show
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error updating show'
    });
  }
};

// Delete show by showId
const deleteShow = async (req, res) => {
  try {
    const showId = req.params.showId || req.params.id;
    let show = await Show.findOneAndDelete({ showId });

    if (!show && showId.match(/^[0-9a-fA-F]{24}$/)) {
      show = await Show.findByIdAndDelete(showId);
    }

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Show deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting show'
    });
  }
};

// Get shows by movieId, ensuring all theatres have active shows and flagging expired showtimes
const getShowsByMovieId = async (req, res) => {
  try {
    const movieIdParam = req.params.movieId;

    let movie = null;
    if (movieIdParam.match(/^[0-9a-fA-F]{24}$/)) {
      movie = await Movie.findById(movieIdParam);
    } else if (!isNaN(Number(movieIdParam))) {
      movie = await Movie.findOne({ tmdbId: Number(movieIdParam) });
    }

    if (movie) {
      await ensureShowsForMovie(movie, 7);
    }

    const shows = await Show.find({ movieId: movieIdParam }).sort({ showDate: 1, showTime: 1 });

    // Enrich shows with isExpired flag
    const enrichedShows = shows.map((s) => {
      const obj = s.toObject ? s.toObject() : { ...s };
      obj.isExpired = isShowExpired(obj.showDate, obj.showTime);
      return obj;
    });

    return res.status(200).json({
      success: true,
      count: enrichedShows.length,
      data: enrichedShows,
      shows: enrichedShows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching shows for movie'
    });
  }
};

module.exports = {
  getAllShows,
  getShowById,
  addShow,
  updateShow,
  deleteShow,
  getShowsByMovieId
};
