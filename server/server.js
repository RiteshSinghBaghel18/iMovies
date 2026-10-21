const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration: dynamically allow Vercel production frontends, localhost, and custom domains
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or any client origin
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'auth-token', 'X-Requested-With', 'Accept', 'Origin']
};

const io = new Server(server, { cors: corsOptions });

// Export io early to avoid circular dependency issues when required in controllers
module.exports = { io, app, server };

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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

// Connect DB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    require('./utils/cleanupService');
    require('./utils/reminderService');
    // Seed sample data for dev/demo
    if (process.env.NODE_ENV !== 'production') {
      try { await require('./seed')(); } catch(e) { /* seed errors are non-fatal */ }
    }
    server.listen(process.env.PORT || 5000, () => {
      console.log(`iMovies server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));
