import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { Film, ArrowLeft, Plus, Check } from "lucide-react";
import { toast } from "react-toastify";

const AddMovie = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    movieName: "",
    description: "",
    genres: "Action, Adventure, Sci-Fi",
    releaseDate: new Date().toISOString().split("T")[0],
    language: "English",
    duration: "2h 30m",
    certification: "U/A",
    posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80",
    trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    cast: "Lead Actor 1, Lead Actor 2",
    director: "Visionary Director",
    rating: "8.5",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.movieName || !formData.description) {
      toast.error("Please fill in required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/movie", formData);
      if (res.data.success) {
        toast.success("Movie listing added successfully!");
        navigate("/admin");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add movie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cinema-darkest text-slate-100 pb-20">
      
      {/* Top Header */}
      <div className="bg-cinema-card border-b border-cinema-border/60 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <Film className="w-6 h-6 text-red-500" />
            <h1 className="text-2xl font-bold text-white">Add New Movie Listing</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <div className="bg-cinema-card border border-cinema-border rounded-2xl p-6 sm:p-8 shadow-xl">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Movie Title *
                </label>
                <input
                  type="text"
                  required
                  name="movieName"
                  value={formData.movieName}
                  onChange={handleChange}
                  placeholder="e.g. Interstellar"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Language *
                </label>
                <input
                  type="text"
                  required
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  placeholder="e.g. English, Hindi, Spanish"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Description / Synopsis (min 10 chars) *
              </label>
              <textarea
                rows={3}
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Comprehensive movie synopsis..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Genres & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Genres (comma separated) *
                </label>
                <input
                  type="text"
                  required
                  name="genres"
                  value={formData.genres}
                  onChange={handleChange}
                  placeholder="Action, Sci-Fi"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Duration *
                </label>
                <input
                  type="text"
                  required
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g. 2h 45m"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Certification
                </label>
                <select
                  name="certification"
                  value={formData.certification}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                >
                  <option value="U">U (Universal)</option>
                  <option value="U/A">U/A (Parental Guidance)</option>
                  <option value="A">A (Adults Only)</option>
                  <option value="PG-13">PG-13</option>
                  <option value="R">R</option>
                </select>
              </div>
            </div>

            {/* Poster & Banner URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Poster Image URL
                </label>
                <input
                  type="url"
                  name="posterUrl"
                  value={formData.posterUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Banner Backdrop URL
                </label>
                <input
                  type="url"
                  name="bannerUrl"
                  value={formData.bannerUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Cast & Director */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Director Name
                </label>
                <input
                  type="text"
                  name="director"
                  value={formData.director}
                  onChange={handleChange}
                  placeholder="Christopher Nolan"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Cast Members (comma separated)
                </label>
                <input
                  type="text"
                  name="cast"
                  value={formData.cast}
                  onChange={handleChange}
                  placeholder="Actor 1, Actor 2"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <Link
                to="/admin"
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{loading ? "Publishing Movie..." : "Publish Movie Listing"}</span>
              </button>
            </div>

          </form>

        </div>
      </div>

    </div>
  );
};

export default AddMovie;
