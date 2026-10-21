const router = require('express').Router();
const {
  addReview,
  getReviewsByMovieId,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const fetchUser = require('../middlewares/fetchUser');

// Public route to view movie reviews
router.get('/movie/:movieId', getReviewsByMovieId);

// Authenticated routes to manage reviews
router.post('/add', fetchUser, addReview);
router.put('/update/:id', fetchUser, updateReview);
router.put('/:id', fetchUser, updateReview);
router.delete('/delete/:id', fetchUser, deleteReview);
router.delete('/:id', fetchUser, deleteReview);

module.exports = router;
