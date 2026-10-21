const router = require('express').Router();
const {
  getAllShows,
  getShowsByMovieId,
  getShowById,
  addShow,
  updateShow,
  deleteShow
} = require('../controllers/showController');
const fetchUser = require('../middlewares/fetchUser');

router.get('/', getAllShows);
router.get('/movie/:movieId', getShowsByMovieId);
router.get('/:showId', getShowById);

router.post('/add', fetchUser, addShow);
router.put('/update/:showId', fetchUser, updateShow);
router.put('/:showId', fetchUser, updateShow);
router.delete('/delete/:showId', fetchUser, deleteShow);
router.delete('/:showId', fetchUser, deleteShow);

module.exports = router;
