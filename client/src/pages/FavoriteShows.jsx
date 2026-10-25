import React from "react";
import { Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import api from "../utils/api";
import Loader from "../components/Loader";
import { Heart, Trash2, Ticket, Star, Clock, Film } from "lucide-react";
import { toast } from "react-toastify";

const FavoriteShows = () => {
  const { data, loading, error, refetch } = useFetch("/favorite");

  const favorites = data?.favorites || [];

  const handleRemove = async (movieId) => {
    try {
      const res = await api.delete(`/favorite/${movieId}`);
      if (res.data.success) {
        toast.info("Removed from your watchlist.");
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove movie.");
    }
  };

  if (loading) {
    return <Loader message="Loading your movie watchlist..." />;
  }

  return (
    <div className="min-h-screen bg-cinema-darkest text-slate-100 pb-20">
      
      {/* Header */}
      <div className="bg-cinema-card border-b border-cinema-border/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">My Watchlist</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved movies you plan to experience on the big screen ({favorites.length})
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {favorites.length === 0 ? (
          <div className="text-center py-20 bg-cinema-card rounded-3xl border border-cinema-border p-8 max-w-xl mx-auto">
            <Heart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Your Watchlist is Empty</h3>
            <p className="text-sm text-slate-400 mb-6">
              You haven't saved any movies yet. Browse now-showing titles and tap the heart icon to save them for later!
            </p>
            <Link
              to="/home"
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all inline-block"
            >
              Discover Movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {favorites.map((movie) => (
              <div
                key={movie._id}
                className="group bg-cinema-card rounded-2xl overflow-hidden border border-cinema-border/60 hover:border-red-500/40 transition-all duration-300 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="relative aspect-[2/3] overflow-hidden bg-slate-900">
                    <img
                      src={movie.posterUrl}
                      alt={movie.movieName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/75 backdrop-blur-md text-amber-400 text-xs font-bold flex items-center gap-1 border border-amber-400/20">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{movie.rating}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(movie._id)}
                      title="Remove from Watchlist"
                      className="absolute top-3 left-3 p-2 rounded-lg bg-black/75 backdrop-blur-md text-rose-400 hover:text-white hover:bg-rose-600 transition-all border border-rose-500/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4">
                    <Link to={`/moviedetails/${movie._id}`}>
                      <h3 className="font-bold text-base text-white group-hover:text-red-400 transition-colors line-clamp-1">
                        {movie.movieName}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {movie.genres?.join(", ")}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {movie.duration}
                      </span>
                      <span>•</span>
                      <span>{movie.language}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Link
                    to={`/movieshows/${movie._id}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold text-center shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    Book Showtimes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default FavoriteShows;
