const router = require('express').Router();
const {
  getAllTheatres,
  getTheatreById,
  addTheatre,
  updateTheatre,
  deleteTheatre
} = require('../controllers/theatreController');
const fetchUser = require('../middlewares/fetchUser');

// Public/authenticated theatre routes
router.get('/', getAllTheatres);
router.get('/:theatreId', getTheatreById);

// Protected routes
router.post('/add', fetchUser, addTheatre);
router.put('/update/:theatreId', fetchUser, updateTheatre);
router.put('/:theatreId', fetchUser, updateTheatre);
router.delete('/delete/:theatreId', fetchUser, deleteTheatre);
router.delete('/:theatreId', fetchUser, deleteTheatre);

module.exports = router;
