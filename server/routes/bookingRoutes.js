const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { fetchUser, fetchAdmin } = require("../middlewares/fetchUser");

// Seat locking & unlocking
router.post("/lock", fetchUser, bookingController.lockSeats);
router.post("/unlock", fetchUser, bookingController.unlockSeats);

// Payment & Confirmation
router.post("/confirm", fetchUser, bookingController.confirmBooking);

// User Booking History & Details
router.get("/my-bookings", fetchUser, bookingController.getMyBookings);
router.get("/:bookingId", fetchUser, bookingController.getBookingById);
router.post("/cancel/:bookingId", fetchUser, bookingController.cancelBooking);

// Admin Moderation
router.get("/admin/all", fetchAdmin, bookingController.getAllBookings);

module.exports = router;
