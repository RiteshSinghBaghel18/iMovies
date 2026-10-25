const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movieController");
const { fetchAdmin } = require("../middlewares/fetchUser");

// Public routes
router.get("/", movieController.getAllMovies);
router.get("/:movieId", movieController.getMovieById);

// Admin routes
router.post("/", fetchAdmin, movieController.createMovie);
router.put("/:movieId", fetchAdmin, movieController.updateMovie);
router.delete("/:movieId", fetchAdmin, movieController.deleteMovie);

module.exports = router;
