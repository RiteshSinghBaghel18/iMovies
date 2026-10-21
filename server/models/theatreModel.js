const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema({
  theatreName: { type: String, required: true },
  theatreId: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  adminEmail: { type: String, required: true },
  balconySeatPrice: { type: Number, required: true, default: 250 },
  middleSeatPrice: { type: Number, required: true, default: 180 },
  lowerSeatPrice: { type: Number, required: true, default: 120 },
  balconySeats: {
    rows: { type: Number, required: true, default: 3 },
    cols: { type: Number, required: true, default: 10 }
  },
  middleSeats: {
    rows: { type: Number, required: true, default: 5 },
    cols: { type: Number, required: true, default: 12 }
  },
  lowerSeats: {
    rows: { type: Number, required: true, default: 4 },
    cols: { type: Number, required: true, default: 10 }
  },
  balconyRows: { type: Number, default: 3 },
  balconyCols: { type: Number, default: 10 },
  middleRows: { type: Number, default: 5 },
  middleCols: { type: Number, default: 12 },
  lowerRows: { type: Number, default: 4 },
  lowerCols: { type: Number, default: 10 },
  totalSeats: { type: Number, default: 130 }
}, { timestamps: true });

module.exports = mongoose.model('Theatre', theatreSchema);
