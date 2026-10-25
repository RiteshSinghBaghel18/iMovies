const Review = require("../models/reviewModel");
const Movie = require("../models/movieModel");

// GET REVIEWS FOR A MOVIE
exports.getMovieReviews = async (req, res) => {
  try {
    const { movieId } = req.params;
    const reviews = await Review.find({ movieId }).sort({ createdAt: -1 });

    const totalRatings = reviews.length;
    const avgRating =
      totalRatings > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalRatings).toFixed(1)
        : null;

    res.json({
      success: true,
      totalRatings,
      avgRating: avgRating ? Number(avgRating) : 8.5,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// SUBMIT REVIEW
exports.createReview = async (req, res) => {
  try {
    const { movieId, rating, reviewText } = req.body;
    const userEmail = req.user.email;
    const username = req.user.username || userEmail.split("@")[0];

    if (!movieId || !rating || !reviewText) {
      return res.status(400).json({ success: false, message: "Please provide movieId, rating, and reviewText." });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found." });
    }

    const review = await Review.create({
      userEmail,
      username,
      movieId,
      rating: Number(rating),
      reviewText,
    });

    // Update movie average rating
    const allReviews = await Review.find({ movieId });
    const newAvg = (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1);
    movie.rating = Number(newAvg);
    movie.voteCount = allReviews.length;
    await movie.save();

    res.status(201).json({
      success: true,
      message: "Review submitted successfully!",
      review,
      updatedMovieRating: movie.rating,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE REVIEW
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    // Owner or admin check
    if (review.userEmail !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this review." });
    }

    await Review.findByIdAndDelete(reviewId);
    res.json({ success: true, message: "Review deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
