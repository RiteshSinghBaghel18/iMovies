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
 * Ensure shows exist for a given movie over the next N days
 */
const ensureShowsForMovie = async (movieDoc, days = 4) => {
  if (!movieDoc) return [];

  const movieIdStr = (movieDoc._id || movieDoc.id || movieDoc).toString();
  const existingShows = await Show.find({ movieId: movieIdStr });
  if (existingShows.length > 0) {
    return existingShows;
  }

  // Find or create default theatre
  let theatre = await Theatre.findOne();
  if (!theatre) {
    theatre = await Theatre.create({
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
    });
  }

  const showTimes = ['10:30', '14:15', '18:00', '21:30'];
  const showsToInsert = [];
  const today = new Date();

  for (let d = 0; d < days; d++) {
    const showDateObj = new Date(today);
    showDateObj.setDate(today.getDate() + d);
    const dateStr = showDateObj.toISOString().split('T')[0];

    for (const time of showTimes) {
      const tickets = generateTicketsForTheatre(theatre);
      showsToInsert.push({
        adminEmail: theatre.adminEmail || 'admin@imovies.com',
        showId: uuidv4(),
        movieId: movieIdStr,
        theatreId: theatre.theatreId,
        theatreName: theatre.theatreName,
        showDate: dateStr,
        showTime: time,
        tickets
      });
    }
  }

  const createdShows = await Show.insertMany(showsToInsert);
  return createdShows;
};

module.exports = {
  generateTicketsForTheatre,
  ensureShowsForMovie
};
