const Movie = require("../models/movieModel");
const { searchAndSyncTMDB } = require("../services/tmdbService");

// GET ALL MOVIES (with filters and search)
exports.getAllMovies = async (req, res) => {
  try {
    const { search, q, genre, language, sort } = req.query;
    const query = {};

    const searchQuery = search || q;

    // If a search query is provided, trigger a live TMDB search-and-sync
    // in the background before querying MongoDB, so results stay fresh.
    if (searchQuery) {
      searchAndSyncTMDB(searchQuery).catch((e) =>
        console.error("[MovieController] Background TMDB search failed:", e.message)
      );

      query.$or = [
        { movieName: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
        { genres: { $in: [new RegExp(searchQuery, "i")] } },
        { director: { $regex: searchQuery, $options: "i" } },
        { cast: { $in: [new RegExp(searchQuery, "i")] } },
      ];
    }

    if (genre && genre !== "All") {
      query.genres = { $in: [genre] };
    }

    if (language && language !== "All") {
      query.language = { $regex: new RegExp(`^${language}$`, "i") };
    }

    // Sort options — default: newly added movies at top (createdAt / _id desc)
    let sortOption = { createdAt: -1, _id: -1 };
    if (sort === "popularity") sortOption = { tmdbPopularity: -1, releaseDate: -1 };
    else if (sort === "rating") sortOption = { rating: -1 };
    else if (sort === "name") sortOption = { movieName: 1 };
    else if (sort === "date") sortOption = { releaseDate: -1, createdAt: -1 };

    const movies = await Movie.find(query).sort(sortOption);

    // Distinct genres and languages for UI filter dropdowns
    const allGenres    = await Movie.distinct("genres");
    const allLanguages = await Movie.distinct("language");

    res.json({
      success: true,
      count: movies.length,
      genres: allGenres.sort(),
      languages: allLanguages.sort(),
      movies,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET SINGLE MOVIE
exports.getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found." });
    }
    res.json({ success: true, movie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE MOVIE (Admin)
exports.createMovie = async (req, res) => {
  try {
    const {
      movieName,
      description,
      genres,
      releaseDate,
      language,
      duration,
      certification,
      posterUrl,
      bannerUrl,
      trailerUrl,
      cast,
      director,
      rating,
    } = req.body;

    const parsedGenres = Array.isArray(genres)
      ? genres
      : typeof genres === "string"
      ? genres.split(",").map((g) => g.trim())
      : [];

    const parsedCast = Array.isArray(cast)
      ? cast
      : typeof cast === "string"
      ? cast.split(",").map((c) => c.trim())
      : [];

    const movie = await Movie.create({
      movieName,
      description,
      genres: parsedGenres,
      releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
      language,
      duration,
      certification: certification || "U/A",
      posterUrl: posterUrl || undefined,
      bannerUrl: bannerUrl || undefined,
      trailerUrl: trailerUrl || undefined,
      cast: parsedCast,
      director: director || "Unknown",
      rating: rating ? Number(rating) : 8.0,
    });

    res.status(201).json({
      success: true,
      message: "Movie added successfully!",
      movie,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE MOVIE (Admin)
exports.updateMovie = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (typeof updates.genres === "string") {
      updates.genres = updates.genres.split(",").map((g) => g.trim());
    }
    if (typeof updates.cast === "string") {
      updates.cast = updates.cast.split(",").map((c) => c.trim());
    }

    const movie = await Movie.findByIdAndUpdate(req.params.movieId, updates, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found." });
    }

    res.json({ success: true, message: "Movie updated successfully!", movie });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE MOVIE (Admin)
exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found." });
    }
    res.json({ success: true, message: "Movie deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
