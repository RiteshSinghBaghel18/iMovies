/**
 * seed.js — Populates iMovies DB with live movie market data from TMDB API
 * Replaces hardcoded mock data with real movies currently playing in theatres with genuine trailers.
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('./models/userModel');
const Admin = require('./models/adminModel');
const Movie = require('./models/movieModel');
const Theatre = require('./models/theatreModel');
const Show = require('./models/showModel');
const tmdbService = require('./services/tmdbService');
const { ensureShowsForMovie } = require('./utils/showGenerator');

const seedData = async () => {
  try {
    console.log('[Seed] Initializing iMovies database with live TMDB market data and original trailers...');

    const salt = await bcrypt.genSalt(10);

    // --- Users ---
    const userHashedPassword = await bcrypt.hash('user1234', salt);
    const existingUser = await User.findOne({ email: 'user@imovies.com' });
    if (!existingUser) {
      await User.create({
        username: 'CinemaBuff',
        email: 'user@imovies.com',
        password: userHashedPassword,
        isVerified: true
      });
      console.log('  👤 Test User created: user@imovies.com / user1234 (Verified)');
    } else {
      existingUser.password = userHashedPassword;
      existingUser.isVerified = true;
      await existingUser.save();
      console.log('  👤 Test User verified & synced: user@imovies.com / user1234');
    }

    // --- Admins ---
    const adminHashedPassword = await bcrypt.hash('admin1234', salt);
    const existingAdmin = await Admin.findOne({ email: 'admin@imovies.com' });
    if (!existingAdmin) {
      await Admin.create({
        username: 'superadmin',
        email: 'admin@imovies.com',
        password: adminHashedPassword
      });
      console.log('  🔐 Test Admin created: admin@imovies.com / admin1234');
    } else {
      existingAdmin.password = adminHashedPassword;
      await existingAdmin.save();
      console.log('  🔐 Test Admin synced: admin@imovies.com / admin1234');
    }

    // --- Theatres (Country-based) ---
    const existingTheatresCount = await Theatre.countDocuments();
    if (existingTheatresCount === 0) {
      await Theatre.create([
        {
          theatreName: 'iMovies Grand Cineplex',
          theatreId: uuidv4(),
          location: 'India',
          adminEmail: 'admin@imovies.com',
          balconySeatPrice: 350,
          middleSeatPrice: 250,
          lowerSeatPrice: 150,
          balconySeats: { rows: 3, cols: 10 },
          middleSeats: { rows: 5, cols: 12 },
          lowerSeats: { rows: 3, cols: 10 }
        },
        {
          theatreName: 'iMovies Dolby Cinema',
          theatreId: uuidv4(),
          location: 'United States',
          adminEmail: 'admin@imovies.com',
          balconySeatPrice: 500,
          middleSeatPrice: 350,
          lowerSeatPrice: 200,
          balconySeats: { rows: 4, cols: 10 },
          middleSeats: { rows: 6, cols: 12 },
          lowerSeats: { rows: 4, cols: 10 }
        },
        {
          theatreName: 'iMovies Odeon Luxe',
          theatreId: uuidv4(),
          location: 'United Kingdom',
          adminEmail: 'admin@imovies.com',
          balconySeatPrice: 600,
          middleSeatPrice: 400,
          lowerSeatPrice: 250,
          balconySeats: { rows: 3, cols: 8 },
          middleSeats: { rows: 5, cols: 10 },
          lowerSeats: { rows: 3, cols: 8 }
        }
      ]);
      console.log('  🏟️  Default Theatres created for India, United States, United Kingdom');
    } else {
      // Update any legacy city locations to country-based
      await Theatre.updateMany(
        { location: { $regex: /Mumbai|Delhi|Bangalore|Indore/i } },
        { $set: { location: 'India' } }
      );
      await Theatre.updateMany(
        { location: { $regex: /Chicago|New York|Los Angeles/i } },
        { $set: { location: 'United States' } }
      );
    }

    // --- Remove old legacy mock movies and fake rickroll trailer entries ---
    const deletedLegacy = await Movie.deleteMany({
      $or: [
        { tmdbId: { $exists: false } },
        { tmdbId: null },
        {
          movieName: {
            $in: [
              'Galactic Storm',
              'Midnight Shadows',
              'Laughing Paradise',
              'Eternal Hearts',
              'Shadow Protocol',
              "Dragon's Peak"
            ]
          }
        },
        { trailerUrl: { $regex: /dQw4w9WgXcQ/ } }
      ]
    });
    if (deletedLegacy.deletedCount > 0) {
      console.log(`  🗑️  Purged ${deletedLegacy.deletedCount} seeded/mock/fake-trailer movies from DB.`);
    }

    // --- Fetch and Seed Live TMDB Movies across categories with original trailers ---
    let liveMovies = [];
    try {
      console.log('[Seed] Syncing fresh TMDB categories (Now Playing, Popular, Top Rated, Upcoming)...');
      const nowPlaying = await tmdbService.syncNowPlayingMovies(12);
      const popular = await tmdbService.syncPopularMovies(12);
      const topRated = await tmdbService.syncTopRatedMovies(10);
      const upcoming = await tmdbService.syncUpcomingMovies(10);
      liveMovies = [...nowPlaying, ...popular, ...topRated, ...upcoming];
      console.log(`[Seed] Successfully fetched ${liveMovies.length} live market movies from TMDB with original trailers!`);
    } catch (tmdbErr) {
      console.warn('[Seed] Warning fetching from TMDB:', tmdbErr.message);
    }

    if (liveMovies.length === 0) {
      liveMovies = await Movie.find();
    }

    // --- Ensure Shows for Live Movies ---
    console.log('[Seed] Generating show schedules for live movies in theatres...');
    let totalShowsCount = 0;
    for (const movie of liveMovies.slice(0, 15)) {
      const shows = await ensureShowsForMovie(movie, 4);
      totalShowsCount += shows.length;
    }

    const defaultTheatre = await Theatre.findOne();
    console.log(`[Seed] ✅ Seed completed successfully:`);
    console.log(`  👤 Test User: user@imovies.com / user1234`);
    console.log(`  🔐 Test Admin: admin@imovies.com / admin1234`);
    console.log(`  🎬 Live TMDB Movies: ${liveMovies.length}`);
    console.log(`  🏟️  Theatres: Active (${defaultTheatre?.theatreName || 'Multiple Country Theatres'})`);
    console.log(`  🎭 Active Shows: ${totalShowsCount}`);

  } catch (err) {
    if (err.code === 11000) {
      console.log('[Seed] Some documents already exist, skipping duplicates.');
    } else {
      console.error('[Seed] Error during seeding:', err.message);
    }
  }
};

module.exports = seedData;
