/**
 * TMDB Routes — /api/tmdb
 * Admin-only endpoints for controlling the TMDB live data sync.
 */

const express = require("express");
const router = express.Router();
const { fetchAdmin } = require("../middlewares/fetchUser");
const { syncTMDBMovies, quickSync } = require("../services/tmdbService");
const Movie = require("../models/movieModel");

// ---------------------------------------------------------------------------
// GET /api/tmdb/status
// Returns the current TMDB integration status (total movies, key configured).
// ---------------------------------------------------------------------------
router.get("/status", async (req, res) => {
  try {
    const total = await Movie.countDocuments();
    const tmdbSynced = await Movie.countDocuments({ tmdbId: { $exists: true } });

    res.json({
      success: true,
      status: {
        keyConfigured: !!process.env.TMDB_API_KEY,
        totalMoviesInDB: total,
        tmdbSyncedMovies: tmdbSynced,
        manuallyAddedMovies: total - tmdbSynced,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/tmdb/sync
// Admin: Trigger a full TMDB sync (now_playing + popular + top_rated, 2 pages each).
// Body: { endpoints?: string[], pages?: number }
// ---------------------------------------------------------------------------
router.post("/sync", fetchAdmin, async (req, res) => {
  try {
    const { endpoints, pages } = req.body;

    // Return immediately with 202 Accepted; sync runs in background
    res.status(202).json({
      success: true,
      message: "TMDB full sync started in the background. Check /api/tmdb/status for updates.",
    });

    // Run actual sync after response is sent
    syncTMDBMovies({
      endpoints: endpoints || ["/movie/now_playing", "/movie/popular", "/movie/top_rated"],
      pages: pages || 2,
      fetchDetail: true,
    }).then(({ synced, errors }) => {
      console.log(`[TMDb] Admin-triggered sync complete → synced: ${synced} | errors: ${errors}`);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/tmdb/quick-sync
// Admin: Quick sync (now_playing only, 1 page).
// ---------------------------------------------------------------------------
router.post("/quick-sync", fetchAdmin, async (req, res) => {
  try {
    res.status(202).json({
      success: true,
      message: "Quick TMDB sync started (now_playing + popular, 1 page each).",
    });

    quickSync().then(({ synced, errors }) => {
      console.log(`[TMDb] Quick sync done → synced: ${synced} | errors: ${errors}`);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
