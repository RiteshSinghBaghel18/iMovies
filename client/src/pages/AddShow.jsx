import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import api from "../utils/api";
import { Calendar, Clock, ArrowLeft, Plus, Sparkles, Film, MapPin, Tag } from "lucide-react";
import { toast } from "react-toastify";

const AddShow = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { data: moviesData } = useFetch("/movie");
  const { data: theatresData } = useFetch("/theatre");

  const movies = moviesData?.movies || [];
  const theatres = theatresData?.theatres || [];

  // Movie & Theatre
  const [movieId, setMovieId] = useState("");
  const [customMovieName, setCustomMovieName] = useState("");
  const [theatreId, setTheatreId] = useState("");
  const [customTheatreName, setCustomTheatreName] = useState("");

  // Date & User-Defined Showtime
  const [showDate, setShowDate] = useState(new Date().toISOString().split("T")[0]);
  const [showTime, setShowTime] = useState("07:15 PM");

  // Custom Pricing Overrides
  const [customBalconyPrice, setCustomBalconyPrice] = useState("");
  const [customMiddlePrice, setCustomMiddlePrice] = useState("");
  const [customLowerPrice, setCustomLowerPrice] = useState("");

  // Quick suggestion chips that populate the time input (user can still type ANY time)
  const quickTimeSuggestions = [
    "09:30 AM",
    "11:15 AM",
    "01:45 PM",
    "04:20 PM",
    "07:15 PM",
    "09:45 PM",
    "11:15 PM",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!movieId && !customMovieName.trim()) {
      toast.error("Please select an existing movie or enter a custom movie title.");
      return;
    }

    if (!theatreId && !customTheatreName.trim()) {
      toast.error("Please select a cinema theatre or enter a custom theatre name.");
      return;
    }

    if (!showTime.trim()) {
      toast.error("Please provide a valid show timing (e.g. 07:15 PM).");
      return;
    }

    // Format check for showTime (e.g., 07:15 PM)
    const timeRegex = /^\d{1,2}:\d{2}\s*(AM|PM)?$/i;
    if (!timeRegex.test(showTime.trim())) {
      toast.warn("Show time format recommended: e.g. 07:15 PM or 10:30 AM");
    }

    const selectedTheatre = theatres.find((t) => t.theatreId === theatreId || t._id === theatreId);
    const selectedMovie = movies.find((m) => m._id === movieId);

    setLoading(true);
    try {
      const payload = {
        movieId: movieId || (selectedMovie ? selectedMovie._id : "movie-" + Date.now().toString(36)),
        movieName: selectedMovie ? selectedMovie.movieName : customMovieName.trim(),
        theatreId: selectedTheatre ? selectedTheatre.theatreId : "th-" + Date.now().toString(36),
        theatreName: selectedTheatre ? selectedTheatre.theatreName : customTheatreName.trim(),
        showDate,
        showTime: showTime.trim(),
        pricing: {
          balcony: customBalconyPrice ? Number(customBalconyPrice) : selectedTheatre?.balconySeatPrice || 400,
          middle: customMiddlePrice ? Number(customMiddlePrice) : selectedTheatre?.middleSeatPrice || 280,
          lower: customLowerPrice ? Number(customLowerPrice) : selectedTheatre?.lowerSeatPrice || 180,
        },
      };

      const res = await api.post("/shows", payload);
      if (res.data.success) {
        toast.success("Showtime scheduled successfully with user-defined timing!");
        navigate("/admin");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule show.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 pb-20">
      
      {/* Top Banner */}
      <div className="bg-[#09090b] border-b border-[#27272a] py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a1a1aa] hover:text-[#ff6600] mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-[#ff6600]" />
            <h1 className="text-2xl font-bold text-white">Schedule Custom Showtime</h1>
          </div>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Specify any custom show timing, assign movies, locations, and seat tier pricing.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        <div className="bg-[#121216] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Movie selection / Custom definition */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Movie Selection *
              </label>
              <select
                value={movieId}
                onChange={(e) => {
                  setMovieId(e.target.value);
                  if (e.target.value) setCustomMovieName("");
                }}
                className="w-full bg-[#18181f] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff6600]"
              >
                <option value="">-- Select from Database Movies --</option>
                {movies.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.movieName} ({m.language}) — {m.duration}
                  </option>
                ))}
              </select>

              {!movieId && (
                <div className="pt-1">
                  <span className="text-[11px] text-[#a1a1aa]">Or enter custom movie title:</span>
                  <input
                    type="text"
                    value={customMovieName}
                    onChange={(e) => setCustomMovieName(e.target.value)}
                    placeholder="e.g. Dune: Part Three"
                    className="w-full mt-1 bg-[#18181f] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                  />
                </div>
              )}
            </div>

            {/* Theatre selection / Custom definition */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Cinema Theatre & Auditorium *
              </label>
              <select
                value={theatreId}
                onChange={(e) => {
                  setTheatreId(e.target.value);
                  if (e.target.value) setCustomTheatreName("");
                }}
                className="w-full bg-[#18181f] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff6600]"
              >
                <option value="">-- Select Registered Theatre --</option>
                {theatres.map((t) => (
                  <option key={t._id} value={t.theatreId}>
                    {t.theatreName} — {t.location}
                  </option>
                ))}
              </select>

              {!theatreId && (
                <div className="pt-1">
                  <span className="text-[11px] text-[#a1a1aa]">Or enter custom theatre location:</span>
                  <input
                    type="text"
                    value={customTheatreName}
                    onChange={(e) => setCustomTheatreName(e.target.value)}
                    placeholder="e.g. Cinema Royale - Screen 1"
                    className="w-full mt-1 bg-[#18181f] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                  />
                </div>
              )}
            </div>

            {/* Date and USER-DEFINED Showtime */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Show Date *
                </label>
                <input
                  type="date"
                  required
                  value={showDate}
                  onChange={(e) => setShowDate(e.target.value)}
                  className="w-full bg-[#18181f] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  User-Defined Show Timing *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={showTime}
                    onChange={(e) => setShowTime(e.target.value)}
                    placeholder="e.g. 01:15 PM or 08:30 PM"
                    className="w-full bg-[#18181f] border border-[#27272a] rounded-xl pl-10 pr-4 py-3 text-sm text-white font-semibold focus:outline-none focus:border-[#ff6600]"
                  />
                </div>
              </div>
            </div>

            {/* Quick Timing Suggestion Chips */}
            <div>
              <span className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider block mb-2">
                Quick Timing Presets (Click to insert or type custom):
              </span>
              <div className="flex flex-wrap gap-2">
                {quickTimeSuggestions.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setShowTime(time)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      showTime === time
                        ? "bg-[#ff6600] border-[#ff6600] text-slate-950 font-black shadow-md shadow-[#ff6600]/30"
                        : "bg-[#18181f] border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#ff6600]/50"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Seat Pricing Overrides */}
            <div className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] space-y-3">
              <span className="text-xs font-bold text-[#ff6600] uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Custom Tier Base Pricing (Optional Overrides)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[#a1a1aa] mb-1">Balcony (VIP) ₹</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Default (₹400)"
                    value={customBalconyPrice}
                    onChange={(e) => setCustomBalconyPrice(e.target.value)}
                    className="w-full bg-[#18181f] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#ff6600]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#a1a1aa] mb-1">Middle (Premium) ₹</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Default (₹280)"
                    value={customMiddlePrice}
                    onChange={(e) => setCustomMiddlePrice(e.target.value)}
                    className="w-full bg-[#18181f] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#ff6600]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#a1a1aa] mb-1">Lower (Standard) ₹</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Default (₹180)"
                    value={customLowerPrice}
                    onChange={(e) => setCustomLowerPrice(e.target.value)}
                    className="w-full bg-[#18181f] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#ff6600]"
                  />
                </div>
              </div>
            </div>

            {/* Submit & Cancel */}
            <div className="pt-4 border-t border-[#27272a] flex justify-end gap-3">
              <Link
                to="/admin"
                className="px-5 py-3 rounded-xl bg-[#18181f] hover:bg-[#3f3f46] border border-[#27272a] text-sm font-semibold text-slate-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff7700] text-slate-950 font-black text-sm shadow-lg shadow-[#ff6600]/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{loading ? "Scheduling..." : "Schedule Showtime"}</span>
              </button>
            </div>

          </form>

        </div>
      </div>

    </div>
  );
};

export default AddShow;
