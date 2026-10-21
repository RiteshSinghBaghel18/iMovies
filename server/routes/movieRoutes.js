const router = require('express').Router();
const {
  getAllMovies,
  getMovieSections,
  getMovieById,
  getMarketNowPlaying,
  getMarketPopular,
  getMarketUpcoming,
  searchMarketMovies,
  syncTmdbMovies,
  addMovie,
  updateMovie,
  deleteMovie
} = require('../controllers/movieController');
const fetchUser = require('../middlewares/fetchUser');

// Live TMDB Market routes
router.get('/market/now-playing', getMarketNowPlaying);
router.get('/market/popular', getMarketPopular);
router.get('/market/upcoming', getMarketUpcoming);
router.get('/market/search', searchMarketMovies);

// General movie routes
router.get('/sections', getMovieSections);
router.get('/', getAllMovies);
router.get('/:id', getMovieById);

// Protected routes (Admin / authenticated)
router.post('/sync-tmdb', fetchUser, syncTmdbMovies);
router.post('/add', fetchUser, addMovie);
router.put('/update/:id', fetchUser, updateMovie);
router.put('/:id', fetchUser, updateMovie);
router.delete('/delete/:id', fetchUser, deleteMovie);
router.delete('/:id', fetchUser, deleteMovie);

module.exports = router;
