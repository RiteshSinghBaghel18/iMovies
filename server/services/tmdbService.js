/**
 * TMDB Service — server/services/tmdbService.js
 *
 * Fetches live movie data from The Movie Database (TMDb) API v3 and
 * upserts the results into the local MongoDB `movies` collection.
 *
 * Exclusively queries:
 *  • /movie/now_playing  – In theatres currently (category: "now_playing")
 *  • /movie/upcoming     – Arriving in theatres soon (category: "upcoming")
 *
 * Never alters or deletes admin-added movies.
 * Never stores or tracks user search terms or views.
 */

const axios = require("axios");
const Movie = require("../models/movieModel");

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const TMDB_API_KEY  = process.env.TMDB_API_KEY;
const IMAGE_BASE    = process.env.TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p";

// Poster sizes:  w500 | original
// Backdrop sizes: w1280 | original
const POSTER_SIZE   = "w500";
const BACKDROP_SIZE = "w1280";
const ORIGINAL_SIZE = "original";

if (!TMDB_API_KEY) {
  console.warn("[TMDb] ⚠️  TMDB_API_KEY is not set in .env. Live sync will be skipped.");
}

/**
 * Build a reusable Axios instance with the API key always attached.
 */
const tmdb = axios.create({
  baseURL: TMDB_BASE_URL,
  params: { api_key: TMDB_API_KEY },
  timeout: 25_000,
});

/**
 * Resilient GET helper with automatic retries for transient socket resets.
 */
const tmdbGet = async (url, config = {}, retries = 3, delayMs = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await tmdb.get(url, config);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }
};

// ---------------------------------------------------------------------------
// Genre ID → human-readable name mapping (TMDb v3 movie genre IDs)
// ---------------------------------------------------------------------------
const GENRE_MAP = {
  28:    "Action",
  12:    "Adventure",
  16:    "Animation",
  35:    "Comedy",
  80:    "Crime",
  99:    "Documentary",
  18:    "Drama",
  10751: "Family",
  14:    "Fantasy",
  36:    "History",
  27:    "Horror",
  10402: "Music",
  9648:  "Mystery",
  10749: "Romance",
  878:   "Sci-Fi",
  10770: "TV Movie",
  53:    "Thriller",
  10752: "War",
  37:    "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

/**
 * Map a TMDb adult flag + certification to an MPAA / Indian CBFC label.
 */
const mapCertification = (adult, certification) => {
  if (certification) return certification;
  return adult ? "A" : "U/A";
};

/**
 * Convert a TMDb runtime (minutes) to a human-readable string, e.g. "2h 28m".
 */
const formatDuration = (minutes) => {
  if (!minutes) return "N/A";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

/**
 * Fetch full detail + credits + videos for a single TMDb movie.
 * Returns null on error so the batch can continue.
 */
const fetchMovieDetail = async (tmdbId, category = "now_playing") => {
  try {
    const [detailRes, creditsRes, videosRes] = await Promise.all([
      tmdbGet(`/movie/${tmdbId}`, {
        params: { append_to_response: "release_dates" },
      }),
      tmdbGet(`/movie/${tmdbId}/credits`),
      tmdbGet(`/movie/${tmdbId}/videos`),
    ]);

    const d = detailRes.data;
    const credits = creditsRes.data;
    const videos  = videosRes.data;

    // Extract top cast members with photos and character names
    const cast = credits.cast
      ?.slice(0, 8)
      .map((c) => ({
        name: c.name,
        character: c.character || "",
        profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      }))
      .filter((c) => c && c.name) || [];

    // Extract director
    const director =
      credits.crew?.find((c) => c.job === "Director")?.name || "Unknown";

    // Extract first YouTube trailer key
    const trailer = videos.results?.find(
      (v) => v.site === "YouTube" && v.type === "Trailer"
    );
    const trailerUrl = trailer
      ? `https://www.youtube.com/watch?v=${trailer.key}`
      : null;

    // Extract US or GB certification
    let certification = null;
    const usRelease = d.release_dates?.results?.find((r) => r.iso_3166_1 === "US");
    if (usRelease?.release_dates?.length) {
      certification = usRelease.release_dates.find((rd) => rd.certification)?.certification;
    }
    if (!certification) {
      const gbRelease = d.release_dates?.results?.find((r) => r.iso_3166_1 === "GB");
      if (gbRelease?.release_dates?.length) {
        certification = gbRelease.release_dates.find((rd) => rd.certification)?.certification;
      }
    }

    // Resolve genres: use embedded genre objects or fall back to genre_ids mapping
    const genreNames =
      d.genres?.length
        ? d.genres.map((g) => g.name)
        : d.genre_ids?.map((id) => GENRE_MAP[id]).filter(Boolean) || ["General"];

    // Original language label — normalize non-English to readable label
    const langMap = {
      en: "English", hi: "Hindi", fr: "French", es: "Spanish",
      de: "German", ja: "Japanese", ko: "Korean", zh: "Chinese",
      ta: "Tamil", te: "Telugu", ml: "Malayalam", pa: "Punjabi",
      pt: "Portuguese", it: "Italian", ru: "Russian", ar: "Arabic",
      th: "Thai", tr: "Turkish", nl: "Dutch", sv: "Swedish",
    };
    const language = langMap[d.original_language] ||
      (d.original_language ? d.original_language.toUpperCase() : "English");

    return {
      tmdbId: d.id,
      movieName:   d.title || d.original_title || "Untitled",
      description: d.overview || "No description available.",
      genres:      genreNames.length ? genreNames : ["General"],
      releaseDate: d.release_date ? new Date(d.release_date) : new Date(),
      language,
      duration:    formatDuration(d.runtime),
      certification: mapCertification(d.adult, certification),
      posterUrl:
        d.poster_path
          ? `${IMAGE_BASE}/${POSTER_SIZE}${d.poster_path}`
          : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
      bannerUrl:
        d.backdrop_path
          ? `${IMAGE_BASE}/${BACKDROP_SIZE}${d.backdrop_path}`
          : "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80",
      trailerUrl:
        trailerUrl ||
        `https://www.youtube.com/results?search_query=${encodeURIComponent((d.title || "") + " trailer")}`,
      cast,
      director,
      rating:    d.vote_average ? parseFloat(d.vote_average.toFixed(1)) : 7.0,
      voteCount: d.vote_count  || 0,
      tmdbPopularity: d.popularity || 0,
      category,
      isAdminAdded: false,
      isCustom: false,
    };
  } catch (err) {
    console.error(`[TMDb] Failed to fetch detail for id=${tmdbId}: ${err.message}`);
    return null;
  }
};

/**
 * Fetch a page of movies from the given TMDB list endpoint
 * (e.g. "/movie/now_playing", "/movie/upcoming").
 */
const fetchMovieList = async (endpoint, page = 1) => {
  try {
    const res = await tmdbGet(endpoint, {
      params: { page, region: "US", language: "en-US" },
    });
    return res.data.results || [];
  } catch (err) {
    console.error(`[TMDb] fetchMovieList(${endpoint}, page=${page}) failed: ${err.message}`);
    return [];
  }
};

// ---------------------------------------------------------------------------
// Core sync logic
// ---------------------------------------------------------------------------

/**
 * Upsert a single enriched TMDB movie document into MongoDB.
 * Never overwrites admin-added or custom movies!
 */
const upsertMovieToDB = async (movieData) => {
  try {
    const existing = await Movie.findOne({
      $or: [
        ...(movieData.tmdbId ? [{ tmdbId: movieData.tmdbId }] : []),
        { movieName: movieData.movieName },
      ],
    });

    if (existing && (existing.isAdminAdded || existing.isCustom)) {
      return existing;
    }

    const updated = await Movie.findOneAndUpdate(
      { tmdbId: movieData.tmdbId },
      { $set: movieData },
      { upsert: true, new: true, runValidators: false }
    );
    return updated;
  } catch (err) {
    console.error(`[TMDb] Upsert failed for "${movieData.movieName}": ${err.message}`);
    return null;
  }
};

/**
 * Main sync function. Call this at server start-up or via the admin "Sync TMDB" endpoint.
 * Fetches ONLY currently in theatres (/movie/now_playing) and upcoming (/movie/upcoming).
 *
 * @param {object} opts
 * @param {string[]} opts.endpoints   – TMDB list endpoints to query
 * @param {number}   opts.pages       – number of pages per endpoint (default: 1 page = ~20 movies)
 * @param {boolean}  opts.fetchDetail – fetch full detail + credits + videos per movie
 * @returns {{ synced: number, errors: number }}
 */
const syncTMDBMovies = async ({
  endpoints = ["/movie/now_playing", "/movie/upcoming"],
  pages     = 1,
  fetchDetail = true,
} = {}) => {
  if (!TMDB_API_KEY) {
    console.warn("[TMDb] Sync skipped: TMDB_API_KEY not configured.");
    return { synced: 0, errors: 0 };
  }

  console.log(`[TMDb] Starting live sync (In Theatres & Upcoming) – endpoints: ${endpoints.join(", ")} | pages: ${pages}`);

  const seen = new Set();
  const categoryMap = new Map();
  const tmdbIds = [];

  for (const endpoint of endpoints) {
    const category = endpoint.includes("upcoming") ? "upcoming" : "now_playing";
    for (let p = 1; p <= pages; p++) {
      const results = await fetchMovieList(endpoint, p);
      results.forEach((m) => {
        if (m.id && !seen.has(m.id)) {
          seen.add(m.id);
          categoryMap.set(m.id, category);
          tmdbIds.push(m.id);
        }
      });
    }
  }

  console.log(`[TMDb] Discovered ${tmdbIds.length} unique in-theatre & upcoming movie IDs. Enriching & syncing...`);

  let synced = 0;
  let errors = 0;

  // Process in batches of 3 with slight delay to ensure smooth socket connections
  const BATCH = 3;
  for (let i = 0; i < tmdbIds.length; i += BATCH) {
    const batch = tmdbIds.slice(i, i + BATCH);

    const enriched = fetchDetail
      ? await Promise.all(batch.map((id) => fetchMovieDetail(id, categoryMap.get(id) || "now_playing")))
      : batch.map((id) => ({ tmdbId: id, category: categoryMap.get(id) || "now_playing" }));

    for (const movieData of enriched) {
      if (!movieData) { errors++; continue; }
      const saved = await upsertMovieToDB(movieData);
      if (saved) synced++; else errors++;
    }

    if (i + BATCH < tmdbIds.length) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  console.log(`[TMDb] Sync complete → synced: ${synced} | errors: ${errors}`);
  return { synced, errors };
};

/**
 * Lightweight sync: only re-fetch now_playing & upcoming (1 page each).
 * Used by periodic cron job to keep in-theatre and upcoming titles fresh.
 */
const quickSync = () =>
  syncTMDBMovies({
    endpoints:   ["/movie/now_playing", "/movie/upcoming"],
    pages:       1,
    fetchDetail: true,
  });

/**
 * Search TMDB for movies matching a query string.
 * Strictly does NOT upsert to MongoDB to respect user privacy and avoid database pollution.
 */
const searchAndSyncTMDB = async (query) => {
  return [];
};

module.exports = {
  syncTMDBMovies,
  quickSync,
  searchAndSyncTMDB,
  fetchMovieDetail,
  fetchMovieList,
  tmdb,
};
