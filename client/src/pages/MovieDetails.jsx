import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import { api } from '../utils/api';
import { recordMovieView } from '../utils/movieHistory';
import { useTheme } from '../utils/ThemeContext';
import dayjs from 'dayjs';

function MovieDetails() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  // Review form states
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const [posterFallback, setPosterFallback] = useState(false);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const [movieRes, reviewsRes, favsRes] = await Promise.allSettled([
        api.getMovieById(movieId),
        api.getReviewsByMovieId(movieId),
        api.getUserFavorites(),
      ]);

      if (movieRes.status === 'fulfilled') {
        const mData = movieRes.value.data;
        const loadedMovie = mData?.movie || mData?.data || mData;
        setMovie(loadedMovie);
        if (loadedMovie) {
          recordMovieView(loadedMovie);
        }
      } else {
        toast.error('Movie not found');
      }

      if (reviewsRes.status === 'fulfilled') {
        const rData = reviewsRes.value.data;
        const rList = Array.isArray(rData) ? rData : rData?.reviews || rData?.data || [];
        setReviews(rList);
      }

      if (favsRes.status === 'fulfilled') {
        const fData = favsRes.value.data;
        const fList = Array.isArray(fData) ? fData : fData?.favorites || fData?.data || [];
        const isFav = fList.some(
          (f) => (f.movieId?._id || f.movieId || f._id) === movieId
        );
        setIsFavorite(isFav);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load movie details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (movieId) {
      fetchMovieDetails();
    }
  }, [movieId]);

  const handleToggleFavorite = async () => {
    try {
      setFavLoading(true);
      const res = await api.toggleFavorite({ movieId });
      const newStatus = res.data?.isFavorite !== undefined ? res.data.isFavorite : !isFavorite;
      setIsFavorite(newStatus);
      if (newStatus) {
        toast.success('Added to favorites ❤️');
      } else {
        toast.info('Removed from favorites');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating favorites');
    } finally {
      setFavLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    const userStr = localStorage.getItem('imovies-user');
    let userEmail = 'user@imovies.internal';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        userEmail = u.email || userEmail;
      } catch {
        userEmail = userStr;
      }
    }

    try {
      setSubmittingReview(true);
      await api.addReview({
        movieId,
        rating: Number(newRating),
        reviewText: newReviewText.trim(),
        userEmail,
      });

      toast.success('Review submitted successfully!');
      setNewReviewText('');
      setNewRating(5);

      // Refresh reviews list
      const updatedReviews = await api.getReviewsByMovieId(movieId);
      const rData = updatedReviews.data;
      setReviews(Array.isArray(rData) ? rData : rData?.reviews || rData?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <Loader />;

  if (!movie) {
    return (
      <div className="min-h-screen bg-dark flex flex-col text-white">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Movie Not Found</h2>
          <Link to="/home" className="px-5 py-2.5 bg-primary rounded-lg font-semibold">
            Return to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const genresList = Array.isArray(movie.genres)
    ? movie.genres
    : typeof movie.genres === 'string'
    ? movie.genres.split(',').map((g) => g.trim())
    : [];

  const castList = Array.isArray(movie.cast)
    ? movie.cast
    : typeof movie.cast === 'string'
    ? movie.cast.split(',').map((c) => ({ name: c.trim(), role: 'Cast' }))
    : [];

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-[#000000] text-white' : 'bg-white text-zinc-900'}`}>
      <Header />

      {/* Hero Movie Section */}
      <section className={`relative w-full py-12 px-4 sm:px-6 lg:px-8 border-b ${
        isDark ? 'bg-gradient-to-t from-dark via-dark/90 to-black/80 border-gray-800' : 'bg-zinc-50 border-zinc-200'
      }`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Poster Column */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-800 bg-gray-900 group">
              {((posterFallback && movie.backdropUrl) ? movie.backdropUrl : movie.posterUrl) && !posterError ? (
                <img
                  src={(posterFallback && movie.backdropUrl) ? movie.backdropUrl : movie.posterUrl}
                  alt={movie.movieName}
                  onError={() => {
                    if (!posterFallback && movie.backdropUrl && movie.backdropUrl !== movie.posterUrl) {
                      setPosterFallback(true);
                    } else {
                      setPosterError(true);
                    }
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-gray-500 bg-gradient-to-b from-zinc-900 to-black">
                  <span className="text-6xl mb-2 opacity-50">🎬</span>
                  <p className="font-semibold text-gray-300">{movie.movieName}</p>
                </div>
              )}
              {movie.certification && (
                <span className="absolute top-4 left-4 px-2.5 py-1 text-xs font-bold bg-black/90 text-primary border border-primary/50 rounded-md">
                  {movie.certification}
                </span>
              )}
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                  {movie.movieName}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mt-2">
                {movie.language && (
                  <span className="flex items-center gap-1.5 bg-gray-800 px-3 py-1 rounded-md">
                    <i className="fa-solid fa-language text-primary"></i> {movie.language}
                  </span>
                )}
                {movie.duration && (
                  <span className="flex items-center gap-1.5 bg-gray-800 px-3 py-1 rounded-md">
                    <i className="fa-regular fa-clock text-primary"></i> {movie.duration}
                  </span>
                )}
                {movie.releaseDate && (
                  <span className="flex items-center gap-1.5 bg-gray-800 px-3 py-1 rounded-md">
                    <i className="fa-regular fa-calendar text-primary"></i>{' '}
                    {dayjs(movie.releaseDate).format('MMM D, YYYY')}
                  </span>
                )}
                {movie.rating ? (
                  <span className="flex items-center gap-1.5 bg-gray-800 px-3 py-1 rounded-md text-white font-bold border border-white/10">
                    <i className="fa-solid fa-star text-primary"></i> {Number(movie.rating).toFixed(1)} / 10 TMDB
                  </span>
                ) : null}
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {genresList.map((g, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/20 border border-primary/40 text-primary"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis / Description */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-200 uppercase tracking-wide text-xs">
                About the Movie
              </h3>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-3xl">
                {movie.description || 'No detailed synopsis available for this title.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => navigate(`/movieshows/${movieId}`)}
                className="px-8 py-3.5 bg-primary hover:bg-[#ff7700] text-black font-black shadow-xl transition flex items-center gap-3 transform hover:-translate-y-0.5"
              >
                <i className="fa-solid fa-ticket text-lg"></i>
                <span>Book Tickets</span>
              </button>

              <button
                onClick={handleToggleFavorite}
                disabled={favLoading}
                className={`px-6 py-3.5 font-semibold border transition flex items-center gap-2 ${
                  isFavorite
                    ? 'bg-primary/20 border-primary text-primary hover:bg-primary/30'
                    : 'bg-black/60 border-white/10 text-zinc-300 hover:border-white/30 hover:text-white'
                }`}
              >
                <i className={`fa-heart ${isFavorite ? 'fa-solid text-primary' : 'fa-regular'}`}></i>
                <span>{isFavorite ? 'In Watchlist' : 'Add to Favorites'}</span>
              </button>

              {movie.trailerUrl && (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 font-semibold bg-[#121216] hover:bg-zinc-800 text-white border border-zinc-800 hover:border-primary transition flex items-center gap-2"
                >
                  <i className="fa-solid fa-play text-primary"></i>
                  <span>Watch Official Trailer</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cast & Crew Section */}
      {castList.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-800">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-2.5 h-6 bg-primary rounded-full"></span>
              Top Cast & Characters
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {castList.map((member, idx) => {
                const name = typeof member === 'string' ? member : member.name || member.actorName || 'Actor';
                const role = typeof member === 'object' ? member.role || member.character || 'Cast' : 'Actor';

                // Resolve TMDB or custom actor profile image URL
                let rawImg = typeof member === 'object' ? (member.profileUrl || member.profilePath || member.profile_path || member.image || member.photoUrl) : '';
                let imgSrc = '';
                if (rawImg) {
                  if (rawImg.startsWith('http')) {
                    imgSrc = rawImg;
                  } else if (rawImg.startsWith('/')) {
                    imgSrc = `https://image.tmdb.org/t/p/w185${rawImg}`;
                  } else {
                    imgSrc = `https://image.tmdb.org/t/p/w185/${rawImg}`;
                  }
                }
                const fallbackImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=18181f&color=ff6b00&size=185&bold=true`;
                const finalImg = imgSrc || fallbackImg;

                return (
                  <div
                    key={idx}
                    className="bg-[#121216] p-4 border border-zinc-800 text-center flex flex-col items-center hover:border-primary/50 transition duration-300 group shadow-lg"
                  >
                    <div className="w-20 h-20 overflow-hidden border-2 border-zinc-800 group-hover:border-primary transition mb-3 shadow-md bg-dark-700 relative">
                      <img
                        src={finalImg}
                        alt={name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = fallbackImg;
                        }}
                      />
                    </div>
                    <span className="font-semibold text-sm text-white line-clamp-1 group-hover:text-primary transition">{name}</span>
                    <span className="text-xs text-gray-400 mt-0.5 line-clamp-1">{role}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Reviews & Ratings Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="w-2.5 h-6 bg-primary rounded-full"></span>
          User Reviews & Ratings ({reviews.length})
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Write a Review Form */}
          <div className="lg:col-span-5 bg-card p-6 rounded-2xl border border-gray-800 h-fit">
            <h3 className="text-lg font-bold text-white mb-4">Leave Your Review</h3>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                  Your Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="text-2xl transition hover:scale-125 focus:outline-none"
                    >
                      <i
                        className={`fa-star ${
                          star <= newRating
                            ? 'fa-solid text-primary drop-shadow-[0_0_8px_rgba(255,107,0,0.5)]'
                            : 'fa-regular text-gray-600'
                        }`}
                      ></i>
                    </button>
                  ))}
                  <span className="text-sm font-bold text-primary ml-2">
                    {newRating} / 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                  Review Thoughts
                </label>
                <textarea
                  required
                  rows={4}
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="Share your thoughts on the screenplay, visuals, sound..."
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary text-sm resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 bg-primary hover:bg-orange-500 text-black font-black rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-orange-950/40"
              >
                {submittingReview ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i>
                    <span>Post Review</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-7 space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-card/50 p-8 rounded-2xl border border-gray-800 text-center">
                <div className="text-4xl mb-3 text-gray-600">💬</div>
                <h4 className="text-lg font-bold text-white mb-1">No reviews yet</h4>
                <p className="text-sm text-gray-400">
                  Be the first to share your thoughts about this movie!
                </p>
              </div>
            ) : (
              reviews.map((rev, idx) => (
                <div
                  key={rev._id || idx}
                  className="bg-card p-5 rounded-xl border border-gray-800 space-y-2 hover:border-gray-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 text-primary font-bold flex items-center justify-center text-xs border border-primary/30">
                        {(rev.userEmail || rev.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm text-white">
                        {rev.username || rev.userEmail || 'Verified Moviegoer'}
                      </span>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1 text-primary text-xs">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={`fa-star ${
                            star <= (rev.rating || 5) ? 'fa-solid' : 'fa-regular text-gray-600'
                          }`}
                        ></i>
                      ))}
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm leading-relaxed pt-1">
                    {rev.reviewText || rev.comment}
                  </p>

                  {rev.createdAt && (
                    <span className="text-[11px] text-gray-500 block pt-1">
                      {dayjs(rev.createdAt).format('MMMM D, YYYY • h:mm A')}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default MovieDetails;
