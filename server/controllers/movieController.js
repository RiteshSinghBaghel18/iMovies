const Movie = require('../models/movieModel');
const Theatre = require('../models/theatreModel');
const Show = require('../models/showModel');
const tmdbService = require('../services/tmdbService');
const { ensureShowsForMovie } = require('../utils/showGenerator');

// Get all movies with dynamic live TMDB market integration and optional filters (?genre=&language=&search=)
const getAllMovies = async (req, res) => {
  try {
    const { genre, language, search, category, refresh, location } = req.query;

    // 1. If searching, attempt TMDB live sync if local DB might need fresh records
    if (search && search.trim()) {
      try {
        const localMatches = await Movie.countDocuments({
          $or: [
            { movieName: { $regex: search.trim(), $options: 'i' } },
            { description: { $regex: search.trim(), $options: 'i' } }
          ]
        });

        if (localMatches === 0) {
          const tmdbSearchResults = await tmdbService.searchMovies(search.trim());
          const results = (tmdbSearchResults.results || []).slice(0, 10);
          const genreMap = await tmdbService.fetchGenreMap();

          for (const item of results) {
            let details = null;
            try {
              details = await tmdbService.getMovieDetails(item.id);
            } catch (e) {
              // non-fatal
            }
            const formatted = tmdbService.formatMovieData(item, details, genreMap);
            const doc = await Movie.findOneAndUpdate(
              { tmdbId: formatted.tmdbId },
              { $set: formatted },
              { new: true, upsert: true }
            );
            if (doc) {
              await ensureShowsForMovie(doc, 7);
            }
          }
        }
      } catch (tmdbErr) {
        console.warn('[movieController] TMDB search fallback to local DB:', tmdbErr.message);
      }
    }

    // 2. Check if DB has enough TMDB live movies; if not, sync from TMDB
    const count = await Movie.countDocuments({ tmdbId: { $exists: true, $ne: null } });
    if (count < 10 || refresh === 'true') {
      try {
        console.log('[movieController] Seeding/Syncing live market movies with real trailers from TMDB...');
        const nowPlaying = await tmdbService.syncNowPlayingMovies(12);
        const popular = await tmdbService.syncPopularMovies(12);
        const topRated = await tmdbService.syncTopRatedMovies(10);
        const upcoming = await tmdbService.syncUpcomingMovies(10);
        const allNew = [...nowPlaying, ...popular, ...topRated, ...upcoming];
        for (const m of allNew.slice(0, 8)) {
          await ensureShowsForMovie(m, 7);
        }
      } catch (syncErr) {
        console.warn('[movieController] Live TMDB auto-sync non-fatal warning:', syncErr.message);
      }
    }

    // 3. Build MongoDB query filter matching search, genre, language, and category
    const andConditions = [];

    // Exclude any legacy mock movies
    andConditions.push({
      movieName: {
        $nin: [
          'Galactic Storm',
          'Midnight Shadows',
          'Laughing Paradise',
          'Eternal Hearts',
          'Shadow Protocol',
          "Dragon's Peak"
        ]
      }
    });

    // Search filter (?search=)
    if (search && search.trim()) {
      const sTerm = search.trim();
      andConditions.push({
        $or: [
          { movieName: { $regex: sTerm, $options: 'i' } },
          { description: { $regex: sTerm, $options: 'i' } }
        ]
      });
    }

    // Genre filter (?genre=)
    if (genre && genre.trim() && genre !== 'All' && genre !== 'All Genres') {
      const gTerm = genre.trim();
      andConditions.push({
        $or: [
          { genres: { $regex: new RegExp(gTerm, 'i') } },
          { genre: { $regex: new RegExp(gTerm, 'i') } }
        ]
      });
    }

    // Language filter (?language=)
    if (language && language.trim() && language !== 'All' && language !== 'All Languages') {
      const lTerm = language.trim();
      const langMap = {
        english: 'en',
        hindi: 'hi',
        korean: 'ko',
        japanese: 'ja',
        spanish: 'es',
        french: 'fr',
        german: 'de',
        tamil: 'ta',
        telugu: 'te',
        malayalam: 'ml',
        chinese: 'zh'
      };
      const code = langMap[lTerm.toLowerCase()];
      if (code) {
        andConditions.push({
          $or: [
            { language: { $regex: new RegExp(`^${lTerm}$`, 'i') } },
            { language: { $regex: new RegExp(`^${code}$`, 'i') } },
            { language: { $regex: new RegExp(lTerm, 'i') } }
          ]
        });
      } else {
        andConditions.push({
          language: { $regex: new RegExp(lTerm, 'i') }
        });
      }
    }

    // Location filter
    if (location && location !== 'All' && location !== 'All Countries') {
      const matchingTheatres = await Theatre.find({ location: new RegExp(location.trim(), 'i') });
      if (matchingTheatres.length > 0) {
        const theatreIds = matchingTheatres.map(t => t.theatreId);
        const shows = await Show.find({ theatreId: { $in: theatreIds } });
        const movieIds = [...new Set(shows.map(s => s.movieId))];
        if (movieIds.length > 0) {
          andConditions.push({
            $or: [
              { _id: { $in: movieIds } },
              { tmdbId: { $in: movieIds.filter(id => !isNaN(id)) } }
            ]
          });
        }
      }
    }

    // Category tabs filter
    if (category) {
      if (category === 'nowPlaying' || category === 'now_playing') {
        andConditions.push({
          $or: [{ categories: 'now_playing' }, { releaseDate: { $lte: new Date() } }]
        });
      } else if (category === 'popular') {
        andConditions.push({ categories: 'popular' });
      } else if (category === 'top_rated') {
        andConditions.push({
          $or: [{ categories: 'top_rated' }, { rating: { $gte: 7.0 } }]
        });
      } else if (category === 'upcoming') {
        andConditions.push({
          $or: [{ categories: 'upcoming' }, { releaseDate: { $gt: new Date() } }]
        });
      }
    }

    const finalFilter = andConditions.length > 0 ? { $and: andConditions } : {};

    let sort = { releaseDate: -1, createdAt: -1 };
    if (category === 'popular') {
      sort = { voteCount: -1, rating: -1 };
    } else if (category === 'top_rated') {
      sort = { rating: -1, voteCount: -1 };
    } else if (category === 'upcoming') {
      sort = { releaseDate: 1 };
    }

    const movies = await Movie.find(finalFilter).sort(sort);

    return res.status(200).json({
      success: true,
      source: 'live-market-synced',
      count: movies.length,
      data: movies,
      movies
    });
  } catch (error) {
    console.error('[movieController] Error in getAllMovies:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching movies'
    });
  }
};

// Curated movie sections endpoint for Home page
const getMovieSections = async (req, res) => {
  try {
    const count = await Movie.countDocuments({ tmdbId: { $exists: true, $ne: null } });
    if (count < 15) {
      try {
        await tmdbService.syncNowPlayingMovies(12);
        await tmdbService.syncPopularMovies(12);
        await tmdbService.syncTopRatedMovies(10);
        await tmdbService.syncUpcomingMovies(10);
      } catch (e) {
        console.warn('[movieController] Error auto-syncing sections:', e.message);
      }
    }

    const today = new Date();

    const [trending, nowPlaying, topRated, upcoming] = await Promise.all([
      Movie.find({
        categories: 'popular',
        movieName: { $nin: ['Galactic Storm', 'Midnight Shadows', 'Laughing Paradise', 'Eternal Hearts', 'Shadow Protocol', "Dragon's Peak"] }
      }).sort({ voteCount: -1, rating: -1 }).limit(12),

      Movie.find({
        $or: [{ categories: 'now_playing' }, { releaseDate: { $lte: today } }],
        movieName: { $nin: ['Galactic Storm', 'Midnight Shadows', 'Laughing Paradise', 'Eternal Hearts', 'Shadow Protocol', "Dragon's Peak"] }
      }).sort({ releaseDate: -1 }).limit(12),

      Movie.find({
        $or: [{ categories: 'top_rated' }, { rating: { $gte: 7.5 } }],
        movieName: { $nin: ['Galactic Storm', 'Midnight Shadows', 'Laughing Paradise', 'Eternal Hearts', 'Shadow Protocol', "Dragon's Peak"] }
      }).sort({ rating: -1, voteCount: -1 }).limit(12),

      Movie.find({
        $or: [{ categories: 'upcoming' }, { releaseDate: { $gt: today } }],
        movieName: { $nin: ['Galactic Storm', 'Midnight Shadows', 'Laughing Paradise', 'Eternal Hearts', 'Shadow Protocol', "Dragon's Peak"] }
      }).sort({ releaseDate: 1 }).limit(12)
    ]);

    const allMovies = await Movie.find({
      movieName: { $nin: ['Galactic Storm', 'Midnight Shadows', 'Laughing Paradise', 'Eternal Hearts', 'Shadow Protocol', "Dragon's Peak"] }
    }).sort({ releaseDate: -1 }).limit(20);

    return res.status(200).json({
      success: true,
      sections: {
        trending: trending.length > 0 ? trending : allMovies.slice(0, 10),
        nowPlaying: nowPlaying.length > 0 ? nowPlaying : allMovies.slice(0, 12),
        topRated: topRated.length > 0 ? topRated : allMovies.filter(m => m.rating >= 7),
        upcoming: upcoming.length > 0 ? upcoming : allMovies.slice(-6)
      }
    });
  } catch (error) {
    console.error('[movieController] Error in getMovieSections:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching movie sections'
    });
  }
};

// Get single movie by ID (supports MongoDB _id or TMDB ID)
const getMovieById = async (req, res) => {
  try {
    const idParam = req.params.id;
    let movie = null;

    // Check if it's a valid 24-char hex Mongo ObjectId
    if (idParam.match(/^[0-9a-fA-F]{24}$/)) {
      movie = await Movie.findById(idParam);
    }

    // If not found and it's a number, check by tmdbId
    if (!movie && !isNaN(Number(idParam))) {
      movie = await Movie.findOne({ tmdbId: Number(idParam) });
    }

    // If still not found and numeric, attempt live fetch from TMDB
    if (!movie && !isNaN(Number(idParam))) {
      try {
        const tmdbDetails = await tmdbService.getMovieDetails(Number(idParam));
        if (tmdbDetails) {
          movie = await tmdbService.syncMovieToDb(tmdbDetails, true);
        }
      } catch (tmdbErr) {
        console.warn('[movieController] Could not fetch TMDB details live:', tmdbErr.message);
      }
    }

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Self-healing: if movie has fake rickroll trailer or missing trailer, fix it with real TMDB trailer
    if (movie.tmdbId && (!movie.trailerUrl || movie.trailerUrl.includes('dQw4w9WgXcQ'))) {
      try {
        const realTrailerUrl = await tmdbService.fetchMovieTrailerUrl(movie.tmdbId, movie.movieName);
        if (realTrailerUrl) {
          movie = await Movie.findByIdAndUpdate(
            movie._id,
            { $set: { trailerUrl: realTrailerUrl } },
            { new: true }
          );
        }
      } catch (err) {
        // non-fatal
      }
    }

    // Ensure shows exist for this movie so user can book it
    await ensureShowsForMovie(movie, 4);

    return res.status(200).json({
      success: true,
      data: movie,
      movie
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching movie'
    });
  }
};

// Live TMDB Market endpoint: Now Playing
const getMarketNowPlaying = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getNowPlaying(page);
    const genreMap = await tmdbService.fetchGenreMap();

    const formattedMovies = (data.results || []).map(m =>
      tmdbService.formatMovieData(m, null, genreMap, 'now_playing')
    );

    return res.status(200).json({
      success: true,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      data: formattedMovies,
      movies: formattedMovies
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching TMDB now playing'
    });
  }
};

// Live TMDB Market endpoint: Popular
const getMarketPopular = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getPopular(page);
    const genreMap = await tmdbService.fetchGenreMap();

    const formattedMovies = (data.results || []).map(m =>
      tmdbService.formatMovieData(m, null, genreMap, 'popular')
    );

    return res.status(200).json({
      success: true,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      data: formattedMovies,
      movies: formattedMovies
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching TMDB popular'
    });
  }
};

// Live TMDB Market endpoint: Upcoming
const getMarketUpcoming = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getUpcoming(page);
    const genreMap = await tmdbService.fetchGenreMap();

    const formattedMovies = (data.results || []).map(m =>
      tmdbService.formatMovieData(m, null, genreMap, 'upcoming')
    );

    return res.status(200).json({
      success: true,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      data: formattedMovies,
      movies: formattedMovies
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching TMDB upcoming'
    });
  }
};

// Live TMDB Market endpoint: Search
const searchMarketMovies = async (req, res) => {
  try {
    const query = req.query.query || req.query.q || '';
    if (!query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.searchMovies(query.trim(), page);
    const genreMap = await tmdbService.fetchGenreMap();

    const formattedMovies = (data.results || []).map(m =>
      tmdbService.formatMovieData(m, null, genreMap)
    );

    return res.status(200).json({
      success: true,
      query,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      data: formattedMovies,
      movies: formattedMovies
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error searching TMDB movies'
    });
  }
};

// Admin/Manual trigger to sync latest movies from TMDB
const syncTmdbMovies = async (req, res) => {
  try {
    const limit = parseInt(req.body.limit) || 15;
    const nowPlaying = await tmdbService.syncNowPlayingMovies(limit);
    const popular = await tmdbService.syncPopularMovies(limit);
    const topRated = await tmdbService.syncTopRatedMovies(10);
    const upcoming = await tmdbService.syncUpcomingMovies(10);

    const allMovies = await Movie.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: `Synced ${nowPlaying.length} now playing, ${popular.length} popular, ${topRated.length} top rated, ${upcoming.length} upcoming movies with original trailers from TMDB.`,
      nowPlayingCount: nowPlaying.length,
      popularCount: popular.length,
      topRatedCount: topRated.length,
      upcomingCount: upcoming.length,
      totalMovies: allMovies.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error syncing TMDB movies'
    });
  }
};

// Add a new movie (Admin)
const addMovie = async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    // Ensure shows are generated for newly added movie
    await ensureShowsForMovie(movie, 4);

    return res.status(201).json({
      success: true,
      message: 'Movie added successfully',
      data: movie,
      movie
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error adding movie'
    });
  }
};

// Update an existing movie (Admin)
const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Movie updated successfully',
      data: movie,
      movie
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error updating movie'
    });
  }
};

// Delete a movie (Admin)
const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Movie deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting movie'
    });
  }
};

module.exports = {
  getAllMovies,
  getMovieSections,
  getMovieById,
  getMarketNowPlaying,
  getMarketPopular,
  getMarketUpcoming,
  searchMarketMovies,
  syncTmdbMovies,
  addMovie,
  updateMovie,
  deleteMovie
};
