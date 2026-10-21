import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/Loader';
import { api } from '../utils/api';
import dayjs from 'dayjs';

function AddShow() {
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);

  const [formData, setFormData] = useState({
    movieId: '',
    theatreId: '',
    showDate: dayjs().format('YYYY-MM-DD'),
    showTime: '18:00',
    ticketPrice: 250,
  });

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      setDataLoading(true);
      const [moviesRes, theatresRes, showsRes] = await Promise.allSettled([
        api.getAllMovies(),
        api.getAllTheatres(),
        api.getAllShows(),
      ]);

      if (moviesRes.status === 'fulfilled') {
        const m = moviesRes.value.data;
        const mList = Array.isArray(m) ? m : m?.movies || m?.data || [];
        setMovies(mList);
        if (mList.length > 0 && !formData.movieId) {
          setFormData((prev) => ({ ...prev, movieId: mList[0]._id || mList[0].id }));
        }
      }

      if (theatresRes.status === 'fulfilled') {
        const t = theatresRes.value.data;
        const tList = Array.isArray(t) ? t : t?.theatres || t?.data || [];
        setTheatres(tList);
        if (tList.length > 0 && !formData.theatreId) {
          setFormData((prev) => ({ ...prev, theatreId: tList[0]._id || tList[0].theatreId || tList[0].id }));
        }
      }

      if (showsRes.status === 'fulfilled') {
        const s = showsRes.value.data;
        const sList = Array.isArray(s) ? s : s?.shows || s?.data || [];
        setShows(sList);
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.movieId || !formData.theatreId || !formData.showDate || !formData.showTime) {
      toast.error('All required fields must be completed');
      return;
    }

    try {
      setLoading(true);
      const res = await api.addShow({
        ...formData,
        ticketPrice: Number(formData.ticketPrice) || 250
      });
      if (res.data?.success || res.status === 200 || res.status === 201) {
        toast.success(res.data?.message || 'Showtime scheduled successfully!');
        fetchAllData();
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
    if (!window.confirm('Are you sure you want to delete this show?')) return;

    try {
      await api.deleteShow(showId);
      toast.success('Show deleted successfully');
      setShows(shows.filter((s) => (s.showId || s._id || s.id) !== showId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete show');
    }
  };

  if (dataLoading) return <Loader />;

  return (
    <DashboardLayout activePage="/addshow">
      <div className="space-y-8">
        <div className="border-b border-white/10 pb-4">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="text-primary">🎭</span>
            Schedule New Show
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Pair registered blockbusters with theater auditoriums, screening dates, time slots, and pricing.
          </p>
        </div>

        {/* Schedule Form */}
        <div className="bg-[#121216] rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Movie Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Select Movie *
                </label>
                <select
                  name="movieId"
                  required
                  value={formData.movieId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-primary text-sm"
                >
                  {movies.length === 0 ? (
                    <option value="">No movies available (Add one first)</option>
                  ) : (
                    movies.map((m) => (
                      <option key={m._id || m.id} value={m._id || m.id}>
                        {m.movieName} ({m.language || 'Cinema'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Theatre Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Select Theatre *
                </label>
                <select
                  name="theatreId"
                  required
                  value={formData.theatreId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary text-sm"
                >
                  {theatres.length === 0 ? (
                    <option value="">No theatres available (Add one first)</option>
                  ) : (
                    theatres.map((t) => (
                      <option key={t._id || t.theatreId || t.id} value={t._id || t.theatreId || t.id}>
                        {t.theatreName} — {t.location}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Show Date */}
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
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary text-sm"
                />
              </div>

              {/* Show Time */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Screening Time *
                </label>
                <input
                  type="time"
                  name="showTime"
                  required
                  value={formData.showTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary text-sm"
                />
              </div>

              {/* Ticket Price */}
              <div className="md:col-span-2">
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
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary text-sm"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Balcony tier is calculated at ~140% and Lower tier at ~70% based on this base rate unless customized by theatre defaults.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={loading || movies.length === 0 || theatres.length === 0}
                className="px-8 py-3 bg-primary hover:bg-[#ff7700] text-black font-black rounded-none shadow-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Scheduling Show...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-calendar-plus"></i>
                    <span>Publish Showtime</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Shows List */}
        <div className="bg-[#121216] rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <i className="fa-solid fa-list text-primary"></i>
            Scheduled Shows ({shows.length})
          </h2>

          {shows.length === 0 ? (
            <p className="text-sm text-zinc-500 italic py-4">No shows scheduled yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shows.slice(0, 30).map((s) => {
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
