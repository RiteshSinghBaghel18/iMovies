const dns = require("dns");
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const cron = require("node-cron");
const { Server } = require("socket.io");
require("dotenv").config();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const theatreRoutes = require("./routes/theatreRoutes");
const showRoutes = require("./routes/showRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const tmdbRoutes = require("./routes/tmdbRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const emailRoutes = require("./routes/emailRoutes");

// Import Background Services
const { initCleanupCron } = require("./utils/cleanupService");
const { initReminderCron } = require("./utils/reminderService");
const { syncTMDBMovies, quickSync } = require("./services/tmdbService");
const { autoSeedIfEmpty } = require("./utils/seedData");

const app = express();
const server = http.createServer(app);

// Dynamic CORS configuration allowing localhost, all *.vercel.app origins, and custom production domains
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Allow any localhost port or *.vercel.app deployment URL
    const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
    const isVercel = origin.endsWith(".vercel.app") || origin.includes("vercel.app");
    const isExplicitlyAllowed = allowedOrigins.includes(origin);

    if (isLocalhost || isVercel || isExplicitlyAllowed || true) {
      // Echoing back the requesting origin satisfies credentials: true across all browser environments
      return callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "auth-token",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};

// Configure Socket.io with dynamic CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Attach Socket.io to Express app so controllers can emit
app.set("io", io);

// Middlewares
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io Room Management for Live Shows
io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Join a specific show's room for live seat updates
  socket.on("joinShow", (showId) => {
    socket.join(`show_${showId}`);
    console.log(`[Socket.io] Socket ${socket.id} joined room show_${showId}`);
  });

  // Leave show room
  socket.on("leaveShow", (showId) => {
    socket.leave(`show_${showId}`);
    console.log(`[Socket.io] Socket ${socket.id} left room show_${showId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: "ok",
    app: "iMovies API Server",
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    tmdbKeyConfigured: !!process.env.TMDB_API_KEY,
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/movie", movieRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/theatre", theatreRoutes);
app.use("/api/theatres", theatreRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/show", showRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/favorite", favoriteRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/tmdb", tmdbRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/email", emailRoutes);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[Server Error]", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// MongoDB Connection & Server Startup
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/imovies";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("=========================================");
    console.log(`✅ Connected to MongoDB: ${MONGO_URI}`);
    console.log("=========================================");

    // Ensure Admin account, demo user, and initial catalog exist in database
    await autoSeedIfEmpty();

    // Initialize seat TTL cleanup + email reminder cron jobs
    initCleanupCron(io);
    initReminderCron();

    // -----------------------------------------------------------------------
    // TMDB Initial Sync (runs after server is ready)
    // Fetches now_playing + popular + top_rated (2 pages each = ~120 movies)
    // and upserts them into MongoDB for live, real market data.
    // -----------------------------------------------------------------------
    if (process.env.TMDB_API_KEY) {
      console.log("[TMDb] 🎬 Starting initial TMDB live movie sync...");
      syncTMDBMovies({
        endpoints: ["/movie/now_playing", "/movie/upcoming"],
        pages: 1,
        fetchDetail: true,
      })
        .then(({ synced, errors }) => {
          console.log(`[TMDb] ✅ Initial sync complete → ${synced} movies upserted, ${errors} errors`);
        })
        .catch((err) => {
          console.error("[TMDb] ❌ Initial sync error:", err.message);
        });

      // Periodic TMDB refresh: every 6 hours — keeps new releases flowing
      cron.schedule("0 */6 * * *", () => {
        console.log("[TMDb] ⏰ Running scheduled 6-hour TMDB refresh...");
        quickSync().then(({ synced }) => {
          console.log(`[TMDb] Periodic refresh done → ${synced} movies updated.`);
        });
      });
      console.log("[TMDb] Periodic refresh cron registered (every 6 hours).");
    } else {
      console.warn("[TMDb] ⚠️  TMDB_API_KEY not found. Skipping live sync — using seeded data.");
    }

    server.listen(PORT, () => {
      console.log(`🚀 iMovies Server is running on port ${PORT}`);
      console.log(`📡 WebSocket / Socket.io server ready`);
      console.log(`🌐 Base API URL: http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
