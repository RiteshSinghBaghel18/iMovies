const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: [true, "Booking ID is required"],
      unique: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: [true, "User email is required"],
      trim: true,
      lowercase: true,
    },
    showId: {
      type: String,
      required: [true, "Show ID is required"],
      ref: "Show",
    },
    ticketsData: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Tickets data is required"],
    },
    selectedSeats: {
      type: [String],
      default: [],
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Cancelled", "Refunded"],
      default: "Completed",
    },
    paymentMethod: {
      type: String,
      default: "Razorpay",
    },
    transactionId: {
      type: String,
      default: () => "TXN-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
    },
    // Razorpay Gateway fields
    razorpayOrderId: {
      type: String,
      trim: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      index: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
    },
    // Refund tracking
    refundId: {
      type: String,
      trim: true,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundStatus: {
      type: String,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    movieDetails: {
      movieId: String,
      movieName: String,
      posterUrl: String,
      duration: String,
      language: String,
    },
    theatreDetails: {
      theatreName: String,
      location: String,
    },
    showDate: String,
    showTime: String,
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ userEmail: 1, createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);
