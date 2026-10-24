import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/Loader';
import { api } from '../utils/api';
import { formatDisplayTime } from '../utils/showTimeHelper';
import dayjs from 'dayjs';

const PRESET_TIMES = ['10:30 AM', '01:00 PM', '04:15 PM', '07:30 PM', '10:15 PM'];

function AddShow() {
  const [searchParams] = useSearchParams();
  const initialMovieId = searchParams.get('movieId') || '';

  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [movieShows, setMovieShows] = useState([]);
  const [loadingMovieShows, setLoadingMovieShows] = useState(false);

  const [formData, setFormData] = useState({
    movieId: initialMovieId,
    theatreId: '',
    showDate: dayjs().format('YYYY-MM-DD'),
    showTime: '07:30 PM',
    ticketPrice: 250,
    scheduleFullWeek: false,
  });

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch currently assigned shows for the selected movie
  const fetchShowsForSelectedMovie = async (mId) => {
    if (!mId) {
      setMovieShows([]);
      return;
    }
    try {
      setLoadingMovieShows(true);
      const res = await api.getShowsByMovieId(mId);
      const list = Array.isArray(res.data) ? res.data : res.data?.shows || res.data?.data || [];
      setMovieShows(list);
    } catch (err) {
      console.warn('Notice fetching shows for movie:', err);
    } finally {
      setLoadingMovieShows(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setDataLoading(true);
      const [moviesRes, theatresRes] = await Promise.allSettled([
        api.getAllMovies(),
        api.getAllTheatres(),
      ]);

      let selectedMid = formData.movieId;

      if (moviesRes.status === 'fulfilled') {
        const m = moviesRes.value.data;
        const mList = Array.isArray(m) ? m : m?.movies || m?.data || [];
        setMovies(mList);
        if (mList.length > 0 && !selectedMid) {
          selectedMid = mList[0]._id || mList[0].id;
          setFormData((prev) => ({ ...prev, movieId: selectedMid }));
        }
      }

      if (theatresRes.status === 'fulfilled') {
        const t = theatresRes.value.data;
        const tList = Array.isArray(t) ? t : t?.theatres || t?.data || [];
        setTheatres(tList);
        if (tList.length > 0 && !formData.theatreId) {
          setFormData((prev) => ({ ...prev, theatreId: tList[0].theatreId || tList[0]._id || tList[0].id }));
        }
      }

      if (selectedMid) {
        fetchShowsForSelectedMovie(selectedMid);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleMovieChange = (e) => {
    const newMid = e.target.value;
    setFormData((prev) => ({ ...prev, movieId: newMid }));
    fetchShowsForSelectedMovie(newMid);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePresetTimeSelect = (timeStr) => {
    setFormData((prev) => ({ ...prev, showTime: timeStr }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.movieId || !formData.theatreId || !formData.showDate || !formData.showTime) {
      toast.error('All required fields must be completed');
      return;
    }

    try {
      setLoading(true);
      const normalizedTime = formatDisplayTime(formData.showTime);
      const payload = {
        movieId: formData.movieId,
        theatreId: formData.theatreId,
        showDate: formData.showDate,
        showTime: normalizedTime,
        ticketPrice: Number(formData.ticketPrice) || 250,
        days: formData.scheduleFullWeek ? 7 : 1,
      };

      const res = await api.addShow(payload);
      if (res.data?.success || res.status === 200 || res.status === 201) {
        toast.success(res.data?.message || 'Showtime(s) scheduled successfully!');
        fetchShowsForSelectedMovie(formData.movieId);
      } else {
        toast.error(res.data?.message || 'Failed to add show');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error scheduling show');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShow = async (showId) => {
    if (!window.confirm('Are you sure you want to delete this showtime?')) return;

    try {
      await api.deleteShow(showId);
      toast.success('Show deleted successfully');
      setShows((prev) => prev.filter((s) => (s.showId || s._id || s.id) !== showId));
      setMovieShows((prev) => prev.filter((s) => (s.showId || s._id || s.id) !== showId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete show');
    }
  };

  // Group shows of currently selected movie by Theatre for crystal-clear visual assignment feedback
  const movieTheatresGrouped = useMemo(() => {
    const map = {};
    movieShows.forEach((s) => {
      const key = s.theatreName || s.theatreId || 'Auditorium';
      if (!map[key]) {
        map[key] = {
          theatreName: s.theatreName || 'Partner Cinema',
          location: s.location || 'City Centre',
          shows: [],
        };
      }
      map[key].shows.push(s);
    });
    return Object.values(map);
  }, [movieShows]);

  const selectedMovie = movies.find((m) => (m._id || m.id) === formData.movieId);

  if (dataLoading) return <Loader />;

  return (
    <DashboardLayout activePage="/addshow">
      <div className="space-y-8">
        <div className="border-b border-white/10 pb-4">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="text-primary">🎭</span>
            Schedule &amp; Assign Theatres
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Pair admin-added movies and blockbusters with partner theatres, screening dates, time slots, and seat tiers.
          </p>
        </div>

        {/* ─── Schedule Form ─── */}
        <div className="bg-[#121216] rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Movie Dropdown */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Select Movie *</span>
                  {selectedMovie?.isAdminAdded && (
                    <span className="text-[11px] text-primary font-bold">⭐ Admin Added Title</span>
                  )}
                </label>
                <select
                  name="movieId"
                  required
                  value={formData.movieId}
                  onChange={handleMovieChange}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-primary text-sm font-medium"
                >
                  {movies.length === 0 ? (
                    <option value="">No movies available (Add one first)</option>
                  ) : (
                    movies.map((m) => (
                      <option key={m._id || m.id} value={m._id || m.id}>
                        {m.isAdminAdded ? '⭐ ' : ''}
                        {m.movieName} ({m.language || 'Cinema'})
                        {m.isAdminAdded ? ' [Admin Added]' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Theatre Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Assign Theatre *
                </label>
                <select
                  name="theatreId"
                  required
                  value={formData.theatreId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-primary text-sm"
                >
                  <option value="all">✨ ALL Available Partner Theatres (Simultaneous Screening)</option>
                  {theatres.map((t) => (
                    <option key={t._id || t.theatreId || t.id} value={t.theatreId || t._id || t.id}>
                      {t.theatreName} — {t.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Screening Date */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Screening Date *
                </label>
                <input
                  type="date"
                  name="showDate"
                  required
                  value={formData.showDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-primary text-sm"
                />
              </div>

              {/* Show Time */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Screening Time *
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs text-zinc-400 mr-1">Quick Presets:</span>
                  {PRESET_TIMES.map((timePreset) => (
                    <button
                      type="button"
                      key={timePreset}
                      onClick={() => handlePresetTimeSelect(timePreset)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition border ${
                        formData.showTime === timePreset
                          ? 'bg-primary text-black border-orange-500 font-black'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      {timePreset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  name="showTime"
                  required
                  value={formData.showTime}
                  onChange={handleChange}
                  placeholder="e.g. 07:30 PM or 19:30"
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-primary text-sm"
                />
              </div>

              {/* Ticket Price */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Standard Ticket Price (₹) *
                </label>
                <input
                  type="number"
                  name="ticketPrice"
                  min="50"
                  max="5000"
                  required
                  value={formData.ticketPrice}
                  onChange={handleChange}
                  placeholder="250"
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-primary text-sm"
                />
              </div>

              {/* Schedule Full Week Checkbox */}
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="scheduleFullWeek"
                  name="scheduleFullWeek"
                  checked={formData.scheduleFullWeek}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-zinc-700 bg-zinc-900"
                />
                <label htmlFor="scheduleFullWeek" className="text-sm font-semibold text-zinc-200 cursor-pointer">
                  Schedule across next 7 days (Full Week Run)
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                type="submit"
                disabled={loading || movies.length === 0 || theatres.length === 0}
                className="px-8 py-3.5 bg-primary hover:bg-[#ff7700] text-black font-black shadow-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Scheduling &amp; Assigning Theatres...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-calendar-plus"></i>
                    <span>Assign &amp; Publish Showtime</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ─── Assigned Theatres Panel for Selected Movie ─── */}
        <div className="bg-[#121216] rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-zinc-800 gap-2">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-building text-primary"></i>
                Theatres Assigned to: <span className="text-primary">{selectedMovie?.movieName || 'Selected Movie'}</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Auditoriums actively screening this film. Shows are immediately bookable on the user booking page.
              </p>
            </div>
            <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-300">
              {movieTheatresGrouped.length} Partner {movieTheatresGrouped.length === 1 ? 'Theatre' : 'Theatres'} Assigned
            </span>
          </div>

          {loadingMovieShows ? (
            <div className="py-8 text-center text-zinc-400 text-sm flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>Checking assigned theatres...</span>
            </div>
          ) : movieTheatresGrouped.length === 0 ? (
            <div className="py-8 text-center bg-[#0a0a0a] rounded-xl border border-zinc-800/80 p-6">
              <span className="text-3xl block mb-2">🎟️</span>
              <p className="text-sm text-zinc-400 font-semibold">No theatres assigned to this movie yet.</p>
              <p className="text-xs text-zinc-500 mt-1">
                Select a theatre and showtime above, then click &quot;Assign &amp; Publish Showtime&quot; to schedule screenings!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {movieTheatresGrouped.map((group, gIdx) => (
                <div key={gIdx} className="p-4 rounded-xl bg-[#0a0a0a] border border-zinc-800/80">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        <i className="fa-solid fa-film text-primary text-xs"></i>
                        {group.theatreName}
                      </h4>
                      <p className="text-xs text-zinc-400">{group.location}</p>
                    </div>
                    <span className="text-xs text-primary font-mono font-bold bg-primary/10 border border-primary/30 px-2.5 py-1 rounded">
                      {group.shows.length} {group.shows.length === 1 ? 'Slot' : 'Slots'} Scheduled
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-900">
                    {group.shows.slice(0, 16).map((s) => {
                      const sId = s.showId || s._id || s.id;
                      return (
                        <div
                          key={sId}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-2.5 text-xs text-zinc-300"
                        >
                          <span className="font-mono text-white font-semibold">
                            {dayjs(s.showDate).format('MMM D')} • {s.showTime}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteShow(sId)}
                            className="text-zinc-500 hover:text-red-400 transition"
                            title="Remove this slot"
                          >
                            <i className="fa-solid fa-xmark text-[11px]"></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Global Scheduled Shows List ─── */}
        <div className="bg-[#121216] rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <i className="fa-solid fa-list text-primary"></i>
            Global Scheduled Shows ({shows.length})
          </h2>

          {shows.length === 0 ? (
            <p className="text-sm text-zinc-500 italic py-4">No shows scheduled yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shows.slice(0, 24).map((s) => {
                const sId = s.showId || s._id || s.id;
                const movieName = s.movieId?.movieName || s.movieName || 'Movie Feature';
                const theatreName = s.theatreId?.theatreName || s.theatreName || 'Cineplex';
                return (
                  <div
                    key={sId}
                    className="p-4 rounded-xl bg-[#0a0a0a] border border-zinc-800 flex items-center justify-between gap-4 hover:border-primary/40 transition"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white line-clamp-1">{movieName}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{theatreName}</p>
                      <div className="flex items-center gap-2 text-xs text-primary font-mono font-semibold mt-1">
                        <span>{dayjs(s.showDate).format('MMM D, YYYY')}</span>
                        <span>•</span>
                        <span>{s.showTime}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteShow(sId)}
                      className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/20 rounded-lg transition"
                      title="Delete show"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AddShow;
