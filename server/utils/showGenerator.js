const { v4: uuidv4 } = require('uuid');
const Show = require('../models/showModel');
const Theatre = require('../models/theatreModel');

/**
 * Generate seat map tickets object based on theatre configuration
 */
const generateTicketsForTheatre = (theatre) => {
  const tickets = {};
  const tiers = [
    { key: 'balcony', prefix: 'B', rows: theatre.balconySeats?.rows || 3, cols: theatre.balconySeats?.cols || 10, price: theatre.balconySeatPrice || 350 },
    { key: 'middle', prefix: 'M', rows: theatre.middleSeats?.rows || 5, cols: theatre.middleSeats?.cols || 12, price: theatre.middleSeatPrice || 250 },
    { key: 'lower', prefix: 'L', rows: theatre.lowerSeats?.rows || 3, cols: theatre.lowerSeats?.cols || 10, price: theatre.lowerSeatPrice || 150 }
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
 * Ensure shows exist for a given movie across all available theatres
 * for the next N days.
 */
const ensureShowsForMovie = async (movieDoc, days = 7) => {
  if (!movieDoc) return [];

  const movieIdStr = (movieDoc._id || movieDoc.id || movieDoc).toString();
  const movieNameStr = movieDoc.movieName || 'Featured Movie';

  // Make sure we have our suite of theatres available
  const theatres = await ensureTheatresExist();
  const showTimes = ['10:30 AM', '01:00 PM', '04:15 PM', '07:30 PM', '10:15 PM'];

  const today = new Date();
  const dates = [];
  for (let d = 0; d < days; d++) {
    const showDateObj = new Date(today);
    showDateObj.setDate(today.getDate() + d);
    const dateStr = showDateObj.toISOString().split('T')[0];
    dates.push(dateStr);
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
    for (const dateStr of dates) {
      for (const time of showTimes) {
        const key = `${theatre.theatreId}_${dateStr}_${time}`;
        if (!existingSet.has(key)) {
          const tickets = generateTicketsForTheatre(theatre);
          showsToInsert.push({
            adminEmail: theatre.adminEmail || 'admin@imovies.com',
            showId: uuidv4(),
            movieId: movieIdStr,
            movieName: movieNameStr,
            theatreId: theatre.theatreId,
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
      // non-fatal if duplicate keys
      console.warn('[showGenerator] Minor duplicate notices while inserting shows:', insertErr.message);
    }
  }

  return Show.find({ movieId: movieIdStr, showDate: { $in: dates } }).sort({ showDate: 1, showTime: 1 });
};

module.exports = {
  generateTicketsForTheatre,
  ensureTheatresExist,
  ensureShowsForMovie
};
