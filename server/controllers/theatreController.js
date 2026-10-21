const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Theatre = require('../models/theatreModel');
const Show = require('../models/showModel');

// Helper to build flexible query matching either custom theatreId or MongoDB _id
const buildTheatreQuery = (id) => {
  const query = [{ theatreId: id }];
  if (mongoose.isValidObjectId(id)) {
    query.push({ _id: id });
  }
  return { $or: query };
};

// Get all theatres with optional filter by adminEmail
const getAllTheatres = async (req, res) => {
  try {
    const filter = {};
    if (req.query.adminEmail) {
      filter.adminEmail = req.query.adminEmail;
    }
    const theatres = await Theatre.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: theatres,
      theatres
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching theatres'
    });
  }
};

// Get single theatre by theatreId or MongoDB _id
const getTheatreById = async (req, res) => {
  try {
    const paramId = req.params.theatreId || req.params.id;
    const theatre = await Theatre.findOne(buildTheatreQuery(paramId));
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found'
      });
    }
    return res.status(200).json({
      success: true,
      data: theatre,
      theatre
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching theatre'
    });
  }
};

// Add a new theatre with UUID theatreId
const addTheatre = async (req, res) => {
  try {
    const theatreId = uuidv4();
    const adminEmail = req.user?.email || req.body.adminEmail || 'admin@imovies.com';

    // Normalize nested balconySeats, middleSeats, lowerSeats from request
    const balconyRows = Number(req.body.balconySeats?.rows ?? req.body.balconyRows) || 3;
    const balconyCols = Number(req.body.balconySeats?.cols ?? req.body.balconyCols) || 10;
    const middleRows = Number(req.body.middleSeats?.rows ?? req.body.middleRows) || 5;
    const middleCols = Number(req.body.middleSeats?.cols ?? req.body.middleCols) || 12;
    const lowerRows = Number(req.body.lowerSeats?.rows ?? req.body.lowerRows) || 4;
    const lowerCols = Number(req.body.lowerSeats?.cols ?? req.body.lowerCols) || 10;

    const balconySeats = { rows: balconyRows, cols: balconyCols };
    const middleSeats = { rows: middleRows, cols: middleCols };
    const lowerSeats = { rows: lowerRows, cols: lowerCols };

    const totalSeats = (balconyRows * balconyCols) + (middleRows * middleCols) + (lowerRows * lowerCols);

    const theatreData = {
      ...req.body,
      theatreId,
      adminEmail,
      theatreName: req.body.theatreName ? req.body.theatreName.trim() : 'iMovies Cineplex',
      location: req.body.location ? req.body.location.trim() : 'Downtown',
      balconySeatPrice: Number(req.body.balconySeatPrice) || 250,
      middleSeatPrice: Number(req.body.middleSeatPrice) || 180,
      lowerSeatPrice: Number(req.body.lowerSeatPrice) || 120,
      balconySeats,
      middleSeats,
      lowerSeats,
      balconyRows,
      balconyCols,
      middleRows,
      middleCols,
      lowerRows,
      lowerCols,
      totalSeats
    };

    const theatre = new Theatre(theatreData);
    await theatre.save();

    return res.status(201).json({
      success: true,
      message: 'Theatre created successfully',
      data: theatre,
      theatre
    });
  } catch (error) {
    console.error('[theatreController] addTheatre error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error creating theatre'
    });
  }
};

// Update theatre by theatreId or _id
const updateTheatre = async (req, res) => {
  try {
    const paramId = req.params.theatreId || req.params.id;
    const theatre = await Theatre.findOneAndUpdate(
      buildTheatreQuery(paramId),
      req.body,
      { new: true, runValidators: true }
    );

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Theatre updated successfully',
      data: theatre,
      theatre
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error updating theatre'
    });
  }
};

// Delete theatre by theatreId or _id
const deleteTheatre = async (req, res) => {
  try {
    const paramId = req.params.theatreId || req.params.id;
    const theatre = await Theatre.findOneAndDelete(buildTheatreQuery(paramId));

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found'
      });
    }

    // Clean up any shows associated with this theatre
    await Show.deleteMany({
      $or: [
        { theatreId: theatre.theatreId },
        { theatreId: String(theatre._id) }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Theatre deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting theatre'
    });
  }
};

module.exports = {
  getAllTheatres,
  getTheatreById,
  addTheatre,
  updateTheatre,
  deleteTheatre
};
