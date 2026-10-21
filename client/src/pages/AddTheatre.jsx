import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/Loader';
import { api } from '../utils/api';

function AddTheatre() {
  const [formData, setFormData] = useState({
    theatreName: '',
    location: '',
    balconyRows: 3,
    balconyCols: 10,
    balconySeatPrice: 250,
    middleRows: 5,
    middleCols: 12,
    middleSeatPrice: 180,
    lowerRows: 4,
    lowerCols: 10,
    lowerSeatPrice: 120,
  });

  const [loading, setLoading] = useState(false);
  const [theatres, setTheatres] = useState([]);
  const [fetchingTheatres, setFetchingTheatres] = useState(true);

  const fetchTheatres = async () => {
    try {
      setFetchingTheatres(true);
      const res = await api.getAllTheatres();
      const list = Array.isArray(res.data) ? res.data : res.data?.theatres || res.data?.data || [];
      setTheatres(list);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingTheatres(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? Number(value) : value,
    });
  };

  // Live seat calculations
  const seatCounts = useMemo(() => {
    const balcony = (formData.balconyRows || 0) * (formData.balconyCols || 0);
    const middle = (formData.middleRows || 0) * (formData.middleCols || 0);
    const lower = (formData.lowerRows || 0) * (formData.lowerCols || 0);
    const total = balcony + middle + lower;
    return { balcony, middle, lower, total };
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.theatreName.trim() || !formData.location.trim()) {
      toast.error('Theatre name and location are required');
      return;
    }

    try {
      setLoading(true);
      const userStr = localStorage.getItem('imovies-user');
      let adminEmail = 'admin@imovies.com';
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          adminEmail = u.email || adminEmail;
        } catch {
          adminEmail = userStr;
        }
      }

      const balconyR = Number(formData.balconyRows) || 3;
      const balconyC = Number(formData.balconyCols) || 10;
      const middleR = Number(formData.middleRows) || 5;
      const middleC = Number(formData.middleCols) || 12;
      const lowerR = Number(formData.lowerRows) || 4;
      const lowerC = Number(formData.lowerCols) || 10;

      const payload = {
        theatreName: formData.theatreName.trim(),
        location: formData.location.trim(),
        adminEmail,
        balconySeatPrice: Number(formData.balconySeatPrice) || 250,
        middleSeatPrice: Number(formData.middleSeatPrice) || 180,
        lowerSeatPrice: Number(formData.lowerSeatPrice) || 120,
        balconySeats: { rows: balconyR, cols: balconyC },
        middleSeats: { rows: middleR, cols: middleC },
        lowerSeats: { rows: lowerR, cols: lowerC },
        balconyRows: balconyR,
        balconyCols: balconyC,
        middleRows: middleR,
        middleCols: middleC,
        lowerRows: lowerR,
        lowerCols: lowerC,
        totalSeats: seatCounts.total,
      };

      const res = await api.addTheatre(payload);
      if (res.data?.success || res.status === 200 || res.status === 201) {
        toast.success(`Theatre "${formData.theatreName}" created successfully!`);
        setFormData({
          theatreName: '',
          location: '',
          balconyRows: 3,
          balconyCols: 10,
          balconySeatPrice: 250,
          middleRows: 5,
          middleCols: 12,
          middleSeatPrice: 180,
          lowerRows: 4,
          lowerCols: 10,
          lowerSeatPrice: 120,
        });
        fetchTheatres();
      } else {
        toast.error(res.data?.message || 'Failed to add theatre');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving theatre');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTheatre = async (id, name) => {
    if (!window.confirm(`Delete theatre "${name}"? This will delete associated shows.`)) return;

    try {
      await api.deleteTheatre(id);
      toast.success('Theatre deleted successfully');
      setTheatres(theatres.filter((t) => t.theatreId !== id && t._id !== id && t.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete theatre');
    }
  };

  return (
    <DashboardLayout activePage="/addtheatre">
      <div className="space-y-12">
        <div className="border-b border-white/10 pb-4">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="text-primary">🏢</span>
            Add New Theatre
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Configure theater auditorium geometry, seat tier rows & columns, and pricing structures.
          </p>
        </div>

        {/* Form Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-card rounded-2xl border border-gray-800 p-6 sm:p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Theatre Name and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Theatre Name *
                  </label>
                  <input
                    type="text"
                    name="theatreName"
                    required
                    value={formData.theatreName}
                    onChange={handleChange}
                    placeholder="e.g. CineMax Dolby Grand"
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Country Location *
                  </label>
                  <select
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-primary text-sm"
                  >
                    <option value="">Select Country Location...</option>
                    {['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'South Korea', 'United Arab Emirates', 'Singapore', 'Spain', 'Italy', 'Mexico', 'Brazil'].map((c) => (
                      <option key={c} value={c}>
                        📍 {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TIER 1: BALCONY */}
              <div className="p-4 rounded-xl bg-gray-900/80 border border-primary/30">
                <span className="text-xs uppercase font-extrabold tracking-wider text-primary block mb-3 flex items-center gap-1.5">
                  <i className="fa-solid fa-crown"></i> 1. Balcony Section Configuration
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Rows</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      name="balconyRows"
                      value={formData.balconyRows}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Columns</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      name="balconyCols"
                      value={formData.balconyCols}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Price ($)</label>
                    <input
                      type="number"
                      min="1"
                      name="balconySeatPrice"
                      value={formData.balconySeatPrice}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* TIER 2: MIDDLE */}
              <div className="p-4 rounded-xl bg-gray-900/80 border border-primary/30">
                <span className="text-xs uppercase font-extrabold tracking-wider text-primary block mb-3 flex items-center gap-1.5">
                  <i className="fa-solid fa-layer-group"></i> 2. Middle Section Configuration
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Rows</label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      name="middleRows"
                      value={formData.middleRows}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Columns</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      name="middleCols"
                      value={formData.middleCols}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Price ($)</label>
                    <input
                      type="number"
                      min="1"
                      name="middleSeatPrice"
                      value={formData.middleSeatPrice}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* TIER 3: LOWER */}
              <div className="p-4 rounded-xl bg-gray-900/80 border border-primary/30">
                <span className="text-xs uppercase font-extrabold tracking-wider text-primary block mb-3 flex items-center gap-1.5">
                  <i className="fa-solid fa-angles-down"></i> 3. Lower Section Configuration
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Rows</label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      name="lowerRows"
                      value={formData.lowerRows}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Columns</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      name="lowerCols"
                      value={formData.lowerCols}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Price ($)</label>
                    <input
                      type="number"
                      min="1"
                      name="lowerSeatPrice"
                      value={formData.lowerSeatPrice}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-primary hover:bg-orange-500 text-black font-black rounded-xl shadow-lg shadow-orange-950/40 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving Theatre...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-plus"></i>
                      <span>Save & Create Theatre</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Visual Seat Count Preview Sidebar */}
          <div className="lg:col-span-4 bg-card rounded-2xl border border-gray-800 p-6 shadow-2xl space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-chair text-primary"></i>
              Auditorium Preview
            </h3>

            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-center">
              <span className="text-xs text-gray-400 uppercase tracking-widest block">Total Capacity</span>
              <span className="text-4xl font-black text-white font-mono mt-1 block">
                {seatCounts.total} Seats
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900 border border-primary/30">
                <span className="text-xs text-primary font-bold">Balcony</span>
                <span className="text-xs font-mono text-gray-300">
                  {formData.balconyRows} × {formData.balconyCols} = <strong>{seatCounts.balcony}</strong> seats (${formData.balconySeatPrice})
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900 border border-primary/30">
                <span className="text-xs text-primary font-bold">Middle</span>
                <span className="text-xs font-mono text-gray-300">
                  {formData.middleRows} × {formData.middleCols} = <strong>{seatCounts.middle}</strong> seats (${formData.middleSeatPrice})
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900 border border-primary/30">
                <span className="text-xs text-primary font-bold">Lower</span>
                <span className="text-xs font-mono text-gray-300">
                  {formData.lowerRows} × {formData.lowerCols} = <strong>{seatCounts.lower}</strong> seats (${formData.lowerSeatPrice})
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 text-center">
              <div className="screen-curve h-4 w-full mb-2"></div>
              <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">
                Screen Layout
              </span>
            </div>
          </div>
        </div>

        {/* Existing Theatres List */}
        <div className="bg-card rounded-2xl border border-gray-800 p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <i className="fa-solid fa-building text-primary"></i>
            Partner Theatres ({theatres.length})
          </h2>

          {fetchingTheatres ? (
            <p className="text-sm text-gray-400">Loading theatres...</p>
          ) : theatres.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4">No theatres registered yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {theatres.map((t) => {
                const tId = t.theatreId || t._id || t.id;
                return (
                  <div
                    key={tId}
                    className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white">{t.theatreName}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{t.location}</p>
                      <span className="text-[11px] text-primary font-semibold mt-1 block">
                        Balcony: ${t.balconySeatPrice} • Middle: ${t.middleSeatPrice} • Lower: ${t.lowerSeatPrice}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteTheatre(tId, t.theatreName)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/20 rounded-lg transition"
                      title="Delete theatre"
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

export default AddTheatre;
