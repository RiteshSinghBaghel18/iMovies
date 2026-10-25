const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: [true, "User email is required"],
      trim: true,
      lowercase: true,
    },
    movieId: {
      type: String,
      required: [true, "Movie ID is required"],
      ref: "Movie",
    },
  },
  {
    timestamps: true,
  }
);

favoriteSchema.index({ userEmail: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
