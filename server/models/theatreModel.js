const mongoose = require("mongoose");

const theatreSchema = new mongoose.Schema(
  {
    theatreName: {
      type: String,
      required: [true, "Theatre name is required"],
      trim: true,
    },
    theatreId: {
      type: String,
      required: [true, "Theatre ID is required"],
      unique: true,
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    balconySeatPrice: {
      type: Number,
      required: [true, "Balcony seat price is required"],
      min: [0, "Price must be non-negative"],
    },
    middleSeatPrice: {
      type: Number,
      required: [true, "Middle seat price is required"],
      min: [0, "Price must be non-negative"],
    },
    lowerSeatPrice: {
      type: Number,
      required: [true, "Lower seat price is required"],
      min: [0, "Price must be non-negative"],
    },
    balconySeats: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Balcony seats configuration is required"],
    },
    middleSeats: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Middle seats configuration is required"],
    },
    lowerSeats: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Lower seats configuration is required"],
    },
    amenities: {
      type: [String],
      default: ["4K Projection", "Dolby Atmos 7.1", "Recliner Seats", "Parking"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Theatre", theatreSchema);
