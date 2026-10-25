const Favorite = require("../models/favoriteModel");
const Movie = require("../models/movieModel");

// GET USER'S FAVORITES
exports.getUserFavorites = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const favorites = await Favorite.find({ userEmail }).sort({ createdAt: -1 });

    const movieIds = favorites.map((f) => f.movieId);
    const movies = await Movie.find({ _id: { $in: movieIds } });

    res.json({
      success: true,
      count: movies.length,
      favorites: movies,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADD TO FAVORITES
exports.addFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userEmail = req.user.email;

    if (!movieId) {
      return res.status(400).json({ success: false, message: "Movie ID is required." });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found." });
    }

    const existing = await Favorite.findOne({ userEmail, movieId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Movie already in favorites." });
    }

    const favorite = await Favorite.create({ userEmail, movieId });
    res.status(201).json({ success: true, message: "Movie added to your watchlist!", favorite });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// REMOVE FROM FAVORITES
exports.removeFavorite = async (req, res) => {
  try {
    const { movieId } = req.params;
    const userEmail = req.user.email;

    const removed = await Favorite.findOneAndDelete({ userEmail, movieId });
    if (!removed) {
      return res.status(404).json({ success: false, message: "Movie not in favorites." });
    }

    res.json({ success: true, message: "Movie removed from watchlist." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CHECK IF MOVIE IS FAVORITE
exports.checkFavorite = async (req, res) => {
  try {
    const { movieId } = req.params;
    const userEmail = req.user.email;

    const exists = await Favorite.findOne({ userEmail, movieId });
    res.json({ success: true, isFavorite: !!exists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
