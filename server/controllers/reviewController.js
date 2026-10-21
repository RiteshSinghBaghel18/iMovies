const Review = require('../models/reviewModel');

// Add a new review
const addReview = async (req, res) => {
  try {
    const { movieId, rating, reviewText } = req.body;
    const userEmail = req.user?.email || req.body.userEmail;

    if (!movieId || !rating || !reviewText) {
      return res.status(400).json({
        success: false,
        message: 'movieId, rating, and reviewText are required'
      });
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'userEmail is required'
      });
    }

    const review = await Review.create({
      userEmail,
      movieId,
      rating: Number(rating),
      reviewText
    });

    return res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review,
      review
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error adding review'
    });
  }
};

// Get all reviews for a movie
const getReviewsByMovieId = async (req, res) => {
  try {
    const reviews = await Review.find({ movieId: req.params.movieId }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: reviews,
      reviews
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching reviews'
    });
  }
};

// Update an existing review
const updateReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review,
      review
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error updating review'
    });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting review'
    });
  }
};

module.exports = {
  addReview,
  getReviewsByMovieId,
  updateReview,
  deleteReview
};
