const Favorite = require('../models/favoriteModel');
const Movie = require('../models/movieModel');
const User = require('../models/userModel');

// Helper to fetch populated favorite movies for a user
const fetchUserFavoriteMovies = async (userEmail) => {
  // Query both User document favorites array and Favorite collection
  const user = await User.findOne({ email: userEmail });
  const favDocs = await Favorite.find({ userEmail });

  const idSet = new Set();
  if (user && Array.isArray(user.favorites)) {
    user.favorites.forEach(id => id && idSet.add(String(id)));
  }
  favDocs.forEach(f => f.movieId && idSet.add(String(f.movieId)));

  const movieIds = Array.from(idSet);
  if (movieIds.length === 0) return [];

  // Find movies matching MongoDB ObjectId or string id
  const movies = await Movie.find({
    $or: [
      { _id: { $in: movieIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/)) } },
      { tmdbId: { $in: movieIds.map(id => Number(id)).filter(n => !isNaN(n)) } }
    ]
  });

  return movies;
};

/**
 * Toggle Favorite Movie Status
 * Uses MongoDB $pull if movie is already favorited, and $addToSet if not
 * Returns updated favorite list and isFavorite state
 */
const toggleFavorite = async (req, res) => {
  try {
    const movieId = req.body.movieId || req.params.movieId;
    const userEmail = req.user?.email || req.body.userEmail;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: 'movieId is required'
      });
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'userEmail is required'
      });
    }

    const strMovieId = String(movieId).trim();

    // Check if the movie is currently favorited by user
    const existingFavDoc = await Favorite.findOne({ userEmail, movieId: strMovieId });
    const userWithFav = await User.findOne({ email: userEmail, favorites: strMovieId });
    const isCurrentlyFavorited = Boolean(existingFavDoc || userWithFav);

    let isFavorite = false;
    let message = '';

    if (isCurrentlyFavorited) {
      // 1. Remove using MongoDB $pull operator on User favorites array
      await User.findOneAndUpdate(
        { email: userEmail },
        { $pull: { favorites: strMovieId } },
        { new: true }
      );

      // Remove from Favorite collection
      await Favorite.deleteMany({ userEmail, movieId: strMovieId });

      isFavorite = false;
      message = 'Movie removed from favorites';
    } else {
      // 2. Add using MongoDB $addToSet operator on User favorites array
      await User.findOneAndUpdate(
        { email: userEmail },
        { $addToSet: { favorites: strMovieId } },
        { new: true, upsert: true }
      );

      // Upsert in Favorite collection
      await Favorite.findOneAndUpdate(
        { userEmail, movieId: strMovieId },
        { userEmail, movieId: strMovieId },
        { upsert: true, new: true }
      );

      isFavorite = true;
      message = 'Movie added to favorites';
    }

    // Fetch updated favorites list
    const updatedMovies = await fetchUserFavoriteMovies(userEmail);

    return res.status(200).json({
      success: true,
      isFavorite,
      message,
      data: updatedMovies,
      favorites: updatedMovies,
      movieId: strMovieId
    });
  } catch (error) {
    console.error('[favoriteController] Error toggling favorite:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error toggling favorite movie'
    });
  }
};

// Add a movie to favorites (using $addToSet)
const addFavorite = async (req, res) => {
  try {
    const movieId = req.body.movieId;
    const userEmail = req.user?.email || req.body.userEmail;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: 'movieId is required'
      });
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'userEmail is required'
      });
    }

    const strMovieId = String(movieId).trim();

    // Use $addToSet on User model
    await User.findOneAndUpdate(
      { email: userEmail },
      { $addToSet: { favorites: strMovieId } },
      { new: true, upsert: true }
    );

    // Upsert into Favorite collection
    const favorite = await Favorite.findOneAndUpdate(
      { userEmail, movieId: strMovieId },
      { userEmail, movieId: strMovieId },
      { upsert: true, new: true }
    );

    const updatedMovies = await fetchUserFavoriteMovies(userEmail);

    return res.status(200).json({
      success: true,
      isFavorite: true,
      message: 'Movie added to favorites',
      favorite,
      favorites: updatedMovies,
      data: updatedMovies
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error adding to favorites'
    });
  }
};

// Remove a movie from favorites (using $pull)
const removeFavorite = async (req, res) => {
  try {
    const movieId = req.body.movieId || req.params.movieId;
    const userEmail = req.user?.email || req.body.userEmail;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: 'movieId is required'
      });
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'userEmail is required'
      });
    }

    const strMovieId = String(movieId).trim();

    // Use $pull on User model
    await User.findOneAndUpdate(
      { email: userEmail },
      { $pull: { favorites: strMovieId } },
      { new: true }
    );

    await Favorite.deleteMany({ userEmail, movieId: strMovieId });
    const updatedMovies = await fetchUserFavoriteMovies(userEmail);

    return res.status(200).json({
      success: true,
      isFavorite: false,
      message: 'Removed from favorites',
      favorites: updatedMovies,
      data: updatedMovies
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error removing from favorites'
    });
  }
};

// Get all favorite movies for user
const getUserFavorites = async (req, res) => {
  try {
    const userEmail = req.user?.email || req.query.userEmail;
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required'
      });
    }

    const movies = await fetchUserFavoriteMovies(userEmail);

    return res.status(200).json({
      success: true,
      data: movies,
      favorites: movies,
      movies
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user favorites'
    });
  }
};

module.exports = {
  toggleFavorite,
  addFavorite,
  removeFavorite,
  getUserFavorites
};
