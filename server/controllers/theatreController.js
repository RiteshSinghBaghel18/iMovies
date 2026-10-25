const Theatre = require("../models/theatreModel");

// Helper to generate default seat structures if not provided
const generateDefaultSeatConfig = (tier) => {
  if (tier === "balcony") {
    return { rows: ["A", "B"], seatsPerRow: 10, totalSeats: 20 };
  } else if (tier === "middle") {
    return { rows: ["C", "D", "E", "F"], seatsPerRow: 12, totalSeats: 48 };
  } else {
    return { rows: ["G", "H"], seatsPerRow: 12, totalSeats: 24 };
  }
};

// GET ALL THEATRES
exports.getAllTheatres = async (req, res) => {
  try {
    const theatres = await Theatre.find().sort({ createdAt: -1 });
    res.json({ success: true, count: theatres.length, theatres });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET THEATRE BY ID
exports.getTheatreById = async (req, res) => {
  try {
    const theatre = await Theatre.findOne({
      $or: [{ theatreId: req.params.theatreId }, { _id: req.params.theatreId.match(/^[0-9a-fA-F]{24}$/) ? req.params.theatreId : null }],
    });
    if (!theatre) {
      return res.status(404).json({ success: false, message: "Theatre not found." });
    }
    res.json({ success: true, theatre });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE THEATRE (Admin)
exports.createTheatre = async (req, res) => {
  try {
    const {
      theatreName,
      theatreId,
      location,
      balconySeatPrice,
      middleSeatPrice,
      lowerSeatPrice,
      balconySeats,
      middleSeats,
      lowerSeats,
      amenities,
    } = req.body;

    const generatedId = theatreId || "th-" + Date.now().toString(36);

    const existing = await Theatre.findOne({ theatreId: generatedId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Theatre ID already exists." });
    }

    const theatre = await Theatre.create({
      theatreName,
      theatreId: generatedId,
      location,
      balconySeatPrice: Number(balconySeatPrice),
      middleSeatPrice: Number(middleSeatPrice),
      lowerSeatPrice: Number(lowerSeatPrice),
      balconySeats: balconySeats || generateDefaultSeatConfig("balcony"),
      middleSeats: middleSeats || generateDefaultSeatConfig("middle"),
      lowerSeats: lowerSeats || generateDefaultSeatConfig("lower"),
      amenities: Array.isArray(amenities) ? amenities : ["Dolby Atmos", "4K RGB Laser", "Food Court"],
    });

    res.status(201).json({
      success: true,
      message: "Theatre created successfully!",
      theatre,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE THEATRE (Admin)
exports.updateTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.findOneAndUpdate(
      { $or: [{ theatreId: req.params.theatreId }, { _id: req.params.theatreId.match(/^[0-9a-fA-F]{24}$/) ? req.params.theatreId : null }] },
      req.body,
      { new: true, runValidators: true }
    );

    if (!theatre) {
      return res.status(404).json({ success: false, message: "Theatre not found." });
    }

    res.json({ success: true, message: "Theatre updated successfully!", theatre });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE THEATRE (Admin)
exports.deleteTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.findOneAndDelete({
      $or: [{ theatreId: req.params.theatreId }, { _id: req.params.theatreId.match(/^[0-9a-fA-F]{24}$/) ? req.params.theatreId : null }],
    });

    if (!theatre) {
      return res.status(404).json({ success: false, message: "Theatre not found." });
    }

    res.json({ success: true, message: "Theatre deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
