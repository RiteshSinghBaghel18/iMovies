import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';

function AddAdmin() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  useEffect(() => {
    const adminStr = localStorage.getItem('imovies-user');
    if (adminStr) {
      try {
        setCurrentAdmin(JSON.parse(adminStr));
      } catch {
        setCurrentAdmin({ username: 'Admin', email: adminStr });
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      toast.error('All fields are required');
      return;
    }

    if (formData.password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const res = await api.registerAdmin(formData);
      if (res.data?.success || res.status === 200 || res.status === 201) {
        toast.success(`Admin privileges granted to "${formData.username}"!`);
        setFormData({
          username: '',
          email: '',
          password: '',
        });
      } else {
        toast.error(res.data?.message || 'Failed to register admin');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating administrator account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout activePage="/addadmin">
      <div className="space-y-10">
        <div className="border-b border-white/10 pb-4">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="text-primary">🛡️</span>
            Administrator Delegation
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Grant managerial access and administrative permissions to new operators.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form */}
          <div className="lg:col-span-7 bg-card rounded-2xl border border-gray-800 p-6 sm:p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <i className="fa-solid fa-user-plus text-primary"></i>
              Register New Administrator
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Admin Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="e.g. CinemaOpsLead"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Admin Work Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <i className="fa-regular fa-envelope"></i>
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@imovies.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Secure Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <i className="fa-solid fa-lock"></i>
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-orange-500 text-black font-black rounded-xl shadow-lg shadow-orange-950/40 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Admin Account...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-shield-halved"></i>
                      <span>Grant Administrative Privileges</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Current Admin Session Overview */}
          <div className="lg:col-span-5 bg-card rounded-2xl border border-gray-800 p-6 sm:p-8 shadow-2xl space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-shield-virus text-primary"></i>
              Current Active Session
            </h3>

            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 border border-primary/40 text-primary flex items-center justify-center text-2xl font-black">
                {(currentAdmin?.username || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-white truncate">
                  {currentAdmin?.username || 'System Administrator'}
                </h4>
                <p className="text-xs text-gray-400 truncate">{currentAdmin?.email || 'admin@imovies.com'}</p>
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider block mt-1">
                  ● Superuser Authenticated
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800/80 space-y-2 text-xs text-gray-400 leading-relaxed">
              <span className="font-bold text-zinc-300 block">Security Policy Notice:</span>
              <p>
                All actions performed with administrator privileges are logged with timestamps and audit trail IDs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AddAdmin;
