const router = require('express').Router();
const {
  lockSeats,
  createBooking,
  getUserBookings,
  cancelBooking,
  getAllBookings
} = require('../controllers/bookingController');
const fetchUser = require('../middlewares/fetchUser');

// All booking routes require authentication
router.post('/lock', fetchUser, lockSeats);
router.post('/create', fetchUser, createBooking);
router.get('/user', fetchUser, getUserBookings);
router.post('/cancel', fetchUser, cancelBooking);
router.delete('/cancel/:bookingId', fetchUser, cancelBooking);
router.get('/all', fetchUser, getAllBookings);

module.exports = router;
