const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Show = require('../models/showModel');
const Theatre = require('../models/theatreModel');

/**
 * Generate seat map tickets object based on theatre configuration
 */
const generateTicketsForTheatre = (theatre) => {
  const tickets = {};
  const tiers = [
    {
      key: 'balcony',
      prefix: 'B',
      rows: Number(theatre?.balconySeats?.rows ?? theatre?.balconyRows) || 3,
      cols: Number(theatre?.balconySeats?.cols ?? theatre?.balconyCols) || 10,
      price: Number(theatre?.balconySeatPrice) || 350
    },
    {
      key: 'middle',
      prefix: 'M',
      rows: Number(theatre?.middleSeats?.rows ?? theatre?.middleRows) || 5,
      cols: Number(theatre?.middleSeats?.cols ?? theatre?.middleCols) || 12,
      price: Number(theatre?.middleSeatPrice) || 250
    },
    {
      key: 'lower',
      prefix: 'L',
      rows: Number(theatre?.lowerSeats?.rows ?? theatre?.lowerRows) || 4,
      cols: Number(theatre?.lowerSeats?.cols ?? theatre?.lowerCols) || 10,
      price: Number(theatre?.lowerSeatPrice) || 150
    }
  ];

  tiers.forEach(({ key, prefix, rows, cols, price }) => {
    for (let r = 0; r < rows; r++) {
      const rowLetter = String.fromCharCode(65 + r);
      for (let c = 1; c <= cols; c++) {
        const seatId = `${prefix}-${rowLetter}${c}`;
        tickets[seatId] = {
          seatId,
          tier: key,
          price,
          status: 'available',
          lockedBy: null,
          lockedAt: null
        };
      }
    }
  });

  return tickets;
};

/**
 * Ensure default theatres exist in the system so all available theatres
 * can be shown at the time of booking.
 */
const ensureTheatresExist = async () => {
  let theatres = await Theatre.find();
  if (theatres.length >= 3) {
    // Ensure all theatres have a valid theatreId
    for (const t of theatres) {
      if (!t.theatreId) {
        t.theatreId = uuidv4();
        await t.save();
      }
    }
    return theatres;
  }

  const defaultTheatres = [
    {
      theatreName: 'iMovies Grand Cineplex',
      theatreId: uuidv4(),
      location: 'Downtown Central Plaza, Screen 1 (4K Dolby Atmos)',
      adminEmail: 'admin@imovies.com',
      balconySeatPrice: 380,
      middleSeatPrice: 260,
      lowerSeatPrice: 160,
      balconySeats: { rows: 3, cols: 10 },
      middleSeats: { rows: 5, cols: 12 },
      lowerSeats: { rows: 3, cols: 10 }
    },
    {
      theatreName: 'PVR Director’s Cut IMAX',
      theatreId: uuidv4(),
      location: 'Ambience Mall, Vasant Kunj (IMAX with Laser)',
      adminEmail: 'admin@imovies.com',
      balconySeatPrice: 450,
      middleSeatPrice: 320,
      lowerSeatPrice: 200,
      balconySeats: { rows: 3, cols: 12 },
      middleSeats: { rows: 5, cols: 14 },
      lowerSeats: { rows: 3, cols: 12 }
    },
    {
      theatreName: 'INOX Megaplex Dolby Cinema',
      theatreId: uuidv4(),
      location: 'South City Mall, Level 4 (Dolby Vision & Atmos)',
      adminEmail: 'admin@imovies.com',
      balconySeatPrice: 350,
      middleSeatPrice: 240,
      lowerSeatPrice: 150,
      balconySeats: { rows: 3, cols: 10 },
      middleSeats: { rows: 4, cols: 12 },
      lowerSeats: { rows: 3, cols: 10 }
    },
    {
      theatreName: 'Cinepolis VIP Luxury Lounge',
      theatreId: uuidv4(),
      location: 'Cyber Promenade, Sector 29 (Plush Recliners)',
      adminEmail: 'admin@imovies.com',
      balconySeatPrice: 420,
      middleSeatPrice: 300,
      lowerSeatPrice: 180,
      balconySeats: { rows: 2, cols: 8 },
      middleSeats: { rows: 4, cols: 10 },
      lowerSeats: { rows: 2, cols: 8 }
    }
  ];

  for (const tData of defaultTheatres) {
    const existing = await Theatre.findOne({ theatreName: tData.theatreName });
    if (!existing) {
      await Theatre.create(tData);
    }
  }

  return Theatre.find();
};

/**
 * Ensure shows exist for a given movie across partner theatres for the next N days.
 * @param {Object} movieDoc - Movie Mongoose document or object
 * @param {number} days - Number of days to generate shows for (default 7)
 * @param {Array<string>} specificTheatreIds - Optional list of specific theatre IDs or Mongo ObjectIds to target
 * @param {Array<string>} customTimes - Optional array of custom show times
 */
const ensureShowsForMovie = async (movieDoc, days = 7, specificTheatreIds = null, customTimes = null) => {
  if (!movieDoc) return [];

  const movieIdStr = (movieDoc._id || movieDoc.id || movieDoc).toString();
  const movieNameStr = movieDoc.movieName || 'Featured Movie';

  // Retrieve available theatres
  let theatres = await ensureTheatresExist();

  // If specific theatres were selected, filter down to those theatres
  if (Array.isArray(specificTheatreIds) && specificTheatreIds.length > 0) {
    theatres = theatres.filter(t => {
      const matchId = String(t.theatreId);
      const matchMongoId = String(t._id);
      return specificTheatreIds.some(target => target === matchId || target === matchMongoId);
    });
  }

  // If filtering resulted in 0 theatres (e.g. invalid target), fallback to all theatres
  if (theatres.length === 0) {
    theatres = await ensureTheatresExist();
  }

  const showTimes = Array.isArray(customTimes) && customTimes.length > 0
    ? customTimes
    : ['10:30 AM', '01:00 PM', '04:15 PM', '07:30 PM', '10:15 PM'];

  // Generate date strings using local year, month, date to prevent UTC day-lag
  const today = new Date();
  const dates = [];
  for (let d = 0; d < days; d++) {
    const showDateObj = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d);
    const y = showDateObj.getFullYear();
    const m = String(showDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(showDateObj.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }

  // Check which shows currently exist for this movie for these dates
  const existingShows = await Show.find({
    movieId: movieIdStr,
    showDate: { $in: dates }
  });

  const existingSet = new Set(
    existingShows.map((s) => `${s.theatreId}_${s.showDate}_${s.showTime}`)
  );

  const showsToInsert = [];

  for (const theatre of theatres) {
    const tId = String(theatre.theatreId || theatre._id);
    for (const dateStr of dates) {
      for (const time of showTimes) {
        const key = `${tId}_${dateStr}_${time}`;
        if (!existingSet.has(key)) {
          const tickets = generateTicketsForTheatre(theatre);
          showsToInsert.push({
            adminEmail: theatre.adminEmail || 'admin@imovies.com',
            showId: uuidv4(),
            movieId: movieIdStr,
            movieName: movieNameStr,
            theatreId: tId,
            theatreName: theatre.theatreName,
            location: theatre.location || 'City Centre',
            showDate: dateStr,
            showTime: time,
            ticketPrice: theatre.middleSeatPrice || 250,
            balconyPrice: theatre.balconySeatPrice || 350,
            middlePrice: theatre.middleSeatPrice || 250,
            lowerPrice: theatre.lowerSeatPrice || 150,
            tickets
          });
        }
      }
    }
  }

  if (showsToInsert.length > 0) {
    try {
      await Show.insertMany(showsToInsert, { ordered: false });
    } catch (insertErr) {
      console.warn('[showGenerator] Notice during batch show insert:', insertErr.message);
    }
  }

  return Show.find({ movieId: movieIdStr, showDate: { $in: dates } }).sort({ showDate: 1, showTime: 1 });
};

module.exports = {
  generateTicketsForTheatre,
  ensureTheatresExist,
  ensureShowsForMovie
};
