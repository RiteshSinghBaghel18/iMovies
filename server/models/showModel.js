const mongoose = require("mongoose");

const showSchema = new mongoose.Schema(
  {
    adminEmail: {
      type: String,
      required: [true, "Admin email is required"],
      trim: true,
      lowercase: true,
    },
    showId: {
      type: String,
      required: [true, "Show ID is required"],
      unique: true,
      trim: true,
    },
    movieId: {
      type: String,
      required: [true, "Movie ID is required"],
      ref: "Movie",
    },
    theatreName: {
      type: String,
      required: [true, "Theatre name is required"],
      trim: true,
    },
    theatreId: {
      type: String,
      trim: true,
    },
    showDate: {
      type: mongoose.Schema.Types.Mixed, // String (YYYY-MM-DD) or Date
      required: [true, "Show date is required"],
    },
    showTime: {
      type: String,
      required: [true, "Show time is required"],
      trim: true,
    },
    tickets: {
      type: mongoose.Schema.Types.Mixed, // Object or Array tracking real-time seat lock and booking status
      required: [true, "Tickets structure is required"],
    },
    pricing: {
      balcony: { type: Number, default: 350 },
      middle: { type: Number, default: 250 },
      lower: { type: Number, default: 150 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup of shows by movie, theatre, date
showSchema.index({ movieId: 1, showDate: 1 });

module.exports = mongoose.model("Show", showSchema);
