import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import MovieCard from '../components/MovieCard';
import SearchBar from '../components/SearchBar';
import { api } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';
import {
  getViewedMovies,
  clearViewedMovies,
  getSearchedMovies,
  getSearchQueries,
  clearSearchedMovies,
  recordMovieSearch,
} from '../utils/movieHistory';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

function Home() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [movies, setMovies] = useState([]);
  const [sections, setSections] = useState({
    trending: [],
    nowPlaying: [],
    topRated: [],
    upcoming: [],
  });
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'nowPlaying', 'popular', 'top_rated', 'upcoming'
  const [searchQuery, setSearchQuery] = useState('');

  // User Viewed Movies & User Searched Movies state
  const [viewedMovies, setViewedMovies] = useState(getViewedMovies());
  const [searchedMovies, setSearchedMovies] = useState(getSearchedMovies());
  const [recentQueries, setRecentQueries] = useState(getSearchQueries());

  // Structured Filters state (Country Location, Genre, Language)
  const [activeFilters, setActiveFilters] = useState({
    location: 'All Countries',
    genre: 'All Genres',
    language: 'All Languages',
  });

  // Listen to viewed & search history events in localStorage
  useEffect(() => {
    const handleViewedUpdate = (e) => {
      setViewedMovies(e.detail || getViewedMovies());
    };
    const handleSearchUpdate = () => {
      setSearchedMovies(getSearchedMovies());
      setRecentQueries(getSearchQueries());
    };

    window.addEventListener('imovies_viewed_updated', handleViewedUpdate);
    window.addEventListener('imovies_search_updated', handleSearchUpdate);

    return () => {
      window.removeEventListener('imovies_viewed_updated', handleViewedUpdate);
      window.removeEventListener('imovies_search_updated', handleSearchUpdate);
    };
  }, []);

  // Fetch sections (for categorized home page view)
  const fetchSections = async () => {
    try {
      const res = await api.getMovieSections();
      if (res.data?.success && res.data?.sections) {
        setSections(res.data.sections);
      }
    } catch (err) {
      console.warn('Could not load curated movie sections:', err.message);
    }
  };

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
      if (activeCategory === 'top_rated') params.category = 'top_rated';
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

        // If user performed an active search, record search results into history
        if (searchQuery.trim() && list.length > 0) {
          recordMovieSearch(searchQuery.trim(), list);
        }

        if (isManualRefresh) {
          toast.success(`Synced ${list.length} live movies with original trailers from TMDB!`);
          fetchSections();
        }
      }

      if (favsRes.status === 'fulfilled') {
        const favData = favsRes.value.data;
        const favList = Array.isArray(favData) ? favData : favData.favorites || favData.data || [];
        setFavorites(favList.map((f) => f.movieId?._id || f.movieId || f._id));
      }
    } catch (err) {
      console.error('Failed to load movies:', err);
      toast.error('Unable to fetch TMDB movie market updates');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMoviesAndFavs();
    }, 300);
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

  const today = dayjs().startOf('day');

  // Top featured movie for billboard hero
  const featuredMovie = useMemo(() => {
    return (
      sections.trending?.[0] ||
      movies.find((m) => m.backdropUrl || m.posterUrl) ||
      movies[0]
    );
  }, [sections, movies]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    activeFilters.location !== 'All Countries' ||
    activeFilters.genre !== 'All Genres' ||
    activeFilters.language !== 'All Languages' ||
    activeCategory !== 'all';

  return (
    <DashboardLayout activePage="/home">
      <div className="space-y-10">
        {/* ── Featured Hero Billboard (Netflix-style Edge Rectangle) ── */}
        {!loading && featuredMovie && !searchQuery && (
          <section className="relative w-full h-[50vh] sm:h-[58vh] overflow-hidden bg-black border border-zinc-800 shadow-2xl">
            <img
              src={featuredMovie.backdropUrl || featuredMovie.posterUrl}
              alt={featuredMovie.movieName}
              className="w-full h-full object-cover object-center filter brightness-90 transform scale-105"
              referrerPolicy="no-referrer"
            />

            {/* Cinematic Gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-end pb-8 px-6 sm:px-10 lg:px-12">
              <div className="max-w-2xl">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold bg-primary text-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                    <span className="w-2 h-2 bg-black animate-ping"></span>
                    TMDB Live Official
                  </span>
                  {featuredMovie.certification && (
                    <span className="px-2 py-0.5 text-xs font-bold border border-primary/40 text-primary bg-black">
                      {featuredMovie.certification}
                    </span>
                  )}
                  {featuredMovie.rating ? (
                    <span className="px-2 py-0.5 text-xs font-bold border border-zinc-700 text-white bg-black flex items-center gap-1">
                      <i className="fa-solid fa-star text-[10px] text-primary"></i>
                      {Number(featuredMovie.rating).toFixed(1)} TMDB
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

        {/* ── TMDB Regular Live Search Bar with Country Location, Genre & Language Filters ── */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onPerformSearch={handlePerformSearch}
          onClearSearch={handleClearSearch}
          isSearching={isSearching}
        />

        {/* ── Category Tabs & Live TMDB Market Controls ── */}
        <section
          className={`py-4 px-4 sm:px-6 border ${
            isDark ? 'bg-[#121216] border-zinc-800 shadow-xl' : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Tabs (Edge Rectangle Boxes) */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Movie Sections', icon: 'fa-film' },
                { id: 'popular', label: '🔥 Trending & Popular', icon: 'fa-fire' },
                { id: 'nowPlaying', label: '🎬 Now Playing', icon: 'fa-ticket' },
                { id: 'top_rated', label: '⭐ Top Rated', icon: 'fa-star' },
                { id: 'upcoming', label: '🗓️ Upcoming Releases', icon: 'fa-calendar-days' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveCategory(tab.id);
                  }}
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

            {/* Sync Live TMDB Button */}
            <button
              onClick={() => fetchMoviesAndFavs(true)}
              disabled={refreshing}
              className="px-3.5 py-2 text-xs font-bold border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-primary flex items-center gap-1.5 transition self-start sm:self-auto"
            >
              <i
                className={`fa-solid fa-arrows-rotate text-[11px] ${
                  refreshing ? 'animate-spin text-primary' : ''
                }`}
              ></i>
              {refreshing ? 'Syncing TMDB...' : 'Sync Live Market'}
            </button>
          </div>
        </section>

        {/* ── SECTION 1: USER'S LIVE SEARCH RESULTS (When actively searching) ── */}
        {searchQuery.trim() && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-primary/40 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-6 bg-primary"></span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                  Search Results for "{searchQuery}"
                </h2>
                <span className="text-xs px-2.5 py-0.5 font-bold uppercase bg-primary/20 text-primary border border-primary/30">
                  {movies.length} {movies.length === 1 ? 'Movie' : 'Movies'} Found
                </span>
              </div>
              <button
                onClick={handleClearSearch}
                className="text-xs font-bold text-primary hover:text-white transition flex items-center gap-1"
              >
                <i className="fa-solid fa-xmark"></i> Clear Search
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="border border-zinc-800 bg-zinc-900 animate-pulse aspect-[2/3]" />
                ))}
              </div>
            ) : movies.length === 0 ? (
              <div className="text-center py-12 border border-zinc-800 bg-[#0a0a0a] p-6 max-w-md mx-auto">
                <div className="text-5xl mb-3">🔍</div>
                <h3 className="text-lg font-bold text-white mb-1">No Search Results Found</h3>
                <p className="text-xs text-zinc-400 mb-4">
                  No movies matching "{searchQuery}" were found on TMDB.
                </p>
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 bg-primary hover:bg-orange-500 text-black text-xs font-black transition"
                >
                  Clear Search Query
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
        )}

        {/* ── SECTION 2: RECENTLY VIEWED MOVIES (User Viewed Movies Section) ── */}
        {!searchQuery && viewedMovies && viewedMovies.length > 0 && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-6 bg-primary"></span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                  <i className="fa-solid fa-eye text-primary text-base"></i>
                  Recently Viewed by You
                </h2>
                <span className="text-xs px-2.5 py-0.5 font-bold uppercase bg-zinc-900 text-zinc-300 border border-zinc-700">
                  {viewedMovies.length} Viewed
                </span>
              </div>
              <button
                onClick={clearViewedMovies}
                className="text-xs font-semibold text-zinc-400 hover:text-primary transition flex items-center gap-1"
                title="Clear viewed movies"
              >
                <i className="fa-solid fa-trash-can text-[11px]"></i> Clear History
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {viewedMovies.slice(0, 6).map((movie) => (
                <MovieCard
                  key={`viewed-${movie._id || movie.id}`}
                  movie={movie}
                  isFavorited={favorites.includes(movie._id || movie.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION 3: RECENTLY SEARCHED MOVIES (User Searched Movies Section) ── */}
        {!searchQuery && searchedMovies && searchedMovies.length > 0 && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-6 bg-zinc-700"></span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                  <i className="fa-solid fa-magnifying-glass text-primary text-base"></i>
                  Movies You Recently Searched
                </h2>
                <span className="text-xs px-2.5 py-0.5 font-bold uppercase bg-zinc-900 text-zinc-400 border border-zinc-800">
                  Search History
                </span>
              </div>
              <button
                onClick={clearSearchedMovies}
                className="text-xs font-semibold text-zinc-400 hover:text-primary transition flex items-center gap-1"
                title="Clear search history"
              >
                <i className="fa-solid fa-trash-can text-[11px]"></i> Clear
              </button>
            </div>

            {/* Quick search query pills */}
            {recentQueries && recentQueries.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-zinc-400 font-semibold">Recent Queries:</span>
                {recentQueries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchQuery(q)}
                    className="px-2.5 py-1 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-primary border border-zinc-800 transition flex items-center gap-1"
                  >
                    <i className="fa-solid fa-magnifying-glass text-[9px] text-primary"></i>
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {searchedMovies.slice(0, 6).map((movie) => (
                <MovieCard
                  key={`searched-${movie._id || movie.id}`}
                  movie={movie}
                  isFavorited={favorites.includes(movie._id || movie.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── FILTERED VIEW (When a single category tab is selected or dropdown filters are applied) ── */}
        {(activeCategory !== 'all' || hasActiveFilters) && !searchQuery && (
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-primary/40 pb-3">
              <span className="w-1.5 h-6 bg-primary"></span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                {activeCategory === 'popular'
                  ? '🔥 Trending & Popular Blockbusters'
                  : activeCategory === 'nowPlaying'
                  ? '🎬 Now Playing in Theatres'
                  : activeCategory === 'top_rated'
                  ? '⭐ Top Rated & Critically Acclaimed'
                  : activeCategory === 'upcoming'
                  ? '🗓️ Upcoming Releases & Advance Booking'
                  : 'Filtered Movies'}
              </h2>
              <span className="text-xs px-2.5 py-0.5 font-bold uppercase bg-primary/20 text-primary border border-primary/30">
                {movies.length} Titles
              </span>
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
                  No titles match your selected filters. Try resetting the filters.
                </p>
                <button
                  onClick={handleClearSearch}
                  className="px-5 py-2.5 bg-primary hover:bg-orange-500 text-black text-xs font-black transition"
                >
                  Reset All Filters
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
        )}

        {/* ── CURATED MULTI-SECTION HOME PAGE (When on 'all' without active search) ── */}
        {activeCategory === 'all' && !searchQuery && !hasActiveFilters && (
          <div className="space-y-14">
            {/* 1. TRENDING & POPULAR BLOCKBUSTERS */}
            {sections.trending && sections.trending.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-primary/40 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-primary"></span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                      <i className="fa-solid fa-fire text-primary text-base"></i>
                      Trending &amp; Popular Blockbusters
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 font-bold uppercase bg-primary/20 text-primary border border-primary/30">
                      Global Buzz
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveCategory('popular')}
                    className="text-xs font-bold text-zinc-400 hover:text-primary transition flex items-center gap-1"
                  >
                    View All ({sections.trending.length}) <i className="fa-solid fa-angle-right text-[10px]"></i>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                  {sections.trending.slice(0, 6).map((movie) => (
                    <MovieCard
                      key={`pop-${movie._id || movie.id}`}
                      movie={movie}
                      isFavorited={favorites.includes(movie._id || movie.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 2. NOW PLAYING IN THEATRES */}
            {sections.nowPlaying && sections.nowPlaying.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-primary/40 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-primary"></span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                      <i className="fa-solid fa-ticket text-primary text-base"></i>
                      Now Playing in Theatres
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 font-bold uppercase bg-primary/20 text-primary border border-primary/30">
                      Live Schedules
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveCategory('nowPlaying')}
                    className="text-xs font-bold text-zinc-400 hover:text-primary transition flex items-center gap-1"
                  >
                    View All ({sections.nowPlaying.length}) <i className="fa-solid fa-angle-right text-[10px]"></i>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                  {sections.nowPlaying.slice(0, 6).map((movie) => (
                    <MovieCard
                      key={`now-${movie._id || movie.id}`}
                      movie={movie}
                      isFavorited={favorites.includes(movie._id || movie.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 3. TOP RATED & CRITICALLY ACCLAIMED */}
            {sections.topRated && sections.topRated.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-primary/40 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-primary"></span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                      <i className="fa-solid fa-star text-primary text-base"></i>
                      Top Rated &amp; Critically Acclaimed
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 font-bold uppercase bg-primary/20 text-primary border border-primary/30">
                      High Ratings
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveCategory('top_rated')}
                    className="text-xs font-bold text-zinc-400 hover:text-primary transition flex items-center gap-1"
                  >
                    View All ({sections.topRated.length}) <i className="fa-solid fa-angle-right text-[10px]"></i>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                  {sections.topRated.slice(0, 6).map((movie) => (
                    <MovieCard
                      key={`top-${movie._id || movie.id}`}
                      movie={movie}
                      isFavorited={favorites.includes(movie._id || movie.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 4. UPCOMING & ADVANCE BOOKING */}
            {sections.upcoming && sections.upcoming.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-zinc-700"></span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                      <i className="fa-regular fa-calendar-days text-primary text-base"></i>
                      Upcoming &amp; Advance Booking
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 font-bold uppercase bg-zinc-900 text-zinc-300 border border-zinc-700">
                      Coming Soon
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveCategory('upcoming')}
                    className="text-xs font-bold text-zinc-400 hover:text-primary transition flex items-center gap-1"
                  >
                    View All ({sections.upcoming.length}) <i className="fa-solid fa-angle-right text-[10px]"></i>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                  {sections.upcoming.slice(0, 6).map((movie) => (
                    <MovieCard
                      key={`up-${movie._id || movie.id}`}
                      movie={movie}
                      isFavorited={favorites.includes(movie._id || movie.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Home;
