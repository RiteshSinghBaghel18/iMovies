import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import { api } from '../utils/api';

function FavoriteShows() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await api.getUserFavorites();
      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.favorites || res.data?.data || [];
      setFavorites(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleFavoriteChanged = (movieId, isFav) => {
    if (!isFav) {
      setFavorites((prev) =>
        prev.filter((f) => (f.movieId?._id || f.movieId || f._id) !== movieId)
      );
    }
  };

  if (loading) return <Loader />;

  return (
    <DashboardLayout activePage="/favoriteshows">
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span className="text-primary">❤️</span>
            My Movie Watchlist
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Keep track of titles you're excited to see on the big screen.
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20 bg-[#121216] rounded-2xl border border-zinc-800 max-w-md mx-auto p-8 shadow-xl">
            <div className="text-6xl mb-4">🍿</div>
            <h3 className="text-xl font-bold text-white mb-2">Your Watchlist is Empty</h3>
            <p className="text-zinc-400 text-sm mb-6">
              You haven't bookmarked any movies yet. Click the heart icon on any movie poster to save it here.
            </p>
            <Link
              to="/home"
              className="px-6 py-2.5 bg-primary hover:bg-[#ff7700] text-black text-sm font-black rounded-none transition inline-flex items-center gap-2 shadow-lg"
            >
              <i className="fa-solid fa-film"></i>
              <span>Discover Movies</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {favorites.map((fav) => {
              const movieObj = fav.movieId && typeof fav.movieId === 'object' ? fav.movieId : fav;
              const mId = movieObj._id || movieObj.id || fav._id;
              return (
                <MovieCard
                  key={mId}
                  movie={movieObj}
                  isFavorited={true}
                  onFavoriteChanged={handleFavoriteChanged}
                />
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default FavoriteShows;

