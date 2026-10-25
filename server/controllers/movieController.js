const Movie = require("../models/movieModel");

// GET ALL MOVIES (Strictly: Currently In Theatres, Admin Added, Upcoming)
exports.getAllMovies = async (req, res) => {
  try {
    const { search, q, genre, language, sort, category } = req.query;
    const searchQuery = search || q;

    const andConditions = [];

    // 1. Theatrical / Category Filter (Default: In Theatres, Admin Added, and Upcoming only)
    if (category && category !== "All") {
      if (category === "admin" || category === "custom") {
        andConditions.push({ $or: [{ isAdminAdded: true }, { isCustom: true }] });
      } else if (category === "now_playing" || category === "theatre") {
        andConditions.push({
          $or: [
            { category: "now_playing" },
            { isAdminAdded: true },
            { isCustom: true },
          ],
        });
      } else if (category === "upcoming") {
        andConditions.push({ category: "upcoming" });
      } else {
        andConditions.push({ category });
      }
    } else {
      // Default: Only load movies that are currently in theatres, admin added, or upcoming
      andConditions.push({
        $or: [
          { isAdminAdded: true },
          { isCustom: true },
          { category: "now_playing" },
          { category: "upcoming" },
        ],
      });
    }

    // 2. Search Filter (Database query only, NEVER saved to database or tracked)
    if (searchQuery) {
      andConditions.push({
        $or: [
          { movieName: { $regex: searchQuery, $options: "i" } },
          { description: { $regex: searchQuery, $options: "i" } },
          { genres: { $in: [new RegExp(searchQuery, "i")] } },
          { director: { $regex: searchQuery, $options: "i" } },
          { cast: { $in: [new RegExp(searchQuery, "i")] } },
        ],
      });
    }

    // 3. Genre Filter
    if (genre && genre !== "All") {
      andConditions.push({ genres: { $in: [genre] } });
    }

    // 4. Language Filter
    if (language && language !== "All") {
      andConditions.push({ language: { $regex: new RegExp(`^${language}$`, "i") } });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    // Sort options: Admin added movies ALWAYS at top!
    let sortOption = { isAdminAdded: -1, isCustom: -1, createdAt: -1, _id: -1 };
    if (sort === "popularity") sortOption = { isAdminAdded: -1, isCustom: -1, tmdbPopularity: -1, releaseDate: -1 };
    else if (sort === "rating") sortOption = { isAdminAdded: -1, isCustom: -1, rating: -1 };
    else if (sort === "name") sortOption = { isAdminAdded: -1, isCustom: -1, movieName: 1 };
    else if (sort === "date") sortOption = { isAdminAdded: -1, isCustom: -1, releaseDate: -1, createdAt: -1 };

    const movies = await Movie.find(query).sort(sortOption);

    // Distinct genres and languages for UI dropdowns
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
      category,
    } = req.body;

    const parsedGenres = Array.isArray(genres)
      ? genres
      : typeof genres === "string"
      ? genres.split(",").map((g) => g.trim())
      : [];

    const parsedCast = Array.isArray(cast)
      ? cast.map((c) => (typeof c === "string" ? { name: c.trim(), character: "", profileUrl: null } : c))
      : typeof cast === "string"
      ? cast.split(",").map((c) => ({ name: c.trim(), character: "", profileUrl: null }))
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
      category: category || "custom",
      isAdminAdded: true,
      isCustom: true,
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
      updates.cast = updates.cast.split(",").map((c) => ({ name: c.trim(), character: "", profileUrl: null }));
    } else if (Array.isArray(updates.cast)) {
      updates.cast = updates.cast.map((c) => (typeof c === "string" ? { name: c.trim(), character: "", profileUrl: null } : c));
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
