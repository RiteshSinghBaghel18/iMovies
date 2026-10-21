const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true },
  showId: { type: String, required: true },
  movieId: { type: String, required: true },
  movieName: { type: String, default: 'Movie' },
  theatreName: { type: String, required: true },
  showDate: { type: String, required: true },
  showTime: { type: String, required: true },
  ticketsData: { type: Object, required: true },
  selectedSeats: { type: [String], default: [] },
  totalAmount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded', 'Cancelled'],
    default: 'Pending'
  },
  paymentMethod: { type: String, default: 'Razorpay' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  refundId: { type: String },
  refundAmount: { type: Number, default: 0 },
  refundStatus: { type: String },
  refundedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
