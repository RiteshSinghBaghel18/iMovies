const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Show = require('../models/showModel');
const Theatre = require('../models/theatreModel');
const Movie = require('../models/movieModel');
const { generateTicketsForTheatre, ensureShowsForMovie } = require('../utils/showGenerator');
const { isShowExpired, formatDisplayTime } = require('../utils/showTimeHelper');

// Helper to generate seat labels: 0 -> A, 1 -> B, ... 26 -> AA
const getRowLabel = (index) => {
  let label = '';
  while (index >= 0) {
    label = String.fromCharCode((index % 26) + 65) + label;
    index = Math.floor(index / 26) - 1;
  }
  return label;
};

// Helper to resolve theatre by either UUID theatreId or MongoDB _id
const resolveTheatre = async (idOrObj) => {
  if (!idOrObj) return null;
  const idStr = String(idOrObj._id || idOrObj.theatreId || idOrObj).trim();
  if (mongoose.isValidObjectId(idStr)) {
    const t = await Theatre.findById(idStr);
    if (t) return t;
  }
  return Theatre.findOne({ theatreId: idStr });
};

// Helper to resolve movie by ObjectId, tmdbId, or exact title
const resolveMovie = async (idOrObj) => {
  if (!idOrObj) return null;
  const idStr = String(idOrObj._id || idOrObj.id || idOrObj).trim();
  if (mongoose.isValidObjectId(idStr)) {
    const m = await Movie.findById(idStr);
    if (m) return m;
  }
  const numericId = Number(idStr);
  if (!isNaN(numericId) && numericId > 0) {
    const m = await Movie.findOne({ tmdbId: numericId });
    if (m) return m;
  }
  return Movie.findOne({ movieName: idStr });
};

// Get all shows, with optional movieId query filter
const getAllShows = async (req, res) => {
  try {
    const filter = {};
    if (req.query.movieId) {
      const movie = await resolveMovie(req.query.movieId);
      if (movie) {
        filter.$or = [
          { movieId: String(movie._id) },
          ...(movie.tmdbId ? [{ movieId: String(movie.tmdbId) }] : []),
          { movieId: String(req.query.movieId) }
        ];
      } else {
        filter.movieId = req.query.movieId;
      }
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
    if (!show && mongoose.isValidObjectId(showId)) {
      show = await Show.findById(showId);
    }

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    // Flexible movie lookup
    let movie = null;
    if (mongoose.isValidObjectId(show.movieId)) {
      movie = await Movie.findById(show.movieId);
    }
    if (!movie && !isNaN(Number(show.movieId))) {
      movie = await Movie.findOne({ tmdbId: Number(show.movieId) });
    }
    if (!movie && show.movieName) {
      movie = await Movie.findOne({ movieName: show.movieName });
    }

    // Flexible theatre lookup
    let theatre = await Theatre.findOne({ theatreId: show.theatreId });
    if (!theatre && mongoose.isValidObjectId(show.theatreId)) {
      theatre = await Theatre.findById(show.theatreId);
    }
    if (!theatre && show.theatreName) {
      theatre = await Theatre.findOne({ theatreName: show.theatreName });
    }

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
    console.error('[showController] Error in getShowById:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching show details'
    });
  }
};

// Add a new show or batch of shows across partner theatres
const addShow = async (req, res) => {
  try {
    const {
      movieId,
      theatreId,
      theatreIds,
      showDate,
      showDates,
      showTime,
      showTimes,
      ticketPrice,
      days = 1
    } = req.body;

    if (!movieId) {
      return res.status(400).json({ success: false, message: 'movieId is required' });
    }

    const movie = await resolveMovie(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Associated movie not found. Please select a valid movie.'
      });
    }

    // Determine target theatres: supports single theatreId, array of theatreIds, or 'all'
    let targetTheatres = [];
    if (theatreId === 'all' || theatreIds === 'all') {
      targetTheatres = await Theatre.find();
    } else if (Array.isArray(theatreIds) && theatreIds.length > 0) {
      for (const id of theatreIds) {
        const t = await resolveTheatre(id);
        if (t && !targetTheatres.some(existing => String(existing._id) === String(t._id))) {
          targetTheatres.push(t);
        }
      }
    } else if (theatreId) {
      const t = await resolveTheatre(theatreId);
      if (t) targetTheatres.push(t);
    }

    if (targetTheatres.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Associated theatre(s) not found. Please select a valid theatre.'
      });
    }

    // Determine target dates
    let targetDates = [];
    if (Array.isArray(showDates) && showDates.length > 0) {
      targetDates = showDates.filter(Boolean);
    } else if (showDate) {
      targetDates = [showDate];
    } else {
      const today = new Date();
      for (let d = 0; d < Math.max(1, Number(days) || 1); d++) {
        const dObj = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d);
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, '0');
        const dayStr = String(dObj.getDate()).padStart(2, '0');
        targetDates.push(`${y}-${m}-${dayStr}`);
      }
    }

    // Determine target times
    let targetTimes = [];
    if (Array.isArray(showTimes) && showTimes.length > 0) {
      targetTimes = showTimes.filter(Boolean);
    } else if (showTime) {
      targetTimes = [showTime];
    } else {
      targetTimes = ['10:30 AM', '01:00 PM', '04:15 PM', '07:30 PM', '10:15 PM'];
    }

    const adminEmail = req.user?.email || req.body.adminEmail || 'admin@imovies.com';
    const movieIdStr = String(movie._id);
    const movieName = movie.movieName;
    const baseTicketPrice = Number(ticketPrice) > 0 ? Number(ticketPrice) : 250;

    const createdShows = [];

    for (const theatre of targetTheatres) {
      const tUUID = String(theatre.theatreId || theatre._id);
      const theatreName = theatre.theatreName;
      const location = theatre.location || 'City Centre';

      const balconyPrice = Number(theatre.balconySeatPrice) || Math.round(baseTicketPrice * 1.4);
      const middlePrice = Number(theatre.middleSeatPrice) || baseTicketPrice;
      const lowerPrice = Number(theatre.lowerSeatPrice) || Math.round(baseTicketPrice * 0.7);

      for (const dateStr of targetDates) {
        for (const timeStr of targetTimes) {
          // Check if show already exists for this slot
          const existing = await Show.findOne({
            movieId: movieIdStr,
            theatreId: tUUID,
            showDate: dateStr,
            showTime: timeStr
          });

          if (existing) {
            createdShows.push(existing);
            continue;
          }

          const tickets = generateTicketsForTheatre(theatre);
          const showId = uuidv4();

          const newShow = new Show({
            adminEmail,
            showId,
            movieId: movieIdStr,
            theatreId: tUUID,
            theatreName,
            location,
            movieName,
            showDate: dateStr,
            showTime: timeStr,
            ticketPrice: baseTicketPrice,
            balconyPrice,
            middlePrice,
            lowerPrice,
            tickets
          });

          await newShow.save();
          createdShows.push(newShow);
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: `Successfully scheduled ${createdShows.length} showtime(s) for "${movieName}" across ${targetTheatres.length} theatre(s)!`,
      count: createdShows.length,
      data: createdShows,
      shows: createdShows,
      show: createdShows[0]
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

    if (!show && mongoose.isValidObjectId(showId)) {
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

    if (!show && mongoose.isValidObjectId(showId)) {
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
    const movie = await resolveMovie(movieIdParam);

    // Build flexible query matching movieId as string, ObjectId, or tmdbId
    const queryConditions = [{ movieId: movieIdParam }];
    if (movie) {
      queryConditions.push({ movieId: String(movie._id) });
      if (movie.tmdbId) {
        queryConditions.push({ movieId: String(movie.tmdbId) });
      }
    }

    let shows = await Show.find({ $or: queryConditions }).sort({ showDate: 1, showTime: 1 });

    // If no shows exist for this movie, automatically generate default shows
    if (shows.length === 0 && movie) {
      await ensureShowsForMovie(movie, 7);
      shows = await Show.find({ $or: queryConditions }).sort({ showDate: 1, showTime: 1 });
    }

    // Enrich shows with theatre details and isExpired flag
    const enrichedShows = await Promise.all(
      shows.map(async (s) => {
        const obj = s.toObject ? s.toObject() : { ...s };

        // Ensure theatreName and location are never blank or fallback
        if (!obj.theatreName || obj.theatreName === 'Cinema' || !obj.location) {
          const t = await resolveTheatre(obj.theatreId);
          if (t) {
            obj.theatreName = t.theatreName;
            obj.location = t.location;
            obj.balconyPrice = obj.balconyPrice || t.balconySeatPrice;
            obj.middlePrice = obj.middlePrice || t.middleSeatPrice;
            obj.lowerPrice = obj.lowerPrice || t.lowerSeatPrice;
          }
        }

        obj.isExpired = isShowExpired(obj.showDate, obj.showTime);
        return obj;
      })
    );

    return res.status(200).json({
      success: true,
      count: enrichedShows.length,
      data: enrichedShows,
      shows: enrichedShows
    });
  } catch (error) {
    console.error('[showController] Error in getShowsByMovieId:', error);
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
