const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Comprehensive CORS configuration: dynamically allow any frontend origin (Vercel, localhost, custom domains)
const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  exposedHeaders: ['auth-token']
};

const io = new Server(server, { cors: corsOptions });

// Export io early to avoid circular dependency issues when required in controllers
module.exports = { io, app, server };

app.use(cors(corsOptions));

// Universal preflight & CORS header middleware for rock-solid cross-origin handling
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD');
  res.header(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || 'Origin, X-Requested-With, Content-Type, Accept, Authorization, auth-token, Cache-Control, Pragma'
  );
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/movie', require('./routes/movieRoutes'));
app.use('/api/theatre', require('./routes/theatreRoutes'));
app.use('/api/shows', require('./routes/showRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/favorite', require('./routes/favoriteRoutes'));
app.use('/api/review', require('./routes/reviewRoutes'));
app.use('/api/email', require('./routes/emailRoutes'));

// Health check endpoint for Render / cloud monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting'
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Robust database connection with in-memory fallback and auto-seed
async function startServer() {
  let mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn('[Server] MONGO_URI not provided. Starting in-memory MongoDB fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      console.log(`[Server] In-memory MongoDB running at: ${mongoUri}`);
    } catch (e) {
      console.error('[Server] Failed to create in-memory MongoDB:', e.message);
      mongoUri = 'mongodb://127.0.0.1:27017/imovies';
    }
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    require('./utils/cleanupService');
    require('./utils/reminderService');

    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`iMovies server running on port ${port}`);
    });

    // Auto-seed default user, admin, theatres, and TMDB movies in the background
    // (Non-blocking so server binds port immediately on cold start)
    require('./seed')().catch((e) => {
      console.warn('[Seed] Warning during database seed:', e.message);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    try {
      console.log('[Server] Attempting fallback to in-memory MongoDB...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log('MongoDB in-memory connected successfully');
      require('./utils/cleanupService');
      require('./utils/reminderService');

      const port = process.env.PORT || 5000;
      server.listen(port, () => {
        console.log(`iMovies server running on port ${port} (In-Memory Fallback)`);
      });

      require('./seed')().catch((e) => {
        console.warn('[Seed] Warning during fallback seed:', e.message);
      });
    } catch (fallbackErr) {
      console.error('[Server] Fatal MongoDB startup error:', fallbackErr.message);
      const port = process.env.PORT || 5000;
      server.listen(port, () => {
        console.log(`iMovies server listening on port ${port} (Database offline)`);
      });
    }
  }
}

startServer();
