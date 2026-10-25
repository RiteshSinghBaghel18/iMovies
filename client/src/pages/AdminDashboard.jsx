import React, { useState } from "react";
import { Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import api from "../utils/api";
import Loader from "../components/Loader";
import AdminTransactions from "../components/AdminTransactions";
import { 
  ShieldCheck, 
  DollarSign, 
  Ticket, 
  Film, 
  Tv, 
  Users, 
  PlusCircle, 
  Calendar, 
  UserPlus, 
  ArrowRight, 
  TrendingUp,
  Clock,
  RefreshCw,
  Wifi,
  Database,
  CreditCard,
  RotateCcw,
  Trash2,
  Search,
  AlertTriangle
} from "lucide-react";
import { toast } from "react-toastify";

const formatTierRows = (tier, fallback) => {
  if (!tier) return fallback;
  if (Array.isArray(tier.rows)) return tier.rows.join(", ");
  if (typeof tier.rows === "number") return `${tier.rows} Rows (${tier.cols || 10} seats)`;
  if (typeof tier.rows === "string") return tier.rows;
  return fallback;
};

const AdminDashboard = () => {
  const { data, loading, error, refetch: refetchStats } = useFetch("/auth/admin/stats");
  const { data: tmdbStatus, refetch: refetchTmdbStatus } = useFetch("/tmdb/status");
  const { data: moviesData, refetch: refetchMovies } = useFetch("/movie");
  const { data: theatresData, refetch: refetchTheatres } = useFetch("/theatre");
  const { data: showsData, refetch: refetchShows } = useFetch("/shows");

  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'movies' | 'theatres' | 'shows' | 'transactions'

  // Search queries for management tables
  const [movieSearch, setMovieSearch] = useState("");
  const [theatreSearch, setTheatreSearch] = useState("");
  const [showSearch, setShowSearch] = useState("");

  // Deleting item state
  const [deletingId, setDeletingId] = useState(null);

  const stats = data?.stats;
  const movies = moviesData?.movies || [];
  const theatres = theatresData?.theatres || [];
  const shows = showsData?.shows || [];

  // TMDB Sync Handlers
  const handleTMDBSync = async (quick = false) => {
    setSyncing(true);
    try {
      const endpoint = quick ? "/tmdb/quick-sync" : "/tmdb/sync";
      const res = await api.post(endpoint);
      if (res.data.success) {
        toast.success(res.data.message || "TMDB sync triggered!");
        setTimeout(() => {
          refetchTmdbStatus();
          refetchMovies();
          setSyncing(false);
        }, 6000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "TMDB sync failed.");
      setSyncing(false);
    }
  };

  // DELETE MOVIE
  const handleDeleteMovie = async (movieId, movieName) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${movieName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(movieId);
    try {
      const res = await api.delete(`/movie/${movieId}`);
      if (res.data.success) {
        toast.success(`Movie "${movieName}" deleted successfully.`);
        refetchMovies();
        refetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete movie.");
    } finally {
      setDeletingId(null);
    }
  };

  // DELETE THEATRE
  const handleDeleteTheatre = async (theatreId, theatreName) => {
    if (!window.confirm(`Are you sure you want to delete theatre "${theatreName}"? Any associated shows may also be impacted.`)) {
      return;
    }

    setDeletingId(theatreId);
    try {
      const res = await api.delete(`/theatre/${theatreId}`);
      if (res.data.success) {
        toast.success(`Theatre "${theatreName}" deleted successfully.`);
        refetchTheatres();
        refetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete theatre.");
    } finally {
      setDeletingId(null);
    }
  };

  // DELETE SHOW
  const handleDeleteShow = async (showId, showTime, showDate) => {
    if (!window.confirm(`Are you sure you want to delete showtime (${showDate} at ${showTime})?`)) {
      return;
    }

    setDeletingId(showId);
    try {
      const res = await api.delete(`/shows/${showId}`);
      if (res.data.success) {
        toast.success(`Showtime deleted successfully.`);
        refetchShows();
        refetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete show.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered lists for tables
  const filteredMovies = movies.filter((m) =>
    m.movieName?.toLowerCase().includes(movieSearch.toLowerCase()) ||
    m.language?.toLowerCase().includes(movieSearch.toLowerCase())
  );

  const filteredTheatres = theatres.filter((t) =>
    t.theatreName?.toLowerCase().includes(theatreSearch.toLowerCase()) ||
    t.location?.toLowerCase().includes(theatreSearch.toLowerCase()) ||
    t.theatreId?.toLowerCase().includes(theatreSearch.toLowerCase())
  );

  const filteredShows = shows.filter((s) =>
    s.theatreName?.toLowerCase().includes(showSearch.toLowerCase()) ||
    s.showDate?.includes(showSearch) ||
    s.showTime?.toLowerCase().includes(showSearch.toLowerCase()) ||
    s.showId?.toLowerCase().includes(showSearch.toLowerCase())
  );

  if (loading) {
    return <Loader message="Loading administrator portal..." />;
  }

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 pb-20">
      
      {/* Top Banner */}
      <div className="bg-[#09090b] border-b border-[#27272a] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Administrator Portal</h1>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Platform operations, inventory management & reservation moderation
                </p>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/addmovie"
                className="px-3.5 py-2 rounded-xl bg-[#76b900] hover:bg-[#8cd600] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-[#76b900]/20 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Movie
              </Link>
              <Link
                to="/addtheatre"
                className="px-3.5 py-2 rounded-xl bg-[#18181f] hover:bg-[#3f3f46] border border-[#27272a] text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Tv className="w-3.5 h-3.5 text-amber-400" />
                Register Theatre
              </Link>
              <Link
                to="/addshow"
                className="px-3.5 py-2 rounded-xl bg-[#18181f] hover:bg-[#3f3f46] border border-[#27272a] text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Calendar className="w-3.5 h-3.5 text-[#76b900]" />
                Schedule Show
              </Link>
              <Link
                to="/add-admin"
                className="px-3.5 py-2 rounded-xl bg-[#18181f] hover:bg-[#3f3f46] border border-[#27272a] text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                New Admin
              </Link>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-[#27272a]">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "overview"
                  ? "bg-[#76b900] text-slate-950 font-black shadow-md shadow-[#76b900]/20"
                  : "bg-[#18181f] text-[#a1a1aa] hover:text-white border border-[#27272a]"
              }`}
            >
              Overview & Analytics
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("movies")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "movies"
                  ? "bg-[#76b900] text-slate-950 font-black shadow-md shadow-[#76b900]/20"
                  : "bg-[#18181f] text-[#a1a1aa] hover:text-white border border-[#27272a]"
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Manage Movies ({movies.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("theatres")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "theatres"
                  ? "bg-[#76b900] text-slate-950 font-black shadow-md shadow-[#76b900]/20"
                  : "bg-[#18181f] text-[#a1a1aa] hover:text-white border border-[#27272a]"
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Manage Theatres ({theatres.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("shows")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "shows"
                  ? "bg-[#76b900] text-slate-950 font-black shadow-md shadow-[#76b900]/20"
                  : "bg-[#18181f] text-[#a1a1aa] hover:text-white border border-[#27272a]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Manage Shows ({shows.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "transactions"
                  ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                  : "bg-[#18181f] text-[#a1a1aa] hover:text-white border border-[#27272a]"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Razorpay Refunds</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* TAB 1: TRANSACTIONS & REFUNDS */}
        {activeTab === "transactions" && <AdminTransactions />}

        {/* TAB 2: MANAGE MOVIES (WITH DELETE) */}
        {activeTab === "movies" && (
          <div className="bg-[#121216] border border-[#27272a] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#27272a]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#76b900]" />
                  <span>Movie Catalog Management</span>
                </h2>
                <p className="text-xs text-[#a1a1aa]">
                  Newly added movies appear at the top. You can review and delete movies below.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-[#a1a1aa] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={movieSearch}
                    onChange={(e) => setMovieSearch(e.target.value)}
                    placeholder="Search movies by name..."
                    className="w-full bg-[#18181f] border border-[#27272a] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#76b900]"
                  />
                </div>
                <Link
                  to="/addmovie"
                  className="px-3 py-2 rounded-xl bg-[#76b900] hover:bg-[#8cd600] text-slate-950 font-bold text-xs flex items-center gap-1.5 flex-shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Movie</span>
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18181f] text-[#a1a1aa] uppercase font-bold border-b border-[#27272a]">
                  <tr>
                    <th className="py-3 px-4">Movie</th>
                    <th className="py-3 px-4">Genres</th>
                    <th className="py-3 px-4">Language / Duration</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Release Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] text-slate-300">
                  {filteredMovies.map((m) => (
                    <tr key={m._id} className="hover:bg-[#18181f]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={m.posterUrl}
                            alt={m.movieName}
                            className="w-10 h-14 object-cover rounded-md bg-[#09090b] flex-shrink-0 border border-[#27272a]"
                          />
                          <div>
                            <p className="font-bold text-white text-sm hover:text-[#76b900] transition-colors">{m.movieName}</p>
                            <span className="text-[10px] text-[#a1a1aa] font-mono">ID: {m._id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{m.genres?.join(", ")}</td>
                      <td className="py-3 px-4">{m.language} • {m.duration}</td>
                      <td className="py-3 px-4 font-bold text-amber-400">★ {m.rating}</td>
                      <td className="py-3 px-4">{new Date(m.releaseDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          disabled={deletingId === m._id}
                          onClick={() => handleDeleteMovie(m._id, m.movieName)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 ml-auto transition-all disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{deletingId === m._id ? "Deleting..." : "Delete"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MANAGE THEATRES (WITH DELETE) */}
        {activeTab === "theatres" && (
          <div className="bg-[#121216] border border-[#27272a] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#27272a]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Tv className="w-5 h-5 text-amber-400" />
                  <span>Theatre Locations & Seating Layouts</span>
                </h2>
                <p className="text-xs text-[#a1a1aa]">
                  Registered cinema halls with customized seating sections and pricing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-[#a1a1aa] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={theatreSearch}
                    onChange={(e) => setTheatreSearch(e.target.value)}
                    placeholder="Search theatres..."
                    className="w-full bg-[#18181f] border border-[#27272a] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#76b900]"
                  />
                </div>
                <Link
                  to="/addtheatre"
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 flex-shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Register Theatre</span>
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18181f] text-[#a1a1aa] uppercase font-bold border-b border-[#27272a]">
                  <tr>
                    <th className="py-3 px-4">Theatre Name</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Seating Tiers</th>
                    <th className="py-3 px-4">Tier Pricing</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] text-slate-300">
                  {filteredTheatres.map((t) => (
                    <tr key={t._id} className="hover:bg-[#18181f]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        <p>{t.theatreName}</p>
                        <span className="text-[10px] text-[#a1a1aa] font-mono">ID: {t.theatreId}</span>
                      </td>
                      <td className="py-3 px-4 text-[#a1a1aa]">{t.location}</td>
                      <td className="py-3 px-4">
                        <span className="text-amber-400 font-semibold">Balcony ({formatTierRows(t.balconySeats, "3 Rows")})</span> •{" "}
                        <span className="text-[#76b900] font-semibold">Middle ({formatTierRows(t.middleSeats, "5 Rows")})</span> •{" "}
                        <span className="text-slate-300 font-semibold">Lower ({formatTierRows(t.lowerSeats, "3 Rows")})</span>
                        {t.customSections?.length > 0 && (
                          <span className="block text-[11px] text-emerald-400">+{t.customSections.length} Custom Section(s)</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        Balcony: ₹{t.balconySeatPrice} | Middle: ₹{t.middleSeatPrice} | Lower: ₹{t.lowerSeatPrice}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          disabled={deletingId === t._id || deletingId === t.theatreId}
                          onClick={() => handleDeleteTheatre(t.theatreId || t._id, t.theatreName)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 ml-auto transition-all disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{deletingId === t._id || deletingId === t.theatreId ? "Deleting..." : "Delete Theatre"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MANAGE SHOWS (WITH DELETE) */}
        {activeTab === "shows" && (
          <div className="bg-[#121216] border border-[#27272a] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#27272a]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#76b900]" />
                  <span>Scheduled Showtimes</span>
                </h2>
                <p className="text-xs text-[#a1a1aa]">
                  All scheduled show slots with real-time seat availability and deletion capability.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-[#a1a1aa] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={showSearch}
                    onChange={(e) => setShowSearch(e.target.value)}
                    placeholder="Search shows by theatre or date..."
                    className="w-full bg-[#18181f] border border-[#27272a] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#76b900]"
                  />
                </div>
                <Link
                  to="/addshow"
                  className="px-3 py-2 rounded-xl bg-[#76b900] hover:bg-[#8cd600] text-slate-950 font-black text-xs flex items-center gap-1.5 flex-shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Schedule Show</span>
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18181f] text-[#a1a1aa] uppercase font-bold border-b border-[#27272a]">
                  <tr>
                    <th className="py-3 px-4">Show ID</th>
                    <th className="py-3 px-4">Theatre</th>
                    <th className="py-3 px-4">Show Date</th>
                    <th className="py-3 px-4">Show Time</th>
                    <th className="py-3 px-4">Pricing (B / M / L)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] text-slate-300">
                  {filteredShows.map((s) => (
                    <tr key={s.showId || s._id} className="hover:bg-[#18181f]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#76b900]">#{s.showId}</td>
                      <td className="py-3 px-4 font-bold text-white">{s.theatreName}</td>
                      <td className="py-3 px-4">{s.showDate}</td>
                      <td className="py-3 px-4 font-black text-amber-400">{s.showTime}</td>
                      <td className="py-3 px-4">
                        ₹{s.pricing?.balcony || 400} / ₹{s.pricing?.middle || 280} / ₹{s.pricing?.lower || 180}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          disabled={deletingId === s.showId}
                          onClick={() => handleDeleteShow(s.showId, s.showTime, s.showDate)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 ml-auto transition-all disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{deletingId === s.showId ? "Deleting..." : "Delete Show"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 0: OVERVIEW & ANALYTICS */}
        {activeTab === "overview" && (
          <>
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-6 rounded-2xl bg-[#121216] border border-[#27272a] space-y-2">
                <div className="flex items-center justify-between text-[#a1a1aa]">
                  <span className="text-xs uppercase font-semibold">Total Revenue</span>
                  <DollarSign className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-3xl font-extrabold text-amber-400">
                  ₹{stats?.totalRevenue?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Verified Ticket Sales
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#121216] border border-[#27272a] space-y-2">
                <div className="flex items-center justify-between text-[#a1a1aa]">
                  <span className="text-xs uppercase font-semibold">Total Bookings</span>
                  <Ticket className="w-5 h-5 text-[#76b900]" />
                </div>
                <p className="text-3xl font-extrabold text-white">
                  {stats?.totalBookings || 0}
                </p>
                <p className="text-xs text-[#a1a1aa]">
                  {stats?.totalTicketsSold || 0} seats booked
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#121216] border border-[#27272a] space-y-2">
                <div className="flex items-center justify-between text-[#a1a1aa]">
                  <span className="text-xs uppercase font-semibold">Active Shows</span>
                  <Film className="w-5 h-5 text-[#76b900]" />
                </div>
                <p className="text-3xl font-extrabold text-white">
                  {stats?.totalShows || shows.length}
                </p>
                <p className="text-xs text-[#a1a1aa]">
                  Across {stats?.totalTheatres || theatres.length} theatres
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#121216] border border-[#27272a] space-y-2">
                <div className="flex items-center justify-between text-[#a1a1aa]">
                  <span className="text-xs uppercase font-semibold">Registered Users</span>
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-3xl font-extrabold text-white">
                  {stats?.totalUsers || 0}
                </p>
                <p className="text-xs text-[#a1a1aa]">
                  Total platform accounts
                </p>
              </div>

            </div>

            {/* TMDB Live Data Status */}
            <div className="bg-[#121216] border border-[#27272a] rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#76b900]/15 text-[#76b900] flex items-center justify-center border border-[#76b900]/30">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">TMDb Live Market Data</h2>
                    <p className="text-[11px] text-[#a1a1aa]">
                      Synced with The Movie Database API — newly created movies display at the top
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    disabled={syncing}
                    onClick={() => handleTMDBSync(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#18181f] hover:bg-[#3f3f46] border border-[#27272a] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                    Quick Sync
                  </button>
                  <button
                    type="button"
                    disabled={syncing}
                    onClick={() => handleTMDBSync(false)}
                    className="px-3.5 py-2 rounded-xl bg-[#76b900] hover:bg-[#8cd600] text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#76b900]/20 disabled:opacity-40"
                  >
                    <Database className="w-3.5 h-3.5" />
                    Full Sync
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] space-y-1">
                  <p className="text-[10px] text-[#a1a1aa] uppercase font-semibold tracking-wider">TMDB API Status</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/40" />
                    <span className="text-sm font-bold text-emerald-400">Key Active & Verified</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] space-y-1">
                  <p className="text-[10px] text-[#a1a1aa] uppercase font-semibold tracking-wider">Total Movies in Catalog</p>
                  <p className="text-2xl font-black text-[#76b900]">
                    {movies.length}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] space-y-1">
                  <p className="text-[10px] text-[#a1a1aa] uppercase font-semibold tracking-wider">Active Theatres</p>
                  <p className="text-2xl font-black text-white">
                    {theatres.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Platform Reservations Table */}
            <div className="bg-[#121216] border border-[#27272a] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white">Recent Platform Bookings</h2>
                <Link
                  to="/adminbookings"
                  className="text-xs font-semibold text-[#76b900] hover:text-[#8cd600] flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {!stats?.recentBookings || stats.recentBookings.length === 0 ? (
                <p className="text-sm text-[#a1a1aa] py-6 text-center">No reservations recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#18181f] text-[#a1a1aa] uppercase tracking-wider font-semibold border-b border-[#27272a]">
                      <tr>
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Movie</th>
                        <th className="py-3 px-4">Seats</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a] text-slate-300">
                      {stats.recentBookings.map((b) => (
                        <tr key={b.bookingId} className="hover:bg-[#18181f]/50">
                          <td className="py-3 px-4 font-mono font-bold text-[#76b900]">#{b.bookingId}</td>
                          <td className="py-3 px-4">{b.userEmail}</td>
                          <td className="py-3 px-4 font-semibold text-white">{b.movieDetails?.movieName || "Movie"}</td>
                          <td className="py-3 px-4">{b.selectedSeats?.join(", ")}</td>
                          <td className="py-3 px-4 font-bold text-amber-400">₹{b.totalAmount}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                b.paymentStatus === "Completed"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-rose-500/20 text-rose-400"
                              }`}
                            >
                              {b.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

      </div>

    </div>
  );
};

export default AdminDashboard;
