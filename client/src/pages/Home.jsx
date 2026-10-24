import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import MovieCard from '../components/MovieCard';
import SearchBar from '../components/SearchBar';
import { api } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';
import { toast } from 'react-toastify';

function Home() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [movies, setMovies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'nowPlaying', 'popular', 'upcoming'
  const [searchQuery, setSearchQuery] = useState('');

  // Structured Filters state (Country Location, Genre, Language)
  const [activeFilters, setActiveFilters] = useState({
    location: 'All Countries',
    genre: 'All Genres',
    language: 'All Languages',
  });

  const fetchMoviesAndFavs = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const params = {};
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
        setIsSearching(true);
      }
      if (activeFilters.genre !== 'All' && activeFilters.genre !== 'All Genres') {
        params.genre = activeFilters.genre;
      }
      if (activeFilters.language !== 'All' && activeFilters.language !== 'All Languages') {
        params.language = activeFilters.language;
      }
      if (activeFilters.location !== 'All' && activeFilters.location !== 'All Countries') {
        params.location = activeFilters.location;
      }
      if (activeCategory === 'popular') params.category = 'popular';
      if (activeCategory === 'nowPlaying') params.category = 'nowPlaying';
      if (activeCategory === 'upcoming') params.category = 'upcoming';
      if (isManualRefresh) params.refresh = 'true';

      const [moviesRes, favsRes] = await Promise.allSettled([
        api.getAllMovies(params),
        api.getUserFavorites(),
      ]);

      if (moviesRes.status === 'fulfilled') {
        const data = moviesRes.value.data;
        const list = Array.isArray(data) ? data : data.movies || data.data || [];
        setMovies(list);

        if (isManualRefresh) {
          toast.success(`Refreshed ${list.length} live movies with latest TMDB market data!`);
        }
      }

      if (favsRes.status === 'fulfilled') {
        const favData = favsRes.value.data;
        const favList = Array.isArray(favData) ? favData : favData.favorites || favData.data || [];
        setFavorites(favList.map((f) => f.movieId?._id || f.movieId || f._id));
      }
    } catch (err) {
      console.error('Failed to load movies:', err);
      toast.error('Unable to fetch movie market updates');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMoviesAndFavs();
    }, 250);
    return () => clearTimeout(timer);
  }, [activeFilters, activeCategory, searchQuery]);

  const handleFilterChange = (filterKey, value) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  const handlePerformSearch = (query) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveFilters({
      location: 'All Countries',
      genre: 'All Genres',
      language: 'All Languages',
    });
  };

  // Featured Hero Billboard — ALWAYS prioritizes newly added by Admin at the top!
  const featuredMovie = useMemo(() => {
    return (
      movies.find((m) => m.isAdminAdded || m.isCustom) ||
      movies.find((m) => m.backdropUrl || m.posterUrl) ||
      movies[0]
    );
  }, [movies]);

  return (
    <DashboardLayout activePage="/home">
      <div className="space-y-8">
        {/* ── Featured Hero Billboard ── */}
        {!loading && featuredMovie && !searchQuery && (
          <section className="relative w-full h-[48vh] sm:h-[55vh] overflow-hidden bg-black border border-zinc-800 shadow-2xl">
            <img
              src={featuredMovie.backdropUrl || featuredMovie.posterUrl}
              alt={featuredMovie.movieName}
              className="w-full h-full object-cover object-center filter brightness-90 transform scale-105"
              referrerPolicy="no-referrer"
            />

            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-end pb-8 px-6 sm:px-10 lg:px-12">
              <div className="max-w-2xl">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {featuredMovie.isAdminAdded ? (
                    <span className="px-3 py-1 text-xs font-black bg-primary text-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                      ⭐ Admin Premiere
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-bold bg-primary text-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 bg-black animate-ping"></span>
                      TMDB Live
                    </span>
                  )}

                  {featuredMovie.certification && (
                    <span className="px-2 py-0.5 text-xs font-bold border border-primary/40 text-primary bg-black">
                      {featuredMovie.certification}
                    </span>
                  )}
                  {featuredMovie.rating ? (
                    <span className="px-2 py-0.5 text-xs font-bold border border-zinc-700 text-white bg-black flex items-center gap-1">
                      <i className="fa-solid fa-star text-[10px] text-primary"></i>
                      {Number(featuredMovie.rating).toFixed(1)}
                    </span>
                  ) : null}
                </div>

                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-2 leading-tight drop-shadow-2xl uppercase">
                  {featuredMovie.movieName}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300 mb-3">
                  {featuredMovie.language && (
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-language text-zinc-400"></i> {featuredMovie.language}
                    </span>
                  )}
                  {featuredMovie.duration && (
                    <span className="flex items-center gap-1">
                      <i className="fa-regular fa-clock text-zinc-400"></i> {featuredMovie.duration}
                    </span>
                  )}
                  {Array.isArray(featuredMovie.genres) &&
                    featuredMovie.genres.slice(0, 3).map((g, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-zinc-900 border border-zinc-800 text-zinc-200">
                        {g}
                      </span>
                    ))}
                </div>

                <p className="text-zinc-300 text-sm sm:text-base line-clamp-2 sm:line-clamp-3 mb-6 max-w-xl leading-relaxed">
                  {featuredMovie.description}
                </p>

                <div className="flex flex-wrap items-center gap-3.5">
                  <a
                    href={`/moviedetails/${featuredMovie._id || featuredMovie.id}`}
                    className="px-6 py-3 bg-primary hover:bg-orange-500 text-black font-black text-sm sm:text-base transition flex items-center gap-2.5 shadow-xl shadow-orange-950/60"
                  >
                    <i className="fa-solid fa-ticket text-base"></i> Book Tickets
                  </a>
                  {featuredMovie.trailerUrl && (
                    <a
                      href={featuredMovie.trailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-[#0a0a0a] hover:bg-zinc-800 text-white font-semibold text-sm sm:text-base border border-zinc-800 hover:border-primary transition flex items-center gap-2"
                    >
                      <i className="fa-solid fa-play text-primary"></i> Watch Trailer
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Search Bar with Filters ── */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onPerformSearch={handlePerformSearch}
          onClearSearch={handleClearSearch}
          isSearching={isSearching}
        />

        {/* ── Simple Category Tabs & Live Refresh ── */}
        <section
          className={`py-3.5 px-4 sm:px-6 border ${
            isDark ? 'bg-[#121216] border-zinc-800 shadow-xl' : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Movies', icon: 'fa-film' },
                { id: 'nowPlaying', label: '🎬 Now Playing', icon: 'fa-ticket' },
                { id: 'popular', label: '🔥 Trending', icon: 'fa-fire' },
                { id: 'upcoming', label: '🗓️ Upcoming', icon: 'fa-calendar-days' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-4 py-2 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                    activeCategory === tab.id
                      ? 'bg-primary text-black shadow-md shadow-orange-950/40'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <i className={`fa-solid ${tab.icon} text-[11px]`}></i>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Refresh with Latest TMDB Database Button */}
            <button
              onClick={() => fetchMoviesAndFavs(true)}
              disabled={refreshing}
              className="px-3.5 py-2 text-xs font-bold border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-primary flex items-center gap-1.5 transition self-start sm:self-auto"
              title="Refresh with latest TMDB database"
            >
              <i
                className={`fa-solid fa-arrows-rotate text-[11px] ${
                  refreshing ? 'animate-spin text-primary' : ''
                }`}
              ></i>
              {refreshing ? 'Refreshing TMDB...' : 'Refresh with TMDB'}
            </button>
          </div>
        </section>

        {/* ── Simple Clean Movie Catalog Grid ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-primary/40 pb-3">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-6 bg-primary"></span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                {searchQuery.trim()
                  ? `Search Results for "${searchQuery}"`
                  : activeCategory === 'popular'
                  ? '🔥 Trending Movies'
                  : activeCategory === 'nowPlaying'
                  ? '🎬 Now Playing in Theatres'
                  : activeCategory === 'upcoming'
                  ? '🗓️ Upcoming Releases'
                  : 'Movie Catalog'}
              </h2>
              <span className="text-xs px-2.5 py-0.5 font-bold uppercase bg-primary/20 text-primary border border-primary/30">
                {movies.length} {movies.length === 1 ? 'Movie' : 'Movies'}
              </span>
            </div>

            {searchQuery.trim() && (
              <button
                onClick={handleClearSearch}
                className="text-xs font-bold text-primary hover:text-white transition flex items-center gap-1"
              >
                <i className="fa-solid fa-xmark"></i> Clear Search
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {[...Array(12)].map((_, idx) => (
                <div key={idx} className="border border-zinc-800 bg-zinc-900 animate-pulse aspect-[2/3]" />
              ))}
            </div>
          ) : movies.length === 0 ? (
            <div className="text-center py-16 border border-zinc-800 bg-[#0a0a0a] p-8 max-w-md mx-auto">
              <div className="text-5xl mb-3">🎬</div>
              <h3 className="text-lg font-bold text-white mb-2">No Movies Found</h3>
              <p className="text-xs text-zinc-400 mb-5">
                No titles match your selected filters. Try clearing your search or filters.
              </p>
              <button
                onClick={handleClearSearch}
                className="px-5 py-2.5 bg-primary hover:bg-orange-500 text-black text-xs font-black transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {movies.map((movie) => (
                <MovieCard
                  key={movie._id || movie.id}
                  movie={movie}
                  isFavorited={favorites.includes(movie._id || movie.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default Home;
