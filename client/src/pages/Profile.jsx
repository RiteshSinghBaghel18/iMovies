import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/Loader';
import { api } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

function Profile() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit modal / form state
  const [isEditing, setIsEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const storedUserStr = localStorage.getItem('imovies-user');
    if (storedUserStr) {
      try {
        const parsed = JSON.parse(storedUserStr);
        setUser(parsed);
        setUsernameInput(parsed.username || '');
      } catch {
        setUser({ username: storedUserStr, email: storedUserStr });
        setUsernameInput(storedUserStr);
      }
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, favsRes] = await Promise.allSettled([
          api.getUserBookings(),
          api.getUserFavorites(),
        ]);

        if (bookingsRes.status === 'fulfilled') {
          const bData = bookingsRes.value.data;
          setBookings(Array.isArray(bData) ? bData : bData?.bookings || bData?.data || []);
        }

        if (favsRes.status === 'fulfilled') {
          const fData = favsRes.value.data;
          setFavorites(Array.isArray(fData) ? fData : fData?.favorites || fData?.data || []);
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const payload = {};
    const cleanName = usernameInput.trim();

    if (cleanName && cleanName !== user?.username) {
      payload.username = cleanName;
    }

    if (newPassword) {
      if (!currentPassword) {
        toast.error('Current password is required to set a new password');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      if (newPassword.length < 6) {
        toast.warning('New password must be at least 6 characters');
        return;
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    if (Object.keys(payload).length === 0) {
      toast.info('No changes were made to your profile');
      setIsEditing(false);
      return;
    }

    try {
      setSaving(true);
      const res = await api.updateProfile(payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Profile updated successfully!');
        const updatedUser = res.data.user || { ...user, username: cleanName };
        setUser(updatedUser);
        localStorage.setItem('imovies-user', JSON.stringify(updatedUser));

        // Reset password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsEditing(false);

        // Notify app
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const totalSpent = bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  if (loading) return <Loader />;

  const cardBg = isDark ? 'bg-[#121216] border-zinc-800' : 'bg-white border-zinc-200 shadow-md';
  const subCardBg = isDark ? 'bg-[#0a0a0a] border-zinc-800' : 'bg-zinc-50 border-zinc-200';
  const inputBg = isDark ? 'bg-[#0a0a0a] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900';

  return (
    <DashboardLayout activePage="/profile">
      <div className="space-y-8">
        {/* User Profile Header Card */}
        <div className={`border p-6 sm:p-8 shadow-xl relative overflow-hidden transition-colors ${cardBg}`}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#ff6600] to-[#ffa333] flex items-center justify-center text-4xl font-black text-black shadow-xl border-2 border-primary/40">
                {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
              </div>

              <div className="text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold">
                    {user?.username || 'Movie Enthusiast'}
                  </h1>
                  <span className="px-3 py-0.5 text-xs font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 self-center sm:self-auto">
                    Verified Member
                  </span>
                </div>
                <p className="text-zinc-400 text-sm mt-1">{user?.email || 'user@imovies.com'}</p>
                <p className="text-xs text-zinc-500 mt-2 flex items-center justify-center sm:justify-start gap-1.5">
                  <i className="fa-regular fa-calendar-check text-primary"></i>
                  <span>Account Active • Instant E-Tickets</span>
                </p>
              </div>
            </div>

            {/* Edit Profile Toggle Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-5 py-2.5 bg-primary hover:bg-orange-600 text-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-md self-center sm:self-start"
            >
              <i className={`fa-solid ${isEditing ? 'fa-xmark' : 'fa-user-pen'}`}></i>
              <span>{isEditing ? 'Close Edit Form' : 'Edit Profile & Password'}</span>
            </button>
          </div>
        </div>

        {/* ── EDIT PROFILE & PASSWORD FORM (Collapsible / Active) ── */}
        {isEditing && (
          <div className={`border p-6 sm:p-8 shadow-xl transition-colors ${cardBg}`}>
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800 mb-6">
              <span className="w-1.5 h-6 bg-primary"></span>
              <h2 className="text-xl font-black uppercase tracking-tight">Edit Profile &amp; Change Password</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
              {/* Change Name Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-primary tracking-wider flex items-center gap-2">
                  <i className="fa-solid fa-user-tag text-xs"></i>
                  <span>1. Display Name / Username</span>
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={30}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter your name"
                    className={`w-full px-4 py-2.5 border rounded-none text-sm focus:outline-none focus:border-primary transition ${inputBg}`}
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    This name will appear on your e-tickets and sidebar dashboard.
                  </span>
                </div>
              </div>

              {/* Change Password Section */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <h3 className="text-sm font-bold uppercase text-primary tracking-wider flex items-center gap-2">
                  <i className="fa-solid fa-shield-halved text-xs"></i>
                  <span>2. Change Password (Optional)</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className={`w-full pl-4 pr-10 py-2.5 border rounded-none text-sm focus:outline-none focus:border-primary transition ${inputBg}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                      title={showCurrentPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-primary transition-colors cursor-pointer focus:outline-none"
                    >
                      <i className={`fa-solid ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className={`w-full pl-4 pr-10 py-2.5 border rounded-none text-sm focus:outline-none focus:border-primary transition ${inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-primary transition-colors cursor-pointer focus:outline-none"
                      >
                        <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className={`w-full pl-4 pr-10 py-2.5 border rounded-none text-sm focus:outline-none focus:border-primary transition ${inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-primary transition-colors cursor-pointer focus:outline-none"
                      >
                        <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-primary hover:bg-orange-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-950/40 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk"></i>
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-3 border border-zinc-700 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className={`p-6 border shadow-xl flex items-center gap-4 transition-colors ${cardBg}`}>
            <div className="w-14 h-14 bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl text-primary">
              🎟️
            </div>
            <div>
              <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider block">
                Total Bookings
              </span>
              <span className="text-3xl font-black font-mono">{bookings.length}</span>
            </div>
          </div>

          <div className={`p-6 border shadow-xl flex items-center gap-4 transition-colors ${cardBg}`}>
            <div className="w-14 h-14 bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl text-primary">
              ❤️
            </div>
            <div>
              <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider block">
                Watchlist Count
              </span>
              <span className="text-3xl font-black font-mono">{favorites.length}</span>
            </div>
          </div>

          <div className={`p-6 border shadow-xl flex items-center gap-4 transition-colors ${cardBg}`}>
            <div className="w-14 h-14 bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl text-primary">
              💳
            </div>
            <div>
              <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider block">
                Total Spent
              </span>
              <span className="text-3xl font-black font-mono">₹{totalSpent}</span>
            </div>
          </div>
        </div>

        {/* Two Column Section: Recent Activity & Account Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Activity */}
          <div className={`lg:col-span-7 p-6 border transition-colors ${cardBg}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-tight">
              <i className="fa-solid fa-clock-rotate-left text-primary"></i>
              Recent Ticket Bookings
            </h3>

            {bookings.length === 0 ? (
              <p className="text-sm text-zinc-400 italic py-6 text-center">No recent ticket reservations found.</p>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((b, idx) => (
                  <div
                    key={b._id || idx}
                    className={`p-3.5 border flex items-center justify-between transition-colors ${subCardBg}`}
                  >
                    <div>
                      <h4 className="font-bold text-sm">
                        {b.movieName || b.movieId?.movieName || 'Movie Ticket'}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {dayjs(b.bookingDate || b.showDate).format('MMM D, YYYY')} • {b.selectedSeats?.length || b.seats?.length || 1} Seat(s)
                      </p>
                    </div>
                    <span className="text-sm font-black font-mono text-primary">
                      ₹{b.totalAmount || 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Settings */}
          <div className={`lg:col-span-5 p-6 border space-y-4 transition-colors ${cardBg}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-tight">
              <i className="fa-solid fa-gear text-primary"></i>
              Account Preferences
            </h3>

            <div className="space-y-3 text-sm">
              <div className={`flex items-center justify-between p-3 border ${subCardBg}`}>
                <span className="text-zinc-400">Email Delivery</span>
                <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-0.5 border border-primary/30">
                  Brevo Active
                </span>
              </div>
              <div className={`flex items-center justify-between p-3 border ${subCardBg}`}>
                <span className="text-zinc-400">Security Verification</span>
                <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-0.5 border border-primary/30">
                  Enabled
                </span>
              </div>
              <div className={`flex items-center justify-between p-3 border ${subCardBg}`}>
                <span className="text-zinc-400">Default Currency</span>
                <span className="text-xs font-bold text-zinc-300 bg-white/5 px-2 py-0.5 border border-zinc-700">
                  INR (₹)
                </span>
              </div>
              <div className={`flex items-center justify-between p-3 border ${subCardBg}`}>
                <span className="text-zinc-400">Current Theme</span>
                <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-0.5 border border-primary/30 uppercase">
                  {theme} Mode
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Profile;
