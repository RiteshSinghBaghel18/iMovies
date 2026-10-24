const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  movieName: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
  description: { type: String, required: true, trim: true, minlength: 10 },
  genres: { type: [String], required: true, validate: { validator: v => Array.isArray(v) && v.length > 0, message: 'At least one genre required' } },
  releaseDate: { type: Date, required: true },
  language: { type: String, required: true },
  duration: { type: String, required: true },
  certification: { type: String, default: 'U/A' },
  posterUrl: { type: String, default: '' },
  backdropUrl: { type: String, default: '' },
  trailerUrl: { type: String, default: '' },
  cast: [{
    name: { type: String, default: '' },
    role: { type: String, default: 'Cast' },
    profileUrl: { type: String, default: '' },
    profilePath: { type: String, default: '' },
    image: { type: String, default: '' }
  }],
  tmdbId: { type: Number, index: true },
  rating: { type: Number, default: 0 },
  voteCount: { type: Number, default: 0 },
  categories: { type: [String], default: ['now_playing'], index: true },
  isAdminAdded: { type: Boolean, default: false, index: true },
  isCustom: { type: Boolean, default: false, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);
