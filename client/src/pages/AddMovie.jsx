import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/Loader';
import { api } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';
import dayjs from 'dayjs';

const AVAILABLE_GENRES = [
  'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi',
  'Romance', 'Thriller', 'Animation', 'Adventure', 'Fantasy', 'Mystery', 'Family',
];

const CERTIFICATIONS = ['U', 'U/A', 'A', 'S'];
const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'Korean', 'Japanese', 'Tamil', 'Telugu'];
const CAST_ROLES = [
  'Lead Actor', 'Lead Actress', 'Supporting Actor', 'Supporting Actress',
  'Villain', 'Director', 'Producer', 'Composer', 'Cinematographer',
  'Mentor', 'Antagonist', 'Child Actor', 'Cameo',
];

function AddMovie() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    movieName: '',
    description: '',
    releaseDate: '',
    language: 'English',
    duration: '',
    certification: 'U/A',
    posterUrl: '',
    trailerUrl: '',
  });

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [castList, setCastList] = useState([{ name: '', role: 'Lead Actor', profileUrl: '' }]);
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const [fetchingMovies, setFetchingMovies] = useState(true);
  const [posterPreviewError, setPosterPreviewError] = useState(false);

  const inputCls = `w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition ${
    isDark
      ? 'bg-gray-900 border border-gray-700 text-white placeholder-gray-500'
      : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

  const labelCls = `block text-xs font-semibold uppercase tracking-wider mb-2 ${
    isDark ? 'text-gray-300' : 'text-gray-600'
  }`;

  const cardCls = `rounded-2xl border p-6 sm:p-8 shadow-xl ${
    isDark ? 'bg-[#111827] border-gray-800' : 'bg-white border-gray-200'
  }`;

  const fetchMovies = async () => {
    try {
      setFetchingMovies(true);
      const res = await api.getAllMovies();
      const list = Array.isArray(res.data) ? res.data : res.data?.movies || res.data?.data || [];
      setMovies(list);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingMovies(false);
    }
  };

  useEffect(() => { fetchMovies(); }, []);

  // Reset poster preview error when URL changes
  useEffect(() => { setPosterPreviewError(false); }, [formData.posterUrl]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenreToggle = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleCastChange = (index, field, value) => {
    const updated = [...castList];
    updated[index][field] = value;
    setCastList(updated);
  };

  const addCastMember = () => {
    setCastList([...castList, { name: '', role: 'Supporting Actor', profileUrl: '' }]);
  };

  const removeCastMember = (index) => {
    if (castList.length > 1) {
      setCastList(castList.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.movieName.trim()) { toast.error('Movie title is required'); return; }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters'); return;
    }
    if (selectedGenres.length === 0) { toast.error('Please select at least one genre'); return; }
    if (!formData.duration.trim()) { toast.error('Duration is required'); return; }

    try {
      setLoading(true);
      // Filter out empty cast entries and ensure objects
      const validCast = castList
        .filter((c) => c.name.trim() !== '')
        .map((c) => ({
          name: c.name.trim(),
          role: c.role || 'Cast',
          profileUrl: c.profileUrl ? c.profileUrl.trim() : ''
        }));

      const payload = {
        ...formData,
        genres: selectedGenres,
        cast: validCast,
      };

      const res = await api.addMovie(payload);
      if (res.data?.success || res.status === 200 || res.status === 201) {
        toast.success(`🎬 Movie "${formData.movieName}" added successfully!`);
        setFormData({
          movieName: '', description: '', releaseDate: '',
          language: 'English', duration: '', certification: 'U/A',
          posterUrl: '', trailerUrl: '',
        });
        setSelectedGenres([]);
        setCastList([{ name: '', role: 'Lead Actor' }]);
        fetchMovies();
      } else {
        toast.error(res.data?.message || 'Failed to add movie');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating movie entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = async (movieId, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteMovie(movieId);
      toast.success('Movie deleted');
      setMovies(movies.filter((m) => (m._id || m.id) !== movieId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete movie');
    }
  };

  const hasPosterPreview = formData.posterUrl && !posterPreviewError;

  return (
    <DashboardLayout activePage="/addmovie">
      <div className="space-y-10">
        {/* Page Heading */}
        <div className={`border-b pb-5 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <span className="text-primary">🎬</span> Add New Movie
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
            Register films with posters, metadata, release schedules, and cast credits.
          </p>
        </div>

        {/* ─── Main Form ──────────────────────────────────────────────── */}
        <div className={cardCls}>
          <form onSubmit={handleSubmit} className="space-y-7">

            {/* ── Poster Preview Side Panel + Basic Info ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Live Poster Preview */}
              <div className="lg:col-span-3">
                <label className={labelCls}>Poster Preview</label>
                <div className={`w-full aspect-[2/3] rounded-xl overflow-hidden border flex items-center justify-center relative ${
                  isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-100'
                }`}>
                  {hasPosterPreview ? (
                    <img
                      src={formData.posterUrl}
                      alt="Poster preview"
                      className="w-full h-full object-cover"
                      onError={() => setPosterPreviewError(true)}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <div className="text-4xl mb-2 opacity-30">🎬</div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {formData.posterUrl ? 'Image failed to load' : 'Paste poster URL below to preview'}
                      </p>
                      {formData.posterUrl && posterPreviewError && (
                        <p className="text-[10px] text-primary mt-1">Try a direct image link (.jpg, .png)</p>
                      )}
                    </div>
                  )}
                  {/* Status badge overlay */}
                  {hasPosterPreview && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-bold bg-primary text-black rounded">
                      ✓ Preview OK
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Core Details */}
              <div className="lg:col-span-9 space-y-5">
                {/* Title + Language */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <label className={labelCls}>Movie Title *</label>
                    <input type="text" name="movieName" required value={formData.movieName}
                      onChange={handleChange} placeholder="e.g. Oppenheimer" className={inputCls} />
                  </div>
                  <div className="md:col-span-4">
                    <label className={labelCls}>Language</label>
                    <select name="language" value={formData.language} onChange={handleChange} className={inputCls}>
                      {LANGUAGES.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={labelCls}>Movie Synopsis / Description *</label>
                  <textarea name="description" rows={4} value={formData.description} onChange={handleChange}
                    placeholder="Brief plot outline, synopsis, or background details (min 10 characters)..."
                    className={inputCls} required minLength={10} />
                </div>

                {/* Release Date + Duration + Certification */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Release Date</label>
                    <input type="date" name="releaseDate" value={formData.releaseDate}
                      onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Duration *</label>
                    <input type="text" name="duration" value={formData.duration} onChange={handleChange}
                      placeholder="e.g. 2h 30m" required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Certification</label>
                    <select name="certification" value={formData.certification}
                      onChange={handleChange} className={inputCls}>
                      {CERTIFICATIONS.map((cert) => <option key={cert} value={cert}>{cert}</option>)}
                    </select>
                  </div>
                </div>

                {/* Poster URL + Trailer URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Poster Image URL</label>
                    <input type="text" name="posterUrl" value={formData.posterUrl} onChange={handleChange}
                      placeholder="Poster Image"
                      className={inputCls} />
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Use a direct image link (not a webpage URL). Preview appears on the left.
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>Trailer URL</label>
                    <input type="text" name="trailerUrl" value={formData.trailerUrl} onChange={handleChange}
                      placeholder="https://www.youtube.com/watch?v=..." className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Genres ────────────────────────────────────── */}
            <div className={`pt-5 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <label className={labelCls}>Genres * <span className="normal-case font-normal text-gray-500">(select at least one)</span></label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_GENRES.map((g) => {
                  const isSelected = selectedGenres.includes(g);
                  return (
                    <button type="button" key={g} onClick={() => handleGenreToggle(g)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-primary text-black font-black shadow-md border border-orange-500'
                          : isDark
                          ? 'bg-gray-900 text-gray-400 border border-gray-700 hover:text-white hover:border-gray-500'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:text-gray-900 hover:border-gray-400'
                      }`}
                    >
                      {g} {isSelected && <i className="fa-solid fa-check text-[10px]"></i>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Cast & Crew ───────────────────────────────── */}
            <div className={`pt-5 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className={labelCls}>Cast &amp; Crew</label>
                  <p className={`text-[11px] -mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Add actors, directors, and crew with their roles.
                  </p>
                </div>
                <button type="button" onClick={addCastMember}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                    isDark
                      ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                  }`}
                >
                  <i className="fa-solid fa-plus text-[10px]"></i> Add Member
                </button>
              </div>

              <div className="space-y-3">
                {castList.map((member, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isDark ? 'bg-gray-900/60 border-gray-800' : 'bg-gray-50 border-gray-200'
                  }`}>
                    {/* Avatar initial */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff6600] to-[#ffa333] flex items-center justify-center text-sm font-black text-black flex-shrink-0">
                      {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                    </div>

                    {/* Name input */}
                    <input
                      type="text"
                      placeholder="Name (e.g. Leonardo DiCaprio)"
                      value={member.name}
                      onChange={(e) => handleCastChange(idx, 'name', e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                        isDark
                          ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />

                    {/* Role dropdown */}
                    <select
                      value={member.role}
                      onChange={(e) => handleCastChange(idx, 'role', e.target.value)}
                      className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                        isDark
                          ? 'bg-gray-800 border border-gray-700 text-white'
                          : 'bg-white border border-gray-300 text-gray-900'
                      }`}
                    >
                      {CAST_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>

                    {/* Optional Photo URL */}
                    <input
                      type="url"
                      placeholder="Photo URL (optional)"
                      value={member.profileUrl || ''}
                      onChange={(e) => handleCastChange(idx, 'profileUrl', e.target.value)}
                      className={`w-36 hidden sm:block px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                        isDark
                          ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />

                    {/* Remove */}
                    {castList.length > 1 && (
                      <button type="button" onClick={() => removeCastMember(idx)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/20 transition flex-shrink-0"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Submit ─────────────────────────────────────── */}
            <div className={`pt-5 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <button type="submit" disabled={loading}
                className="px-8 py-3.5 bg-primary hover:bg-orange-500 text-black font-black rounded-xl shadow-lg shadow-orange-950/40 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving Movie...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-film"></i>
                    <span>Create &amp; Publish Movie</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ─── Existing Movies Catalog ─────────────────────────────── */}
        <div className={cardCls}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-film text-primary"></i>
              Movie Catalog ({movies.length})
            </h2>
          </div>

          {fetchingMovies ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Loading catalog...
            </div>
          ) : movies.length === 0 ? (
            <div className={`text-center py-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-sm">No movies added yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {movies.map((m) => {
                const mId = m._id || m.id;
                return (
                  <div
                    key={mId}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                      isDark
                        ? 'bg-gray-900/70 border-gray-800 hover:border-gray-700'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 overflow-hidden">
                      {/* Poster thumb */}
                      <div className="w-12 h-16 rounded-lg flex-shrink-0 overflow-hidden bg-gray-800 border border-gray-700">
                        {m.posterUrl ? (
                          <img src={m.posterUrl} alt={m.movieName}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display='none'; }}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg opacity-30">🎬</div>
                        )}
                      </div>

                      <div className="truncate">
                        <h4 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {m.movieName}
                        </h4>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {m.language || 'English'} • {m.duration || 'N/A'}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(m.genres || []).slice(0, 2).map((g, i) => (
                            <span key={i} className={`px-1.5 py-0.5 text-[9px] uppercase font-semibold rounded ${
                              isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
                            }`}>{g}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button onClick={() => handleDeleteMovie(mId, m.movieName)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/20 rounded-lg transition flex-shrink-0"
                      title="Delete movie"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
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

export default AddMovie;
