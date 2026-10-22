const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
  adminEmail: { type: String, required: true },
  showId: { type: String, required: true, unique: true },
  movieId: { type: String, required: true },
  theatreId: { type: String, required: true },
  theatreName: { type: String, required: true },
  location: { type: String, default: 'City Centre' },
  movieName: { type: String, default: '' },
  showDate: { type: String, required: true },
  showTime: { type: String, required: true },
  ticketPrice: { type: Number, default: 250 },
  balconyPrice: { type: Number, default: 350 },
  middlePrice: { type: Number, default: 250 },
  lowerPrice: { type: Number, default: 150 },
  tickets: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Show', showSchema);
