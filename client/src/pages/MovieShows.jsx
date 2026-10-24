import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import { api } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';
import { isShowExpired, formatDisplayTime } from '../utils/showTimeHelper';
import dayjs from 'dayjs';

function MovieShows() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate next 7 days for tab selection
  const next7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const d = dayjs().add(index, 'day');
      return {
        dateString: d.format('YYYY-MM-DD'),
        dayName: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : d.format('ddd'),
        displayDate: d.format('D MMM'),
      };
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState(next7Days[0].dateString);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [movieRes, showsRes] = await Promise.allSettled([
          api.getMovieById(movieId),
          api.getShowsByMovieId(movieId),
        ]);

        if (movieRes.status === 'fulfilled') {
          const mData = movieRes.value.data;
          setMovie(mData?.movie || mData?.data || mData);
        }

        if (showsRes.status === 'fulfilled') {
          const sData = showsRes.value.data;
          const sList = Array.isArray(sData) ? sData : sData?.shows || sData?.data || [];
          setShows(sList);
        }
      } catch (err) {
        console.error('Error fetching shows:', err);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchData();
    }
  }, [movieId]);

  // Filter shows matching selected date
  const filteredShows = useMemo(() => {
    return shows.filter((s) => {
      if (!s.showDate) return false;
      const formattedShowDate = dayjs(s.showDate).format('YYYY-MM-DD');
      return formattedShowDate === selectedDate;
    });
  }, [shows, selectedDate]);

  // Track dates that have scheduled shows
  const datesWithShows = useMemo(() => {
    return [...new Set(shows.map((s) => dayjs(s.showDate).format('YYYY-MM-DD')))].filter(Boolean);
  }, [shows]);

  // Check if all showtimes for currently selected date have passed
  const allSlotsExpiredForDate = useMemo(() => {
    if (filteredShows.length === 0) return false;
    return filteredShows.every((s) => isShowExpired(s.showDate, s.showTime) || s.isExpired);
  }, [filteredShows]);

  // Group shows by Theatre — shows store theatreId as UUID string, theatreName as string
  const groupedByTheatre = useMemo(() => {
    const map = {};
    filteredShows.forEach((show) => {
      const groupKey = show.theatreName || show.theatreId || 'unknown-theatre';
      if (!map[groupKey]) {
        map[groupKey] = {
          theatreName: show.theatreName || 'Cinema',
          location: show.location || 'City Centre',
          theatre: {},   // will be populated below if available
          shows: [],
        };
      }
      map[groupKey].shows.push(show);
    });
    return Object.values(map);
  }, [filteredShows]);

  if (loading) return <Loader />;

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-[#000000] text-white' : 'bg-white text-zinc-900'}`}>
      <Header />

      {/* Movie Subheader */}
      <div className={`border-b py-6 px-4 sm:px-6 lg:px-8 transition-colors ${isDark ? 'bg-[#121216] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/moviedetails/${movieId}`}
              className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:border-primary/50 transition"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {movie?.movieName || 'Movie Shows'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                <span>{movie?.language || 'All Languages'}</span>
                <span>•</span>
                <span>{movie?.duration || '120 mins'}</span>
                {movie?.certification && (
                  <>
                    <span>•</span>
                    <span className="text-primary font-semibold">{movie.certification}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Link
            to={`/moviedetails/${movieId}`}
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 self-start sm:self-center"
          >
            <span>View Movie Synopsis</span>
            <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </div>

      {/* Date Selector Tabs */}
      <div className="bg-[#09090b] border-b border-zinc-800 sticky top-16 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
            {next7Days.map((dayItem) => {
              const isSelected = selectedDate === dayItem.dateString;
              return (
                <button
                  key={dayItem.dateString}
                  onClick={() => setSelectedDate(dayItem.dateString)}
                  className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl text-center min-w-[80px] transition-all flex-shrink-0 ${
                    isSelected
                      ? 'bg-primary text-white shadow-lg shadow-orange-950/60 scale-105 font-bold'
                      : 'bg-[#0a0a0a] text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    {dayItem.dayName}
                  </span>
                  <span className="text-sm font-bold mt-0.5">{dayItem.displayDate}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Showtimes Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {groupedByTheatre.length === 0 ? (
          <div className="text-center py-16 bg-[#121216] rounded-2xl border border-zinc-800 max-w-lg mx-auto p-8 shadow-2xl">
            <div className="text-5xl mb-3">🎟️</div>
            <h3 className="text-xl font-bold text-white mb-2">No Showtimes for {dayjs(selectedDate).format('MMMM D, YYYY')}</h3>
            <p className="text-zinc-400 text-sm mb-6">
              {datesWithShows.length > 0
                ? 'Screenings are currently available on the dates below. Select any date to view auditoriums:'
                : 'There are currently no active screening schedules for this title. Please check back soon or choose another movie.'}
            </p>
            {datesWithShows.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {datesWithShows.slice(0, 5).map((dStr) => (
                  <button
                    key={dStr}
                    onClick={() => setSelectedDate(dStr)}
                    className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-primary hover:bg-primary hover:text-black transition flex items-center gap-1.5"
                  >
                    <i className="fa-regular fa-calendar text-[11px]"></i>
                    <span>{dayjs(dStr).format('ddd, D MMM')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* All Slots Expired Banner */}
            {allSlotsExpiredForDate && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-clock-rotate-left text-primary text-sm"></i>
                  <span>All showtimes scheduled for today ({dayjs(selectedDate).format('MMM D')}) have already concluded.</span>
                </div>
                {next7Days[1] && (
                  <button
                    onClick={() => setSelectedDate(next7Days[1].dateString)}
                    className="px-3 py-1.5 bg-primary text-black font-black rounded-lg hover:bg-orange-500 transition self-start sm:self-auto flex items-center gap-1.5"
                  >
                    <span>View Tomorrow&apos;s Shows ({next7Days[1].displayDate})</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                )}
              </div>
            )}

            {/* Theatre & Showtime Availability Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                  Available Theatres for {dayjs(selectedDate).format('MMMM D, YYYY')} ({groupedByTheatre.length} {groupedByTheatre.length === 1 ? 'Cinema' : 'Cinemas'})
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active Booking
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-600"></span> Passed Slot
                </span>
              </div>
            </div>

            {groupedByTheatre.map((group, idx) => (
              <div
                key={idx}
                className="bg-card rounded-2xl border border-gray-800 p-6 shadow-xl hover:border-gray-700 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-5 border-b border-gray-800/80 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-building text-primary"></i>
                      <h3 className="text-xl font-bold text-white">{group.theatreName}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <i className="fa-solid fa-location-dot text-gray-500"></i>
                      {group.location}
                    </p>
                  </div>

                  {/* Pricing Tiers Preview */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                    {(group.theatre?.balconySeatPrice || group.shows[0]?.balconyPrice) && (
                      <span className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300">
                        <strong className="text-primary">Balcony:</strong> ₹
                        {group.theatre?.balconySeatPrice || group.shows[0]?.balconyPrice}
                      </span>
                    )}
                    {(group.theatre?.middleSeatPrice || group.shows[0]?.middlePrice) && (
                      <span className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300">
                        <strong className="text-primary">Middle:</strong> ₹
                        {group.theatre?.middleSeatPrice || group.shows[0]?.middlePrice}
                      </span>
                    )}
                    {(group.theatre?.lowerSeatPrice || group.shows[0]?.lowerPrice) && (
                      <span className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300">
                        <strong className="text-primary">Lower:</strong> ₹
                        {group.theatre?.lowerSeatPrice || group.shows[0]?.lowerPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* Showtimes Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {group.shows.map((show) => {
                    const showId = show.showId || show._id || show.id;
                    const isExpired = isShowExpired(show.showDate, show.showTime) || show.isExpired;
                    const displayTime = formatDisplayTime(show.showTime || '18:00');

                    if (isExpired) {
                      return (
                        <div
                          key={showId}
                          className="bg-[#0e0e12] border border-zinc-800/80 rounded-xl p-3 flex flex-col justify-between opacity-55 cursor-not-allowed select-none transition-all"
                          title={`Showtime at ${displayTime} has already concluded for today`}
                        >
                          <div className="text-center">
                            <span className="text-base font-bold text-zinc-500 line-through block">
                              {displayTime}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-semibold inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-zinc-800/90 border border-zinc-700/60">
                              <i className="fa-regular fa-clock text-[9px] text-zinc-400"></i> Passed
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled
                            className="w-full mt-3 py-1.5 px-2 bg-zinc-800/80 text-zinc-400 text-xs font-bold rounded-lg cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            <i className="fa-solid fa-ban text-[10px]"></i>
                            <span>Show Closed</span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={showId}
                        className="bg-zinc-900 border border-zinc-800 hover:border-primary rounded-xl p-3 flex flex-col justify-between group transition-all shadow-md hover:shadow-orange-950/40"
                      >
                        <div className="text-center">
                          <span className="text-lg font-black text-white group-hover:text-primary transition-colors block">
                            {displayTime}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Available
                          </span>
                        </div>

                        <button
                          onClick={() => navigate(`/seatslug/${showId}`)}
                          className="w-full mt-3 py-1.5 px-2 bg-primary hover:bg-orange-500 text-black text-xs font-black rounded-lg transition duration-200 flex items-center justify-center gap-1 shadow-sm"
                        >
                          <span>Select Seats</span>
                          <i className="fa-solid fa-chevron-right text-[10px]"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default MovieShows;
