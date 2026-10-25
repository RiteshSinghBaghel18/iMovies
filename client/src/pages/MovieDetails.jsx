import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import api from "../utils/api";
import Loader from "../components/Loader";
import { 
  Star, 
  Clock, 
  Calendar, 
  Heart, 
  Ticket, 
  Share2, 
  Play, 
  User, 
  Send, 
  Sparkles,
  Check,
  Film
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const MovieDetails = () => {
  const { movieId } = useParams();
  const { isAuthenticated } = useAuth();

  const { data: movieData, loading: movieLoading, refetch: refetchMovie } = useFetch(`/movie/${movieId}`);
  const { data: reviewData, loading: reviewLoading, refetch: refetchReviews } = useFetch(`/review/movie/${movieId}`);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Trailer modal state
  const [showTrailer, setShowTrailer] = useState(false);

  const movie = movieData?.movie;
  const reviews = reviewData?.reviews || [];

  // Check if movie is already in user watchlist
  useEffect(() => {
    if (isAuthenticated && movieId) {
      api.get(`/favorite/check/${movieId}`)
        .then((res) => {
          if (res.data.success) {
            setIsFavorite(res.data.isFavorite);
          }
        })
        .catch(() => {});
    }
  }, [movieId, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to add movies to your watchlist.");
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await api.delete(`/favorite/${movieId}`);
        setIsFavorite(false);
        toast.info("Removed from watchlist.");
      } else {
        await api.post("/favorite", { movieId });
        setIsFavorite(true);
        toast.success("Added to your watchlist!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update watchlist.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please sign in to share a review.");
      return;
    }
    if (!reviewText.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await api.post("/review", {
        movieId,
        rating: Number(rating),
        reviewText,
      });

      if (res.data.success) {
        toast.success("Review submitted! Thank you for your feedback.");
        setReviewText("");
        refetchReviews();
        refetchMovie();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (movieLoading) {
    return <Loader message="Loading movie overview..." />;
  }

  if (!movie) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Movie Not Found</h2>
        <p className="text-slate-400 mb-6">The requested movie does not exist or has been removed.</p>
        <Link to="/home" className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm">
          Return to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cinema-darkest text-slate-100 pb-20">
      
      {/* Backdrop Hero Header */}
      <div className="relative min-h-[460px] lg:h-[520px] flex items-end overflow-hidden border-b border-cinema-border/40">
        <div className="absolute inset-0 z-0">
          <img
            src={movie.bannerUrl || movie.posterUrl}
            alt={movie.movieName}
            className="w-full h-full object-cover object-top opacity-30 filter blur-[0.5px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-darkest via-cinema-darkest/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-darkest via-cinema-darkest/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
            
            {/* Poster Thumbnail */}
            <div className="w-44 sm:w-56 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl shadow-black flex-shrink-0 bg-slate-900 hidden sm:block">
              <img
                src={movie.posterUrl}
                alt={movie.movieName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info details */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider">
                  {movie.certification || "U/A"}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-300">{movie.language}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-300">{movie.duration}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white">
                {movie.movieName}
              </h1>

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {movie.genres?.map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Rating and Release Date */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                    <Star className="w-5 h-5 fill-amber-400" />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-white">{movie.rating} <span className="text-xs text-slate-400 font-normal">/ 10</span></p>
                    <p className="text-[11px] text-slate-400">{movie.voteCount || reviews.length || 120} audience votes</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-xs border-l border-slate-800 pl-6">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Release: {new Date(movie.releaseDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  to={`/movieshows/${movie._id}`}
                  className="px-8 py-3.5 rounded-xl bg-[#76b900] hover:bg-[#8cd600] text-slate-950 font-black text-sm shadow-xl shadow-[#76b900]/30 flex items-center gap-2 hover:scale-105 transition-all"
                >
                  <Ticket className="w-5 h-5" />
                  <span>Book Theatrical Tickets</span>
                </Link>

                <button
                  type="button"
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  className={`px-5 py-3.5 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all ${
                    isFavorite
                      ? "bg-rose-500/15 border-rose-500 text-rose-400"
                      : "bg-[#18181f] border-[#27272a] text-slate-300 hover:border-[#76b900]/50"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
                  <span>{isFavorite ? "In Watchlist" : "Add to Watchlist"}</span>
                </button>

                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3.5 rounded-xl bg-[#18181f] border border-[#27272a] text-slate-300 hover:border-[#76b900]/50 text-sm font-semibold flex items-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4 text-[#76b900]" />
                  <span>Watch Trailer</span>
                </a>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Content Body: Synopsis, Cast, Reviews */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Synopsis & Cast */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Synopsis Card */}
            <div className="bg-cinema-card border border-cinema-border rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl font-bold text-white mb-3">About the Movie</h3>
              <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                {movie.description}
              </p>
            </div>

            {/* Cast & Crew Card */}
            <div className="bg-cinema-card border border-cinema-border rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl font-bold text-white mb-4">Cast & Crew</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Director</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                      {movie.director?.charAt(0) || "D"}
                    </div>
                    <span className="text-sm font-bold text-white">{movie.director || "Unknown"}</span>
                  </div>
                </div>

                {movie.cast && movie.cast.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Starring Cast</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {movie.cast.map((actor) => (
                        <div key={actor} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                          <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center font-bold text-sm mb-1.5 border border-red-500/20">
                            {actor.charAt(0)}
                          </div>
                          <p className="text-xs font-semibold text-white truncate">{actor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-cinema-card border border-cinema-border rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Audience Reviews</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{reviews.length} community review{reviews.length === 1 ? "" : "s"}</p>
                </div>
              </div>

              {/* Submit Review Form */}
              <form onSubmit={handleReviewSubmit} className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-slate-200">Rate & Review this Movie</h4>
                
                {/* Rating Stars picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 mr-2">Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-600 hover:text-slate-400"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 ml-2">{rating} / 5 Stars</span>
                </div>

                <div>
                  <textarea
                    rows={3}
                    required
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder={isAuthenticated ? "Write your honest thoughts about the film, performances, visuals..." : "Please sign in to write a review"}
                    disabled={!isAuthenticated}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50"
                  />
                </div>

                <div className="flex justify-between items-center">
                  {!isAuthenticated ? (
                    <span className="text-xs text-slate-400">
                      <Link to="/login" className="text-red-400 underline font-semibold">Sign In</Link> to post a review.
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Reviews are moderated for community safety.</span>
                  )}

                  <button
                    type="submit"
                    disabled={submittingReview || !isAuthenticated || !reviewText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#76b900] hover:bg-[#8cd600] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-[#76b900]/20 transition-all disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingReview ? "Posting..." : "Post Review"}</span>
                  </button>
                </div>
              </form>

              {/* Reviews List */}
              <div className="space-y-4 pt-2">
                {reviews.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-6">
                    No reviews yet. Be the first to share your thoughts on this movie!
                  </p>
                ) : (
                  reviews.map((r) => (
                    <div
                      key={r._id}
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs uppercase">
                            {r.username?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200">{r.username}</p>
                            <p className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Rating stars */}
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < r.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-9">
                        {r.reviewText}
                      </p>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>

          {/* Right Column: Quick Booking Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-cinema-card border border-cinema-border rounded-2xl p-6 space-y-4 sticky top-24">
              <h3 className="font-bold text-white text-base">Booking Highlights</h3>
              
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Audio / Format:</span>
                  <span className="font-semibold text-white">Dolby Atmos / 4K Laser</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-semibold text-white">{movie.duration}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Language:</span>
                  <span className="font-semibold text-white">{movie.language}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Seat Tiers:</span>
                  <span className="font-semibold text-white">Balcony, Middle, Lower</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to={`/movieshows/${movie._id}`}
                  className="w-full py-3.5 rounded-xl bg-[#76b900] hover:bg-[#8cd600] text-slate-950 font-black text-sm shadow-xl shadow-[#76b900]/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Select Theatre & Showtime</span>
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                💡 <span className="text-slate-200 font-semibold">Seat Lock Guarantee:</span> Once you choose seats on the interactive map, they are held exclusively for you for 10 minutes.
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default MovieDetails;
