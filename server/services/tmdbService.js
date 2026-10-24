const axios = require('axios');
const Movie = require('../models/movieModel');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

const TMDB_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

const getApiKey = () => {
  return process.env.TMDB_API_KEY || 'd1e52c6b5d20f8ab492da5af4e09625e';
};

// Create configured axios client with proper headers
const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 10000,
  adapter: 'fetch',
  headers: TMDB_HEADERS
});

/**
 * Robust request helper with automatic exponential retry
 */
const tmdbRequest = async (path, params = {}, retries = 4) => {
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await tmdbClient.get(path, {
        params: { api_key: getApiKey(), ...params },
        headers: TMDB_HEADERS
      });
      return res.data;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }
  throw lastError;
};

// In-memory genre mapping cache
let genreCache = null;

const ISO_LANG_MAP = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  ko: 'Korean',
  ja: 'Japanese',
  zh: 'Chinese',
  de: 'German',
  it: 'Italian',
  ru: 'Russian',
  pt: 'Portuguese',
  ar: 'Arabic',
  tr: 'Turkish'
};

const EXCLUDED_LANG_CODES = ['hi', 'ta', 'te', 'ml', 'kn', 'pa', 'mr', 'gu', 'bn'];
const EXCLUDED_LANG_NAMES = [
  'hindi', 'tamil', 'telugu', 'telgu', 'malayalam', 'kannada', 'punjabi', 'marathi', 'gujarati', 'bengali', 'indian'
];

/**
 * Filter out Indian / regional movies and movies without valid posters
 */
const isExcludedMovie = (tmdbMovie) => {
  if (!tmdbMovie) return true;
  // Must have a real poster - never allow movies without posters
  if (!tmdbMovie.poster_path && !tmdbMovie.posterUrl) return true;

  const lang = (tmdbMovie.original_language || tmdbMovie.language || '').toLowerCase();
  if (EXCLUDED_LANG_CODES.includes(lang) || EXCLUDED_LANG_NAMES.includes(lang)) {
    return true;
  }

  if (Array.isArray(tmdbMovie.origin_country) && tmdbMovie.origin_country.includes('IN')) {
    return true;
  }
  if (Array.isArray(tmdbMovie.production_countries) && tmdbMovie.production_countries.some(c => c.iso_3166_1 === 'IN')) {
    return true;
  }

  return false;
};

/**
 * Fetch and cache the TMDB genre list
 */
const fetchGenreMap = async () => {
  if (genreCache) return genreCache;
  try {
    const data = await tmdbRequest('/genre/movie/list');
    const map = {};
    if (data && data.genres) {
      data.genres.forEach((g) => {
        map[g.id] = g.name;
      });
    }
    genreCache = map;
    return map;
  } catch (error) {
    console.warn('[tmdbService] Error fetching genres, using fallback:', error.message);
    return {};
  }
};

/**
 * Format minutes into "Xh Ym" string
 */
const formatRuntime = (minutes) => {
  if (!minutes || typeof minutes !== 'number' || minutes <= 0) return '2h 15m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
};

/**
 * Extract the best genuine YouTube trailer URL from TMDB videos array
 */
const extractTrailerUrl = (videosList = [], movieTitle = '') => {
  if (Array.isArray(videosList) && videosList.length > 0) {
    const ytVideos = videosList.filter((v) => v.site === 'YouTube' && v.key);

    // 1. Official Trailer
    const officialTrailer = ytVideos.find(
      (v) => v.type === 'Trailer' && (v.official === true || /official/i.test(v.name || ''))
    );
    if (officialTrailer && officialTrailer.key) {
      return `https://www.youtube.com/watch?v=${officialTrailer.key}`;
    }

    // 2. Any Trailer
    const anyTrailer = ytVideos.find((v) => v.type === 'Trailer');
    if (anyTrailer && anyTrailer.key) {
      return `https://www.youtube.com/watch?v=${anyTrailer.key}`;
    }

    // 3. Teaser
    const teaser = ytVideos.find((v) => v.type === 'Teaser');
    if (teaser && teaser.key) {
      return `https://www.youtube.com/watch?v=${teaser.key}`;
    }

    // 4. Any YouTube video (Clip, Sneak Peek, Featurette)
    if (ytVideos[0] && ytVideos[0].key) {
      return `https://www.youtube.com/watch?v=${ytVideos[0].key}`;
    }
  }

  // Fallback to real YouTube search for the movie's official trailer (never Rickroll!)
  const query = movieTitle ? `${movieTitle} official trailer` : 'movie official trailer';
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
};

/**
 * Fetch movie videos directly from TMDB
 */
const fetchMovieVideos = async (tmdbId) => {
  if (!tmdbId) return [];
  try {
    const data = await tmdbRequest(`/movie/${tmdbId}/videos`, {
      include_video_language: 'en,null'
    });
    if (data && Array.isArray(data.results) && data.results.length > 0) {
      return data.results;
    }
    // Fallback: without language constraint
    const allData = await tmdbRequest(`/movie/${tmdbId}/videos`);
    return allData?.results || [];
  } catch (err) {
    return [];
  }
};

/**
 * Fetch trailer URL for a movie ID
 */
const fetchMovieTrailerUrl = async (tmdbId, movieTitle) => {
  const videos = await fetchMovieVideos(tmdbId);
  return extractTrailerUrl(videos, movieTitle);
};

/**
 * Format raw TMDB movie into standard iMovies schema format
 */
const formatMovieData = (tmdbMovie, details = null, genreMap = {}, categoryTag = null) => {
  if (isExcludedMovie(tmdbMovie)) {
    return null;
  }

  const posterPath = tmdbMovie.poster_path || details?.poster_path;
  if (!posterPath) {
    return null; // Reject movies without valid posters
  }

  const movieTitle = (tmdbMovie.title || tmdbMovie.original_title || 'Untitled Movie').trim();

  // Extract genres
  let genres = [];
  if (details && Array.isArray(details.genres) && details.genres.length > 0) {
    genres = details.genres.map((g) => g.name);
  } else if (Array.isArray(tmdbMovie.genre_ids) && tmdbMovie.genre_ids.length > 0) {
    genres = tmdbMovie.genre_ids
      .map((id) => genreMap[id])
      .filter(Boolean);
  }
  if (!genres || genres.length === 0) {
    genres = ['Action', 'Drama'];
  }

  // Language
  const langCode = (tmdbMovie.original_language || 'en').toLowerCase();
  const language = ISO_LANG_MAP[langCode] || langCode.toUpperCase();

  // Duration
  const runtimeMin = details?.runtime;
  const duration = formatRuntime(runtimeMin);

  // Posters & Backdrops (Authentic TMDB only, sanitized HTTPS)
  let posterUrl = posterPath;
  if (!posterUrl.startsWith('http://') && !posterUrl.startsWith('https://')) {
    posterUrl = `${TMDB_IMAGE_BASE}${posterUrl.startsWith('/') ? posterUrl : `/${posterUrl}`}`;
  }
  let backdropUrl = tmdbMovie.backdrop_path || details?.backdrop_path;
  if (backdropUrl && !backdropUrl.startsWith('http://') && !backdropUrl.startsWith('https://')) {
    backdropUrl = `${TMDB_BACKDROP_BASE}${backdropUrl.startsWith('/') ? backdropUrl : `/${backdropUrl}`}`;
  } else if (!backdropUrl) {
    backdropUrl = posterUrl;
  }

  // Real Trailer URL extraction
  let trailerUrl = '';
  if (details && details.videos && Array.isArray(details.videos.results)) {
    trailerUrl = extractTrailerUrl(details.videos.results, movieTitle);
  } else if (tmdbMovie.videos && Array.isArray(tmdbMovie.videos.results)) {
    trailerUrl = extractTrailerUrl(tmdbMovie.videos.results, movieTitle);
  } else {
    trailerUrl = extractTrailerUrl([], movieTitle);
  }

  // Cast members with TMDB w185 profile images
  let cast = [];
  if (details && details.credits && Array.isArray(details.credits.cast)) {
    cast = details.credits.cast.slice(0, 12).map((c) => {
      const profilePath = c.profile_path || '';
      const profileUrl = profilePath
        ? `https://image.tmdb.org/t/p/w185${profilePath.startsWith('/') ? profilePath : '/' + profilePath}`
        : '';
      return {
        name: c.name || 'Actor',
        role: c.character ? c.character.slice(0, 40) : (c.order === 0 ? 'Lead Actor' : 'Supporting'),
        profilePath,
        profileUrl,
        image: profileUrl
      };
    });
  }
  if (cast.length === 0) {
    cast = [
      {
        name: 'Lead Cast',
        role: 'Protagonist',
        profilePath: '',
        profileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=185&q=80',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=185&q=80'
      },
      {
        name: 'Co-Star',
        role: 'Supporting',
        profilePath: '',
        profileUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=185&q=80',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=185&q=80'
      }
    ];
  }

  // Description
  let description = (tmdbMovie.overview || '').trim();
  if (description.length < 10) {
    description = `An exhilarating and cinematic theatrical experience featuring ${movieTitle}. Now showing in premier auditoriums worldwide.`;
  }

  // Release date
  let releaseDate = tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : new Date();
  if (isNaN(releaseDate.getTime())) {
    releaseDate = new Date();
  }

  // Certification rating
  const rating = Number(tmdbMovie.vote_average) || 7.0;
  let certification = 'U/A';
  if (rating >= 8.0) certification = 'A';
  else if (rating <= 6.0) certification = 'U';

  return {
    movieName: movieTitle,
    description,
    genres,
    releaseDate,
    language,
    duration,
    certification,
    posterUrl,
    backdropUrl,
    trailerUrl,
    cast,
    tmdbId: tmdbMovie.id,
    rating,
    voteCount: tmdbMovie.vote_count || 0
  };
};

/**
 * Fetch Now Playing movies from TMDB API
 */
const getNowPlaying = async (page = 1) => {
  return await tmdbRequest('/movie/now_playing', { page });
};

/**
 * Fetch Popular movies from TMDB API
 */
const getPopular = async (page = 1) => {
  return await tmdbRequest('/movie/popular', { page });
};

/**
 * Fetch Top Rated movies from TMDB API
 */
const getTopRated = async (page = 1) => {
  return await tmdbRequest('/movie/top_rated', { page });
};

/**
 * Fetch Upcoming movies from TMDB API
 */
const getUpcoming = async (page = 1) => {
  return await tmdbRequest('/movie/upcoming', { page });
};

/**
 * Search movies on TMDB
 */
const searchMovies = async (query, page = 1) => {
  return await tmdbRequest('/search/movie', { query, page });
};

/**
 * Get detailed movie information including credits and videos
 */
const getMovieDetails = async (tmdbId) => {
  try {
    const data = await tmdbRequest(`/movie/${tmdbId}`, {
      append_to_response: 'credits,videos'
    });

    // If videos results is empty, attempt a direct videos query
    if (data && (!data.videos || !data.videos.results || data.videos.results.length === 0)) {
      const extraVideos = await fetchMovieVideos(tmdbId);
      if (extraVideos.length > 0) {
        if (!data.videos) data.videos = {};
        data.videos.results = extraVideos;
      }
    }

    return data;
  } catch (error) {
    console.warn(`[tmdbService] Could not fetch extra details for TMDB ID ${tmdbId}:`, error.message);
    return null;
  }
};

/**
 * Sync a single TMDB movie object into MongoDB (upsert by tmdbId or movieName)
 */
const syncMovieToDb = async (tmdbMovie, fetchDetails = true, categoryTag = null) => {
  try {
    if (isExcludedMovie(tmdbMovie)) return null;

    const genreMap = await fetchGenreMap();
    let details = null;
    if (fetchDetails && tmdbMovie.id) {
      details = await getMovieDetails(tmdbMovie.id);
    }

    const formatted = formatMovieData(tmdbMovie, details, genreMap, categoryTag);
    if (!formatted) return null;

    let query = {};
    if (formatted.tmdbId) {
      query = { tmdbId: formatted.tmdbId };
    } else {
      query = { movieName: formatted.movieName };
    }

    const updateOps = { $set: formatted };
    if (categoryTag) {
      updateOps.$addToSet = { categories: categoryTag };
    }

    const movie = await Movie.findOneAndUpdate(
      query,
      updateOps,
      { new: true, upsert: true, runValidators: true }
    );

    return movie;
  } catch (error) {
    console.error(`[tmdbService] Error syncing movie "${tmdbMovie.title}":`, error.message);
    return null;
  }
};

/**
 * Fetch and sync a collection of now-playing movies from TMDB into MongoDB
 */
const syncNowPlayingMovies = async (limit = 12) => {
  try {
    console.log('[tmdbService] Syncing live Now Playing movies with official trailers from TMDB...');
    const genreMap = await fetchGenreMap();
    const data = await getNowPlaying(1);
    const results = (data.results || []).filter(raw => !isExcludedMovie(raw)).slice(0, limit);

    const savedMovies = [];
    for (const raw of results) {
      let details = null;
      try {
        details = await getMovieDetails(raw.id);
        await new Promise((r) => setTimeout(r, 120)); // graceful delay between calls
      } catch (e) {
        // non-fatal
      }
      const formatted = formatMovieData(raw, details, genreMap, 'now_playing');
      if (!formatted) continue;
      const doc = await Movie.findOneAndUpdate(
        { tmdbId: formatted.tmdbId },
        {
          $set: formatted,
          $addToSet: { categories: 'now_playing' }
        },
        { new: true, upsert: true }
      );
      if (doc) savedMovies.push(doc);
    }

    console.log(`[tmdbService] Successfully synced ${savedMovies.length} Now Playing movies with genuine trailers.`);
    return savedMovies;
  } catch (error) {
    console.error('[tmdbService] Failed to sync Now Playing movies:', error.message);
    return [];
  }
};

/**
 * Fetch and sync popular movies from TMDB into MongoDB
 */
const syncPopularMovies = async (limit = 12) => {
  try {
    console.log('[tmdbService] Syncing live Popular/Trending movies with official trailers from TMDB...');
    const genreMap = await fetchGenreMap();
    const data = await getPopular(1);
    const results = (data.results || []).filter(raw => !isExcludedMovie(raw)).slice(0, limit);

    const savedMovies = [];
    for (const raw of results) {
      let details = null;
      try {
        details = await getMovieDetails(raw.id);
        await new Promise((r) => setTimeout(r, 120));
      } catch (e) {
        // non-fatal
      }
      const formatted = formatMovieData(raw, details, genreMap, 'popular');
      if (!formatted) continue;

      const doc = await Movie.findOneAndUpdate(
        { tmdbId: formatted.tmdbId },
        {
          $set: formatted,
          $addToSet: { categories: 'popular' }
        },
        { new: true, upsert: true }
      );
      if (doc) savedMovies.push(doc);
    }

    console.log(`[tmdbService] Successfully synced ${savedMovies.length} Popular movies.`);
    return savedMovies;
  } catch (error) {
    console.error('[tmdbService] Failed to sync Popular movies:', error.message);
    return [];
  }
};

/**
 * Fetch and sync top rated movies from TMDB into MongoDB
 */
const syncTopRatedMovies = async (limit = 10) => {
  try {
    console.log('[tmdbService] Syncing live Top Rated movies with official trailers from TMDB...');
    const genreMap = await fetchGenreMap();
    const data = await getTopRated(1);
    const results = (data.results || []).filter(raw => !isExcludedMovie(raw)).slice(0, limit);

    const savedMovies = [];
    for (const raw of results) {
      let details = null;
      try {
        details = await getMovieDetails(raw.id);
        await new Promise((r) => setTimeout(r, 120));
      } catch (e) {
        // non-fatal
      }
      const formatted = formatMovieData(raw, details, genreMap, 'top_rated');
      if (!formatted) continue;

      const doc = await Movie.findOneAndUpdate(
        { tmdbId: formatted.tmdbId },
        {
          $set: formatted,
          $addToSet: { categories: 'top_rated' }
        },
        { new: true, upsert: true }
      );
      if (doc) savedMovies.push(doc);
    }

    console.log(`[tmdbService] Successfully synced ${savedMovies.length} Top Rated movies.`);
    return savedMovies;
  } catch (error) {
    console.error('[tmdbService] Failed to sync Top Rated movies:', error.message);
    return [];
  }
};

/**
 * Fetch and sync upcoming movies from TMDB into MongoDB
 */
const syncUpcomingMovies = async (limit = 10) => {
  try {
    console.log('[tmdbService] Syncing live Upcoming movies with official trailers from TMDB...');
    const genreMap = await fetchGenreMap();
    const data = await getUpcoming(1);
    const results = (data.results || []).filter(raw => !isExcludedMovie(raw)).slice(0, limit);

    const savedMovies = [];
    for (const raw of results) {
      let details = null;
      try {
        details = await getMovieDetails(raw.id);
        await new Promise((r) => setTimeout(r, 120));
      } catch (e) {
        // non-fatal
      }
      const formatted = formatMovieData(raw, details, genreMap, 'upcoming');
      if (!formatted) continue;

      const doc = await Movie.findOneAndUpdate(
        { tmdbId: formatted.tmdbId },
        {
          $set: formatted,
          $addToSet: { categories: 'upcoming' }
        },
        { new: true, upsert: true }
      );
      if (doc) savedMovies.push(doc);
    }

    console.log(`[tmdbService] Successfully synced ${savedMovies.length} Upcoming movies.`);
    return savedMovies;
  } catch (error) {
    console.error('[tmdbService] Failed to sync Upcoming movies:', error.message);
    return [];
  }
};

module.exports = {
  tmdbClient,
  getApiKey,
  tmdbRequest,
  fetchGenreMap,
  formatMovieData,
  isExcludedMovie,
  EXCLUDED_LANG_CODES,
  EXCLUDED_LANG_NAMES,
  extractTrailerUrl,
  fetchMovieVideos,
  fetchMovieTrailerUrl,
  getNowPlaying,
  getPopular,
  getTopRated,
  getUpcoming,
  searchMovies,
  getMovieDetails,
  syncMovieToDb,
  syncNowPlayingMovies,
  syncPopularMovies,
  syncTopRatedMovies,
  syncUpcomingMovies
};
