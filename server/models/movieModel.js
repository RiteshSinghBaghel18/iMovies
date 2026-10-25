const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    movieName: {
      type: String,
      required: [true, "Movie name is required"],
      trim: true,
      minlength: [2, "Movie name must be at least 2 characters"],
      maxlength: [200, "Movie name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Movie description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
    },
    genres: {
      type: [String],
      required: [true, "At least one genre is required"],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: "At least one genre must be specified",
      },
    },
    releaseDate: {
      type: Date,
      required: [true, "Release date is required"],
    },
    language: {
      type: String,
      required: [true, "Language is required"],
      trim: true,
    },
    duration: {
      type: mongoose.Schema.Types.Mixed, // Accepts String (e.g. "2h 35m") or Number (minutes)
      required: [true, "Duration is required"],
    },
    certification: {
      type: String,
      default: "U/A",
      trim: true,
    },
    posterUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
    },
    bannerUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80",
    },
    trailerUrl: {
      type: String,
      default: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    cast: {
      type: [String],
      default: [],
    },
    director: {
      type: String,
      default: "Unknown",
    },
    rating: {
      type: Number,
      default: 8.5,
      min: 0,
      max: 10,
    },
    voteCount: {
      type: Number,
      default: 0,
    },
    // TMDB Integration fields
    tmdbId: {
      type: Number,
      unique: true,
      sparse: true, // allows multiple docs without tmdbId (manually-added movies)
      index: true,
    },
    tmdbPopularity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search optimization — use 'none' language override so non-English
// field values (e.g. "Korean", "Tamil") don't confuse the text analyser.
movieSchema.index(
  { movieName: "text", description: "text" },
  { default_language: "none", language_override: "none" }
);

module.exports = mongoose.model("Movie", movieSchema);
