import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import dayjs from "dayjs";
import useFetch from "../hooks/useFetch";
import Loader from "../components/Loader";
import { isShowPast } from "../utils/dateTime";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  Ticket, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

const MovieShows = () => {
  const { movieId } = useParams();

  // Generate next 4 dates
  const availableDates = useMemo(() => {
    return [0, 1, 2, 3].map((offset) => {
      const d = dayjs().add(offset, "day");
      return {
        dateStr: d.format("YYYY-MM-DD"),
        dayName: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : d.format("ddd"),
        dayNumber: d.format("DD"),
        monthName: d.format("MMM"),
      };
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState(availableDates[0].dateStr);

  const { data, loading, error } = useFetch(`/shows/movie/${movieId}?date=${selectedDate}`);

  const movie = data?.movie;
  const shows = data?.shows || [];

  // Group shows by Theatre
  const showsByTheatre = useMemo(() => {
    const groups = {};
    shows.forEach((show) => {
      const tName = show.theatreName || "Multiplex Theatre";
      if (!groups[tName]) {
        groups[tName] = {
          theatreName: tName,
          theatreId: show.theatreId,
          shows: [],
        };
      }
      groups[tName].shows.push(show);
    });
    return Object.values(groups).map((group) => {
      const timeMap = new Map();
      group.shows.forEach((s) => {
        if (!timeMap.has(s.showTime)) {
          timeMap.set(s.showTime, s);
        } else if (timeMap.get(s.showTime).isPast && !s.isPast) {
          timeMap.set(s.showTime, s);
        }
      });
      return {
        ...group,
        shows: Array.from(timeMap.values()),
      };
    });
  }, [shows]);

  if (loading) {
    return <Loader message="Fetching available showtimes..." />;
  }

  const isToday = selectedDate === dayjs().format("YYYY-MM-DD");

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 pb-20">
      
      {/* Top Banner with Amazon Prime Styling */}
      <div className="bg-[#09090b] border-b border-[#27272a] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to={`/moviedetails/${movieId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a1a1aa] hover:text-[#ff6600] mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Movie Overview
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-bold text-[#ff6600] tracking-wider">
                  Theatrical Box Office
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {movie?.movieName || "Movie"} — Showtimes
              </h1>
              <p className="text-xs text-[#a1a1aa] mt-1">
                {movie?.language} • {movie?.duration} • {movie?.genres?.join(", ")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md bg-[#18181f] text-[#ff6600] border border-[#27272a] text-xs font-bold uppercase">
                {movie?.certification || "U/A"}
              </span>
              <span className="px-3 py-1 rounded-md bg-[#18181f] text-slate-300 border border-[#27272a] text-xs font-bold">
                Dolby Atmos
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Date Selector Pills */}
        <div className="bg-[#121216] border border-[#27272a] rounded-2xl p-4 mb-8 shadow-lg">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa] flex items-center gap-1.5 mr-2 flex-shrink-0">
              <Calendar className="w-4 h-4 text-[#ff6600]" />
              <span>Select Date:</span>
            </span>

            {availableDates.map((d) => {
              const isSelected = selectedDate === d.dateStr;
              return (
                <button
                  key={d.dateStr}
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[80px] py-2.5 px-4 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-[#ff6600] border-[#ff6600] text-slate-950 font-black shadow-lg shadow-[#ff6600]/30 scale-105"
                      : "bg-[#18181f] border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#ff6600]/50"
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-wider ${isSelected ? "text-slate-900 font-extrabold" : "text-[#a1a1aa]"}`}>
                    {d.dayName}
                  </span>
                  <span className="text-lg font-black leading-tight">{d.dayNumber}</span>
                  <span className={`text-[10px] font-medium ${isSelected ? "text-slate-900 font-bold" : "text-slate-400"}`}>
                    {d.monthName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#a1a1aa] mb-6 px-2">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff6600]"></span>
              Available
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span>
              Fast Filling
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-700"></span>
              Show Ended / Closed
            </span>
          </div>
          <span className="text-[#a1a1aa] italic hidden sm:inline">
            *Past showtimes for today are automatically closed and cannot be booked.
          </span>
        </div>

        {/* Theatres & Showtimes List */}
        {showsByTheatre.length === 0 ? (
          <div className="text-center py-16 bg-[#121216] rounded-2xl border border-[#27272a] p-8">
            <Clock className="w-12 h-12 text-[#a1a1aa] mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-white">No Shows Scheduled for this Date</h3>
            <p className="text-sm text-[#a1a1aa] mt-1 max-w-md mx-auto">
              Please choose another date from the selector above or check back shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {showsByTheatre.map((theatreGroup) => (
              <div
                key={theatreGroup.theatreName}
                className="bg-[#121216] border border-[#27272a] rounded-2xl p-6 shadow-md space-y-4 hover:border-[#223654] transition-colors"
              >
                {/* Theatre Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#27272a] pb-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {theatreGroup.theatreName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#a1a1aa]">
                      <span className="px-2 py-0.5 rounded bg-[#18181f] border border-[#27272a] text-primary font-semibold">
                        4K Laser
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#18181f] border border-[#27272a] text-amber-400 font-semibold">
                        Dolby Atmos 7.1
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#18181f] border border-[#27272a] text-slate-300">
                        Instant M-Ticket
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 self-start sm:self-auto">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Theatre
                  </span>
                </div>

                {/* Showtimes Pills */}
                <div>
                  <p className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">
                    Showtimes for {selectedDate}:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {theatreGroup.shows.map((show) => {
                      const isPast = show.isPast !== undefined ? show.isPast : isShowPast(show.showDate, show.showTime);

                      // If show is in the past: render disabled, non-clickable card
                      if (isPast) {
                        return (
                          <div
                            key={show.showId}
                            title="This show has already ended or started and cannot be booked."
                            className="px-5 py-3 rounded-xl bg-[#09090b] border border-slate-800/80 opacity-40 cursor-not-allowed flex flex-col items-center min-w-[110px] select-none"
                          >
                            <span className="text-sm font-semibold text-slate-400 line-through">
                              {show.showTime}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              From ₹{show.pricing?.lower || 150}
                            </span>
                            <span className="text-[9px] text-rose-400 uppercase font-bold tracking-wider mt-1">
                              Show Ended
                            </span>
                          </div>
                        );
                      }

                      // Upcoming active show: render clickable Prime cyan card
                      return (
                        <Link
                          key={show.showId}
                          to={`/seatslug/${show.showId}`}
                          className="group relative px-5 py-3 rounded-xl bg-[#18181f] border border-[#27272a] hover:border-[#ff6600] hover:bg-[#1a2b42] transition-all shadow-md flex flex-col items-center min-w-[110px]"
                        >
                          <span className="text-sm font-black text-slate-100 group-hover:text-[#ff6600] transition-colors">
                            {show.showTime}
                          </span>
                          <span className="text-[10px] text-[#a1a1aa] mt-0.5">
                            From ₹{show.pricing?.lower || 150}
                          </span>
                          <span className="text-[9px] text-[#ff6600] uppercase font-bold tracking-wider mt-1">
                            Select Seats
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};

export default MovieShows;
