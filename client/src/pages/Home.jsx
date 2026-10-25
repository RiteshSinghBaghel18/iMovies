import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import Loader from "../components/Loader";
import { 
  Search, 
  Filter, 
  Star, 
  Calendar, 
  Clock, 
  Ticket, 
  Sparkles, 
  Play, 
  Flame,
  Film,
  Compass,
  ArrowRight
} from "lucide-react";

// Check if a movie is already released (date <= today)
const isMovieReleased = (movie) => {
  if (!movie.releaseDate) return true;
  const release = new Date(movie.releaseDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return release <= today;
};

const Home = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All"); // "All" | "now_playing" | "upcoming"
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");

  const { data, loading, error } = useFetch("/movie");
  const movies = data?.movies || [];

  // Distinct genres and languages for filter dropdowns
  const genresList = useMemo(() => {
    const set = new Set();
    movies.forEach((m) => m.genres?.forEach((g) => set.add(g)));
    return ["All", ...Array.from(set)];
  }, [movies]);

  const languagesList = useMemo(() => {
    const set = new Set();
    movies.forEach((m) => {
      if (m.language) set.add(m.language);
    });
    return ["All", ...Array.from(set)];
  }, [movies]);

  // Split all movies into (1) In Theatres vs (2) Upcoming Releases
  // Admin-added movies are placed into either section based on releaseDate, prioritized at the top
  const { inTheatresList, upcomingList } = useMemo(() => {
    const inTheatres = [];
    const upcoming = [];

    movies.forEach((m) => {
      const released = isMovieReleased(m);
      if (m.isAdminAdded || m.isCustom) {
        // Admin movie categorized strictly by release date
        if (released) {
          inTheatres.push(m);
        } else {
          upcoming.push(m);
        }
      } else {
        // TMDB movies categorized by category & release status
        if (m.category === "upcoming" && !released) {
          upcoming.push(m);
        } else {
          inTheatres.push(m);
        }
      }
    });

    // Sort: Admin-added movies always at the front of each section
    inTheatres.sort((a, b) => {
      const aAdmin = a.isAdminAdded || a.isCustom ? 1 : 0;
      const bAdmin = b.isAdminAdded || b.isCustom ? 1 : 0;
      if (aAdmin !== bAdmin) return bAdmin - aAdmin;
      return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
    });

    upcoming.sort((a, b) => {
      const aAdmin = a.isAdminAdded || a.isCustom ? 1 : 0;
      const bAdmin = b.isAdminAdded || b.isCustom ? 1 : 0;
      if (aAdmin !== bAdmin) return bAdmin - aAdmin;
      return new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0);
    });

    return { inTheatresList: inTheatres, upcomingList: upcoming };
  }, [movies]);

  // Common filter helper for search, genre, and language
  const filterMovieMatches = (m) => {
    const q = search.toLowerCase().trim();
    if (q) {
      const matchName = m.movieName?.toLowerCase().includes(q);
      const matchDesc = m.description?.toLowerCase().includes(q);
      const matchGenre = m.genres?.some((g) => g.toLowerCase().includes(q));
      const matchCast = m.cast?.some((c) => {
        const castName = typeof c === "string" ? c : c.name || "";
        return castName.toLowerCase().includes(q);
      });
      const matchDirector = m.director?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchGenre && !matchCast && !matchDirector) {
        return false;
      }
    }

    if (selectedGenre !== "All" && !m.genres?.includes(selectedGenre)) {
      return false;
    }

    if (selectedLanguage !== "All" && m.language?.toLowerCase() !== selectedLanguage.toLowerCase()) {
      return false;
    }

    return true;
  };

  const filteredInTheatres = useMemo(() => inTheatresList.filter(filterMovieMatches), [inTheatresList, search, selectedGenre, selectedLanguage]);
  const filteredUpcoming = useMemo(() => upcomingList.filter(filterMovieMatches), [upcomingList, search, selectedGenre, selectedLanguage]);

  // Featured Spotlight movie (placed from top in-theatres movie or first movie)
  const featuredMovie = inTheatresList[0] || movies[0];

  if (loading) {
    return <Loader message="Connecting to iMovies Box Office..." />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-[#76b900] font-semibold mb-2">Error loading titles</p>
        <p className="text-sm text-[#a1a1aa]">{error}</p>
      </div>
    );
  }

  // Render a movie card
  const renderMovieCard = (movie) => {
    const isAdmin = movie.isAdminAdded || movie.isCustom;
    const isUpcoming = !isMovieReleased(movie) || movie.category === "upcoming";

    return (
      <div
        key={movie._id}
        className={`group bg-[#121216] rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl flex flex-col justify-between ${
          isAdmin 
            ? "border-[#76b900]/60 hover:border-[#76b900] hover:shadow-[#76b900]/20" 
            : "border-[#27272a] hover:border-[#76b900]/70 hover:shadow-[#76b900]/10"
        }`}
      >
        {/* Poster Container */}
        <Link to={`/moviedetails/${movie._id}`} className="relative aspect-[2/3] overflow-hidden bg-[#18181f] block">
          <img
            src={movie.posterUrl}
            alt={movie.movieName}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Prominent Category Badge on Top Left */}
          <div className="absolute top-2 left-2 z-10">
            {isAdmin ? (
              <div className="px-2 py-0.5 rounded-md bg-[#76b900] text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-[#76b900]/30">
                <Star className="w-2.5 h-2.5 fill-slate-950" />
                <span>Admin Premiere</span>
              </div>
            ) : isUpcoming ? (
              <div className="px-2 py-0.5 rounded-md bg-amber-500/90 backdrop-blur-sm text-slate-950 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Clock className="w-2.5 h-2.5" />
                <span>Upcoming</span>
              </div>
            ) : (
              <div className="px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-[#27272a] text-[#76b900] text-[9px] font-bold uppercase tracking-wider">
                In Theatres
              </div>
            )}
          </div>

          {/* Rating badge on Top Right */}
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[#f59e0b] text-[10px] font-bold flex items-center gap-0.5 border border-[#f59e0b]/20 shadow-sm">
            <Star className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
            <span>{movie.rating}</span>
          </div>

          {/* Certification */}
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-[#18181f]/90 border border-[#27272a] text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm">
            {movie.certification || "U/A"}
          </div>
        </Link>

        {/* Info Container */}
        <div className="p-3 flex-1 flex flex-col justify-between">
          <div>
            <Link to={`/moviedetails/${movie._id}`}>
              <h3 
                className="font-bold text-xs sm:text-sm text-white group-hover:text-[#76b900] transition-colors truncate" 
                title={movie.movieName}
              >
                {movie.movieName}
              </h3>
            </Link>
            <p className="text-[10px] text-[#a1a1aa] mt-0.5 truncate">
              {movie.genres?.join(", ")}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-[#a1a1aa] mt-1.5 truncate">
              <span>{movie.duration}</span>
              <span>•</span>
              <span>{movie.language}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 pt-2 border-t border-[#27272a] flex items-center gap-1.5">
            <Link
              to={`/movieshows/${movie._id}`}
              className={`flex-1 py-1.5 px-2 rounded-lg text-slate-950 text-[11px] font-black text-center shadow-sm transition-all flex items-center justify-center gap-1 ${
                isAdmin 
                  ? "bg-[#76b900] hover:bg-[#8cd600] shadow-[#76b900]/30"
                  : isUpcoming
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                  : "bg-[#76b900] hover:bg-[#8cd600] shadow-[#76b900]/20"
              }`}
            >
              <Ticket className="w-3 h-3" />
              <span>{isUpcoming ? "Advance Tickets" : "Book Seats"}</span>
            </Link>
            <Link
              to={`/moviedetails/${movie._id}`}
              className="py-1.5 px-2 rounded-lg bg-[#18181f] hover:bg-[#27272a] border border-[#27272a] text-slate-300 text-[11px] font-semibold text-center transition-all"
            >
              Info
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 pb-20">
      
      {/* Featured Movie Spotlight Banner */}
      {featuredMovie && !search && selectedCategory === "All" && selectedGenre === "All" && (
        <section className="relative min-h-[480px] lg:h-[520px] flex items-end overflow-hidden border-b border-[#27272a]/60">
          <div className="absolute inset-0 z-0">
            <img
              src={featuredMovie.bannerUrl || featuredMovie.posterUrl}
              alt={featuredMovie.movieName}
              className="w-full h-full object-cover object-top opacity-35 filter saturate-110"
            />
            <div className="absolute inset-0 hero-backdrop-overlay bg-gradient-to-t from-[#000000] via-[#000000]/75 to-transparent" />
            <div className="absolute inset-0 hero-side-overlay bg-gradient-to-r from-[#000000] via-[#000000]/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
            <div className="max-w-2xl space-y-3">
              
              {/* Distinct Badge */}
              {featuredMovie.isAdminAdded || featuredMovie.isCustom ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#76b900]/20 text-[#76b900] border border-[#76b900]/40 text-xs font-black uppercase tracking-wider shadow-sm shadow-[#76b900]/30 animate-pulse">
                  <Star className="w-3.5 h-3.5 fill-[#76b900]" />
                  <span>Exclusive Admin Premiere</span>
                </div>
              ) : isMovieReleased(featuredMovie) ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#76b900]/15 text-[#76b900] border border-[#76b900]/30 text-xs font-bold uppercase tracking-wider">
                  <Film className="w-3.5 h-3.5" />
                  <span>Now Showing in Theatres</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Upcoming Theatrical Release</span>
                </div>
              )}

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                {featuredMovie.movieName}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
                <span className="flex items-center gap-1 font-bold text-[#f59e0b]">
                  <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                  {featuredMovie.rating} / 10
                </span>
                <span>•</span>
                <span>{featuredMovie.language}</span>
                <span>•</span>
                <span>{featuredMovie.duration}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-[#18181f] border border-[#27272a] text-xs font-bold text-slate-200">
                  {featuredMovie.certification || "U/A"}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#18181f] border border-[#27272a] text-xs font-bold text-[#76b900]">
                  4K • Dolby Atmos
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#a1a1aa] line-clamp-2 leading-relaxed max-w-xl">
                {featuredMovie.description}
              </p>

              {/* Action CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to={`/movieshows/${featuredMovie._id}`}
                  className="px-6 py-3 rounded-lg bg-[#76b900] hover:bg-[#8cd600] text-slate-950 font-black text-sm shadow-xl shadow-[#76b900]/25 flex items-center gap-2 hover:scale-105 transition-all"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Book Theatrical Tickets</span>
                </Link>

                <Link
                  to={`/moviedetails/${featuredMovie._id}`}
                  className="px-5 py-3 rounded-lg bg-[#18181f]/90 hover:bg-[#27272a] text-slate-200 border border-[#27272a] font-bold text-sm flex items-center gap-2 transition-all backdrop-blur-sm"
                >
                  <Play className="w-4 h-4 text-[#76b900]" />
                  <span>Movie Details & Trailer</span>
                </Link>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Main Content Explorer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Navigation Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              selectedCategory === "All"
                ? "bg-[#76b900] text-slate-950 font-black shadow-md shadow-[#76b900]/20"
                : "bg-[#121216] text-[#a1a1aa] hover:text-white border border-[#27272a]"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>All Catalog</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === "All" ? "bg-black/20 text-slate-950" : "bg-[#18181f] text-[#a1a1aa]"
            }`}>
              {movies.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory("now_playing")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              selectedCategory === "now_playing"
                ? "bg-[#76b900] text-slate-950 font-black shadow-md shadow-[#76b900]/20"
                : "bg-[#121216] text-[#a1a1aa] hover:text-white border border-[#27272a]"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Now in Theatres</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === "now_playing" ? "bg-black/20 text-slate-950" : "bg-[#18181f] text-[#a1a1aa]"
            }`}>
              {inTheatresList.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory("upcoming")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              selectedCategory === "upcoming"
                ? "bg-[#76b900] text-slate-950 font-black shadow-md shadow-[#76b900]/20"
                : "bg-[#121216] text-[#a1a1aa] hover:text-white border border-[#27272a]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Upcoming Releases</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === "upcoming" ? "bg-black/20 text-slate-950" : "bg-[#18181f] text-[#a1a1aa]"
            }`}>
              {upcomingList.length}
            </span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#121216] border border-[#27272a] rounded-2xl p-4 sm:p-5 mb-10 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search movies, actors, directors, genres..."
                className="w-full bg-[#18181f] border border-[#27272a] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#76b900] transition-colors"
              />
            </div>

            {/* Genre Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full bg-[#18181f] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#76b900] transition-colors"
              >
                {genresList.map((g) => (
                  <option key={g} value={g}>
                    {g === "All" ? "All Genres" : g}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-[#18181f] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#76b900] transition-colors"
              >
                {languagesList.map((l) => (
                  <option key={l} value={l}>
                    {l === "All" ? "All Languages" : l}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Quick Genre Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#27272a]">
            <span className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider mr-1">
              Top Genres:
            </span>
            {["All", "Action", "Adventure", "Sci-Fi", "Drama", "Animation"].map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  selectedGenre === genre
                    ? "bg-[#76b900] text-slate-950 shadow-sm shadow-[#76b900]/30 font-black"
                    : "bg-[#18181f] text-[#a1a1aa] hover:text-white border border-[#27272a]"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 1: MOVIES ALREADY IN THEATRES                          */}
        {/* ============================================================== */}
        {(selectedCategory === "All" || selectedCategory === "now_playing") && (
          <section className="mb-14">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-3 border-b border-[#27272a]">
              <div>
                <div className="flex items-center gap-2 text-[#76b900] font-bold text-xs uppercase tracking-widest mb-1">
                  <Film className="w-4 h-4" />
                  <span>Box Office Live Screenings</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                  <span>Now in Theatres</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#76b900]/20 text-[#76b900] border border-[#76b900]/30 font-bold">
                    {filteredInTheatres.length} Available
                  </span>
                </h2>
              </div>
              <p className="text-xs text-[#a1a1aa] mt-2 sm:mt-0">
                Released & screening with real-time seat reservation
              </p>
            </div>

            {filteredInTheatres.length === 0 ? (
              <div className="text-center py-12 bg-[#121216] rounded-2xl border border-[#27272a] p-6 mb-6">
                <Ticket className="w-10 h-10 text-[#a1a1aa] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-white">No In-Theatre titles match your filter criteria.</p>
                <p className="text-xs text-[#a1a1aa] mt-1">Try resetting the search or genre filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {filteredInTheatres.map(renderMovieCard)}
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* SECTION 2: UPCOMING THEATRICAL RELEASES                        */}
        {/* ============================================================== */}
        {(selectedCategory === "All" || selectedCategory === "upcoming") && (
          <section className="mb-14">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-3 border-b border-[#27272a]">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Advance Bookings & Trailers</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                  <span>Upcoming Movies</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    {filteredUpcoming.length} Titles
                  </span>
                </h2>
              </div>
              <p className="text-xs text-[#a1a1aa] mt-2 sm:mt-0">
                Future release dates • Explore trailers & advance bookings
              </p>
            </div>

            {filteredUpcoming.length === 0 ? (
              <div className="text-center py-12 bg-[#121216] rounded-2xl border border-[#27272a] p-6">
                <Clock className="w-10 h-10 text-[#a1a1aa] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-white">No upcoming titles match your filter criteria.</p>
                <p className="text-xs text-[#a1a1aa] mt-1">Try resetting the search or genre filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {filteredUpcoming.map(renderMovieCard)}
              </div>
            )}
          </section>
        )}

      </div>

    </div>
  );
};

export default Home;
