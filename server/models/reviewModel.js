const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be between 1 and 5"],
      max: [5, "Rating must be between 1 and 5"],
    },
    reviewText: {
      type: String,
      required: [true, "Review text is required"],
      trim: true,
      minlength: [3, "Review text must be at least 3 characters"],
    },
    username: {
      type: String,
      default: "Movie Enthusiast",
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ movieId: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
