const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { fetchUser } = require("../middlewares/fetchUser");

// Public: view movie reviews
router.get("/movie/:movieId", reviewController.getMovieReviews);

// Protected: submit & delete
router.post("/", fetchUser, reviewController.createReview);
router.delete("/:reviewId", fetchUser, reviewController.deleteReview);

module.exports = router;
