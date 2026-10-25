import React from "react";
import { Link } from "react-router-dom";
import { 
  Film, 
  Sparkles, 
  Ticket, 
  Clock, 
  ShieldCheck, 
  Tv, 
  Flame, 
  ArrowRight,
  Star
} from "lucide-react";
import useFetch from "../hooks/useFetch";
import { isUpcomingMovie } from "../utils/movieCategory";

const Landing = () => {
  const { data } = useFetch("/movie");
  const allMovies = data?.movies || [];

  const inTheatresMovies = allMovies.filter((m) => !isUpcomingMovie(m)).slice(0, 4);
  const upcomingMovies = allMovies.filter((m) => isUpcomingMovie(m)).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 flex flex-col">
      
      {/* Hero Visual Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-[#27272a]/60">
        
        {/* Dynamic Backdrop Background with Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1920&q=80"
            alt="Cinema Hero Backdrop"
            className="w-full h-full object-cover opacity-25 scale-105 filter blur-[1px]"
          />
          <div className="absolute inset-0 hero-backdrop-overlay bg-gradient-to-t from-[#000000] via-[#000000]/80 to-transparent" />
          <div className="absolute inset-0 hero-side-overlay bg-gradient-to-r from-[#000000] via-[#000000]/70 to-[#000000]" />
          {/* Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[320px] bg-[#76b900]/15 rounded-full blur-[140px] pointer-events-none" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#76b900]/15 border border-[#76b900]/30 text-[#76b900] text-xs font-bold tracking-wide uppercase mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Cinema & Box Office</span>
          </div>

          {/* Main Title */}
          <h1 className="landing-hero-title text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-tight sm:leading-tight">
            Welcome to <span className="text-[#76b900]">iMovies</span>
          </h1>

          {/* Description */}
          <p className="landing-hero-desc mt-6 text-lg sm:text-xl text-[#a1a1aa] max-w-3xl mx-auto font-normal leading-relaxed">
            Your ultimate destination for the latest blockbusters and timeless classics. Real-time seat locking, instant digital passes, and IMAX luxury at your fingertips.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/home"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#76b900] hover:bg-[#8cd600] text-slate-950 font-black text-base shadow-xl shadow-[#76b900]/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              <span>Explore Now Showing</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#18181f] hover:bg-[#3f3f46] text-slate-200 border border-[#27272a] hover:border-[#76b900]/50 font-bold text-base transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In to Account</span>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-[#27272a] max-w-2xl mx-auto">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">100%</p>
              <p className="text-xs text-[#a1a1aa] mt-1 uppercase tracking-wider">Live Seat Sync</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#76b900]">10 Min</p>
              <p className="text-xs text-[#a1a1aa] mt-1 uppercase tracking-wider">TTL Seat Hold</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">Instant</p>
              <p className="text-xs text-[#a1a1aa] mt-1 uppercase tracking-wider">Digital Passes</p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 1: NOW IN THEATRES SHOWCASE */}
      {inTheatresMovies.length > 0 && (
        <section className="py-16 bg-[#000000] border-b border-[#27272a]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 text-[#76b900] font-bold text-xs uppercase tracking-widest mb-1">
                  <Film className="w-4 h-4" />
                  <span>Now Showing</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                  Currently in Theatres
                </h2>
              </div>
              <Link
                to="/home"
                className="mt-4 md:mt-0 text-sm font-semibold text-[#76b900] hover:text-[#8cd600] flex items-center gap-1.5 transition-colors"
              >
                <span>View all in theatres</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {inTheatresMovies.map((movie) => (
                <Link
                  key={movie._id}
                  to={`/moviedetails/${movie._id}`}
                  className="group bg-[#121216] rounded-xl overflow-hidden border border-[#27272a] hover:border-[#76b900]/70 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-[#76b900]/10 flex flex-col"
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-[#18181f]">
                    <img
                      src={movie.posterUrl}
                      alt={movie.movieName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/75 backdrop-blur-md text-[#f59e0b] text-xs font-bold flex items-center gap-1 border border-[#f59e0b]/20">
                      <Star className="w-3.5 h-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                      <span>{movie.rating}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-[#18181f] text-white text-[10px] font-bold uppercase tracking-wider border border-[#27272a]">
                      {movie.certification || "U/A"}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-[#76b900] transition-colors line-clamp-1">
                        {movie.movieName}
                      </h3>
                      <p className="text-xs text-[#a1a1aa] mt-1 line-clamp-1">
                        {movie.genres?.join(", ")} • {movie.duration}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#27272a] flex items-center justify-between text-xs">
                      <span className="text-[#a1a1aa]">{movie.language}</span>
                      <span className="text-[#76b900] font-bold group-hover:translate-x-1 transition-transform">
                        Book Seats →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: UPCOMING THEATRICAL RELEASES SHOWCASE */}
      {upcomingMovies.length > 0 && (
        <section className="py-16 bg-[#000000] border-b border-[#27272a]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Coming Soon</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                  Upcoming Theatrical Blockbusters
                </h2>
              </div>
              <Link
                to="/home"
                className="mt-4 md:mt-0 text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
              >
                <span>Explore all upcoming</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingMovies.map((movie) => (
                <Link
                  key={movie._id}
                  to={`/moviedetails/${movie._id}`}
                  className="group bg-[#121216] rounded-xl overflow-hidden border border-[#27272a] hover:border-amber-400/70 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-amber-500/10 flex flex-col"
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-[#18181f]">
                    <img
                      src={movie.posterUrl}
                      alt={movie.movieName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/75 backdrop-blur-md text-amber-400 text-xs font-bold flex items-center gap-1 border border-amber-500/20">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(movie.releaseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                      Upcoming
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {movie.movieName}
                      </h3>
                      <p className="text-xs text-[#a1a1aa] mt-1 line-clamp-1">
                        {movie.genres?.join(", ")} • {movie.language}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#27272a] flex items-center justify-between text-xs">
                      <span className="text-[#a1a1aa]">{movie.language}</span>
                      <span className="text-amber-400 font-bold group-hover:translate-x-1 transition-transform">
                        Explore Info →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose iMovies Highlights */}
      <section className="py-20 landing-feature-gradient bg-gradient-to-b from-[#000000] to-[#09090b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white">
              Engineered For Movie Lovers
            </h2>
            <p className="text-[#a1a1aa] mt-3 text-sm">
              We took everything frustrating about movie ticketing and made it effortless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-[#121216] border border-[#27272a] hover:border-[#76b900]/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#76b900]/15 text-[#76b900] flex items-center justify-center mb-6 border border-[#76b900]/30">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Live Seat Locking</h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Pick your seats with zero rush. Seats are automatically locked for 10 minutes via our real-time WebSocket TTL engine.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#121216] border border-[#27272a] hover:border-[#76b900]/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-6 border border-amber-500/30">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">IMAX & Tier Seating</h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Choose between VIP Balcony, Premium Middle, and Standard Lower rows with crystal-clear interactive seating maps.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#121216] border border-[#27272a] hover:border-[#76b900]/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Digital Pass & Alerts</h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Instant QR e-tickets and automated showtime email reminders so you never miss the opening trailers.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Landing;
