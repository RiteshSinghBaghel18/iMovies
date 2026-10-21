const router = require('express').Router();
const {
  toggleFavorite,
  addFavorite,
  removeFavorite,
  getUserFavorites
} = require('../controllers/favoriteController');
const fetchUser = require('../middlewares/fetchUser');

// All favorite routes require authentication
router.get('/', fetchUser, getUserFavorites);
router.get('/user', fetchUser, getUserFavorites);
router.post('/toggle', fetchUser, toggleFavorite);
router.post('/add', fetchUser, addFavorite);
router.post('/remove', fetchUser, removeFavorite);
router.delete('/remove/:movieId', fetchUser, removeFavorite);

module.exports = router;
