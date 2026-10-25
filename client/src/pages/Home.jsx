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
  Compass
} from "lucide-react";

const Home = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All"); // "All" | "now_playing" | "upcoming" | "admin"
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");

  const { data, loading, error } = useFetch("/movie");

  const movies = data?.movies || [];

  // Distinct genres and languages
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

  // Counts for Category Pills
  const counts = useMemo(() => {
    const nowPlaying = movies.filter((m) => m.category === "now_playing" || m.isAdminAdded || m.isCustom).length;
    const upcoming = movies.filter((m) => m.category === "upcoming").length;
    const admin = movies.filter((m) => m.isAdminAdded || m.isCustom).length;
    return {
      all: movies.length,
      nowPlaying,
      upcoming,
      admin,
    };
  }, [movies]);

  // Filtered movies based on category, search, genre, language
  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      // 1. Search filter (in-memory matching; searches are strictly NOT logged or saved)
      const matchSearch =
        m.movieName?.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase()) ||
        m.genres?.some((g) => g.toLowerCase().includes(search.toLowerCase())) ||
        m.cast?.some((c) => c.toLowerCase().includes(search.toLowerCase())) ||
        m.director?.toLowerCase().includes(search.toLowerCase());

      // 2. Category tab filter
      let matchCategory = true;
      if (selectedCategory === "now_playing") {
        matchCategory = m.category === "now_playing" || m.isAdminAdded || m.isCustom;
      } else if (selectedCategory === "upcoming") {
        matchCategory = m.category === "upcoming";
      } else if (selectedCategory === "admin") {
        matchCategory = m.isAdminAdded || m.isCustom;
      }

      // 3. Genre filter
      const matchGenre = selectedGenre === "All" || m.genres?.includes(selectedGenre);

      // 4. Language filter
      const matchLang = selectedLanguage === "All" || m.language?.toLowerCase() === selectedLanguage.toLowerCase();

      return matchSearch && matchCategory && matchGenre && matchLang;
    });
  }, [movies, search, selectedCategory, selectedGenre, selectedLanguage]);

  // Featured Hero movie (top movie, which places Admin-added movies first)
  const featuredMovie = movies[0];

  if (loading) {
    return <Loader message="Connecting to iMovies Box Office..." />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-[#ff6600] font-semibold mb-2">Error loading titles</p>
        <p className="text-sm text-[#a1a1aa]">{error}</p>
      </div>
    );
  }

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
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#000000] via-[#000000]/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
            <div className="max-w-2xl space-y-3">
              
              {/* Distinct Badge based on movie type */}
              {featuredMovie.isAdminAdded || featuredMovie.isCustom ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/40 text-xs font-black uppercase tracking-wider shadow-sm shadow-[#ff6600]/30 animate-pulse">
                  <Star className="w-3.5 h-3.5 fill-[#ff6600]" />
                  <span>⭐ Exclusive Admin Premiere</span>
                </div>
              ) : featuredMovie.category === "upcoming" ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Upcoming Theatrical Release</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/30 text-xs font-bold uppercase tracking-wider">
                  <Film className="w-3.5 h-3.5" />
                  <span>Now Showing in Theatres</span>
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
                <span className="px-2 py-0.5 rounded bg-[#18181f] border border-[#27272a] text-xs font-bold text-[#ff6600]">
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
                  className="px-6 py-3 rounded-lg bg-[#ff6600] hover:bg-[#ff7700] text-slate-950 font-black text-sm shadow-xl shadow-[#ff6600]/25 flex items-center gap-2 hover:scale-105 transition-all"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Book Theatrical Tickets</span>
                </Link>

                <Link
                  to={`/moviedetails/${featuredMovie._id}`}
                  className="px-5 py-3 rounded-lg bg-[#18181f]/90 hover:bg-[#27272a] text-slate-200 border border-[#27272a] font-bold text-sm flex items-center gap-2 transition-all backdrop-blur-sm"
                >
                  <Play className="w-4 h-4 text-[#ff6600]" />
                  <span>Overview</span>
                </Link>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Navigation Tabs: Now Playing / Upcoming / Admin / All */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 border-b border-[#27272a] pb-4">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              selectedCategory === "All"
                ? "bg-[#ff6600] text-slate-950 font-black shadow-md shadow-[#ff6600]/20"
                : "bg-[#121216] text-[#a1a1aa] hover:text-white border border-[#27272a]"
            }`}
          >
            <span>All Catalog</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === "All" ? "bg-black/20 text-slate-950" : "bg-[#18181f] text-[#a1a1aa]"
            }`}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory("now_playing")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              selectedCategory === "now_playing"
                ? "bg-[#ff6600] text-slate-950 font-black shadow-md shadow-[#ff6600]/20"
                : "bg-[#121216] text-[#a1a1aa] hover:text-white border border-[#27272a]"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Now in Theatres</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === "now_playing" ? "bg-black/20 text-slate-950" : "bg-[#18181f] text-[#a1a1aa]"
            }`}>
              {counts.nowPlaying}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory("upcoming")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              selectedCategory === "upcoming"
                ? "bg-[#ff6600] text-slate-950 font-black shadow-md shadow-[#ff6600]/20"
                : "bg-[#121216] text-[#a1a1aa] hover:text-white border border-[#27272a]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Upcoming Releases</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === "upcoming" ? "bg-black/20 text-slate-950" : "bg-[#18181f] text-[#a1a1aa]"
            }`}>
              {counts.upcoming}
            </span>
          </button>

          {counts.admin > 0 && (
            <button
              onClick={() => setSelectedCategory("admin")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                selectedCategory === "admin"
                  ? "bg-[#ff6600] text-slate-950 font-black shadow-md shadow-[#ff6600]/20"
                  : "bg-[#121216] text-[#ff6600] hover:text-white border border-[#ff6600]/30"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-[#ff6600]" />
              <span>Admin Premieres</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                selectedCategory === "admin" ? "bg-black/20 text-slate-950" : "bg-[#ff6600]/20 text-[#ff6600]"
              }`}>
                {counts.admin}
              </span>
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#121216] border border-[#27272a] rounded-2xl p-4 sm:p-5 mb-8 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Search Input (In-memory, never stored or tracked) */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search titles, actors, genres..."
                className="w-full bg-[#18181f] border border-[#27272a] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#ff6600] transition-colors"
              />
            </div>

            {/* Genre Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full bg-[#18181f] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#ff6600] transition-colors"
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
                className="w-full bg-[#18181f] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#ff6600] transition-colors"
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
                    ? "bg-[#ff6600] text-slate-950 shadow-sm shadow-[#ff6600]/30 font-black"
                    : "bg-[#18181f] text-[#a1a1aa] hover:text-white border border-[#27272a]"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Section Heading */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              {selectedCategory === "upcoming" ? (
                <>
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>Upcoming Theatrical Releases</span>
                </>
              ) : selectedCategory === "admin" ? (
                <>
                  <Star className="w-5 h-5 text-[#ff6600] fill-[#ff6600]" />
                  <span>Admin Premieres & Features</span>
                </>
              ) : selectedCategory === "now_playing" ? (
                <>
                  <Film className="w-5 h-5 text-[#ff6600]" />
                  <span>Currently In Theatres</span>
                </>
              ) : (
                <>
                  <Film className="w-5 h-5 text-[#ff6600]" />
                  <span>Theatrical Releases & Upcoming</span>
                </>
              )}
            </h2>
            <p className="text-xs text-[#a1a1aa] mt-0.5">
              Showing {filteredMovies.length} title{filteredMovies.length === 1 ? "" : "s"} • Admin added movies prioritized at top
            </p>
          </div>
        </div>

        {/* Small, Compact Movies Grid (6 cols on xl, 5 cols on lg, 4 cols on md, 3 on sm, 2 on mobile) */}
        {filteredMovies.length === 0 ? (
          <div className="text-center py-20 bg-[#121216] rounded-2xl border border-[#27272a] p-8">
            <Ticket className="w-12 h-12 text-[#a1a1aa] mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-white">No Titles Found</h3>
            <p className="text-sm text-[#a1a1aa] mt-1 max-w-md mx-auto">
              No movies currently match your selected filters.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
                setSelectedGenre("All");
                setSelectedLanguage("All");
              }}
              className="mt-4 px-5 py-2.5 rounded-lg bg-[#ff6600] hover:bg-[#ff7700] text-slate-950 text-xs font-black"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredMovies.map((movie) => {
              const isAdmin = movie.isAdminAdded || movie.isCustom;
              const isUpcoming = movie.category === "upcoming";

              return (
                <div
                  key={movie._id}
                  className={`group bg-[#121216] rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl flex flex-col justify-between ${
                    isAdmin 
                      ? "border-[#ff6600]/60 hover:border-[#ff6600] hover:shadow-[#ff6600]/20" 
                      : "border-[#27272a] hover:border-[#ff6600]/70 hover:shadow-[#ff6600]/10"
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
                        <div className="px-2 py-0.5 rounded-md bg-[#ff6600] text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-[#ff6600]/30">
                          <Star className="w-2.5 h-2.5 fill-slate-950" />
                          <span>Admin Premiere</span>
                        </div>
                      ) : isUpcoming ? (
                        <div className="px-2 py-0.5 rounded-md bg-amber-500/90 backdrop-blur-sm text-slate-950 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Upcoming</span>
                        </div>
                      ) : (
                        <div className="px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-[#27272a] text-[#ff6600] text-[9px] font-bold uppercase tracking-wider">
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

                  {/* Compact Info Container */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <Link to={`/moviedetails/${movie._id}`}>
                        <h3 
                          className="font-bold text-xs sm:text-sm text-white group-hover:text-[#ff6600] transition-colors truncate" 
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

                    {/* Compact Actions */}
                    <div className="mt-3 pt-2 border-t border-[#27272a] flex items-center gap-1.5">
                      <Link
                        to={`/movieshows/${movie._id}`}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-slate-950 text-[11px] font-black text-center shadow-sm transition-all flex items-center justify-center gap-1 ${
                          isAdmin 
                            ? "bg-[#ff6600] hover:bg-[#ff7700] shadow-[#ff6600]/30"
                            : isUpcoming
                            ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                            : "bg-[#ff6600] hover:bg-[#ff7700] shadow-[#ff6600]/20"
                        }`}
                      >
                        <Ticket className="w-3 h-3" />
                        <span>{isUpcoming ? "Pre-Book" : "Book"}</span>
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
            })}
          </div>
        )}

      </div>

    </div>
  );
};

export default Home;
