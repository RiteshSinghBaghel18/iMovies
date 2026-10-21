import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';
import { recordMovieView } from '../utils/movieHistory';

function MovieCard({ movie, isFavorited: initialFavorited = false, onFavoriteChanged }) {
  const [isFav, setIsFav] = useState(initialFavorited);
  const [favLoading, setFavLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsFav(initialFavorited);
  }, [initialFavorited]);

  const movieId = movie?._id || movie?.id;

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('imovies-token');
    if (!token) {
      toast.info('Please sign in to save favorites');
      return;
    }

    try {
      setFavLoading(true);
      const res = await api.toggleFavorite({ movieId });
      const newStatus = res.data?.isFavorite !== undefined ? res.data.isFavorite : !isFav;
      setIsFav(newStatus);
      if (newStatus) {
        toast.success(`Added "${movie?.movieName}" to favorites`);
      } else {
        toast.info(`Removed "${movie?.movieName}" from favorites`);
      }
      if (onFavoriteChanged) onFavoriteChanged(movieId, newStatus, res.data?.favorites);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update favorite');
    } finally {
      setFavLoading(false);
    }
  };

  const genresList = Array.isArray(movie?.genres)
    ? movie.genres
    : typeof movie?.genres === 'string'
    ? movie.genres.split(',').map((g) => g.trim())
    : [];

  const cardBg = theme === 'dark'
    ? 'bg-[#121216] border-zinc-800 hover:border-primary'
    : 'bg-white border-zinc-200 hover:border-primary';

  return (
    <div
      className={`group relative overflow-hidden border transition-all duration-300 flex flex-col h-full cursor-pointer shadow-lg ${cardBg}`}
      style={{
        transform: hovered ? 'scale(1.03) translateY(-4px)' : 'scale(1)',
        boxShadow: hovered ? '0 20px 40px rgba(0,0,0,0.7), 0 0 25px rgba(255,107,0,0.3)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        zIndex: hovered ? 10 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-black flex-shrink-0">
        {movie?.posterUrl && !imgError ? (
          <img
            src={movie.posterUrl}
            alt={movie.movieName}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-zinc-950">
            <span className="text-5xl mb-3 opacity-40">🎬</span>
            <span className="text-sm font-bold text-zinc-300 line-clamp-2">{movie?.movieName || 'Movie Poster'}</span>
            <span className="text-xs text-primary mt-1">{movie?.language || 'Cinema'}</span>
          </div>
        )}

        {/* Badges on Top Left (Certification & TMDB Rating) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            {movie?.certification && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-black text-primary border border-primary/40">
                {movie.certification}
              </span>
            )}
            {movie?.rating ? (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-black text-white border border-zinc-700 flex items-center gap-1 shadow-sm">
                <i className="fa-solid fa-star text-[9px] text-primary"></i>
                {Number(movie.rating).toFixed(1)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Favorite Heart Button - Edge Rectangle */}
        <button
          onClick={handleFavoriteClick}
          disabled={favLoading}
          aria-label="Toggle favorite"
          className="absolute top-2.5 right-2.5 w-8 h-8 bg-black/90 border border-zinc-800 flex items-center justify-center text-white hover:scale-125 transition-all active:scale-95 z-10"
        >
          <i
            className={`fa-heart text-sm transition-colors ${
              isFav ? 'fa-solid text-primary' : 'fa-regular text-zinc-300 group-hover:text-primary'
            }`}
          ></i>
        </button>

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none transition-opacity duration-300"
          style={{ opacity: hovered ? 1 : 0.5 }}
        />

        {/* Quick Book overlay — slides up on hover */}
        <div
          className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-1.5 transition-all duration-300"
          style={{ transform: hovered ? 'translateY(0)' : 'translateY(110%)', opacity: hovered ? 1 : 0 }}
        >
          <Link
            to={`/moviedetails/${movieId}`}
            onClick={() => recordMovieView(movie)}
            className="w-full py-2 bg-primary hover:bg-orange-500 text-black text-center text-xs font-black uppercase tracking-wide shadow-lg shadow-orange-950/50 transition flex items-center justify-center gap-1.5"
          >
            <i className="fa-solid fa-ticket text-[10px]"></i>
            Book Tickets
          </Link>
          {movie?.trailerUrl && (
            <a
              href={movie.trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                recordMovieView(movie);
              }}
              className="w-full py-1.5 bg-black/90 hover:bg-zinc-800 text-white text-center text-[11px] font-bold border border-zinc-700 hover:border-primary transition flex items-center justify-center gap-1.5"
            >
              <i className="fa-solid fa-play text-primary text-[9px]"></i>
              Watch Trailer
            </a>
          )}
        </div>
      </div>

      {/* Movie Details */}
      <div className={`p-3.5 flex-1 flex flex-col justify-between ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
        <div>
          <h3 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1 mb-1 uppercase tracking-tight">
            {movie?.movieName}
          </h3>

          <div className={`flex items-center text-[11px] gap-2.5 mb-2 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {movie?.language && (
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-language text-zinc-500"></i> {movie.language}
              </span>
            )}
            {movie?.duration && (
              <span className="flex items-center gap-1">
                <i className="fa-regular fa-clock text-zinc-500"></i> {movie.duration}
              </span>
            )}
          </div>

          {/* Genre Badges */}
          {genresList.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {genresList.slice(0, 2).map((genre, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800"
                >
                  {genre}
                </span>
              ))}
              {genresList.length > 2 && (
                <span className="px-1 py-0.5 text-[9px] text-zinc-500 font-bold">
                  +{genresList.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Fallback Action Button (visible when not hovering) */}
        <Link
          to={`/moviedetails/${movieId}`}
          onClick={() => recordMovieView(movie)}
          className={`mt-3 w-full py-2 px-3 text-center text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
            theme === 'dark'
              ? 'bg-zinc-900 hover:bg-primary text-zinc-300 hover:text-black border border-zinc-800 hover:border-transparent'
              : 'bg-zinc-100 hover:bg-primary text-zinc-700 hover:text-black border border-zinc-200 hover:border-transparent'
          }`}
        >
          <i className="fa-solid fa-circle-info text-[10px]"></i>
          View Details
        </Link>
      </div>
    </div>
  );
}

export default MovieCard;
