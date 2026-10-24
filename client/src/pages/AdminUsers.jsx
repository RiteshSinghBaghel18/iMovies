import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';
import dayjs from 'dayjs';

function AdminUsers() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'verified', 'unverified'

  // Delete Modal State
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getAllUsers();
      const list = res.data?.users || res.data?.data || [];
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Unable to fetch user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status filter
      if (statusFilter === 'verified' && !u.isVerified) return false;
      if (statusFilter === 'unverified' && u.isVerified) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesUsername = u.username && u.username.toLowerCase().includes(term);
        const matchesEmail = u.email && u.email.toLowerCase().includes(term);
        const matchesId = u._id && u._id.toLowerCase().includes(term);
        return matchesUsername || matchesEmail || matchesId;
      }

      return true;
    });
  }, [users, searchTerm, statusFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = users.length;
    const verified = users.filter((u) => u.isVerified).length;
    const unverified = total - verified;
    const totalBookings = users.reduce((acc, u) => acc + (u.bookingCount || 0), 0);
    return { total, verified, unverified, totalBookings };
  }, [users]);

  // Handle user deletion
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      const res = await api.deleteUser(userToDelete._id);
      if (res.data?.success) {
        toast.success(`🗑️ User "${userToDelete.username}" (${userToDelete.email}) permanently deleted.`);
        setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
        setUserToDelete(null);
      } else {
        toast.error(res.data?.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      toast.error(err.response?.data?.message || 'Error occurred while deleting user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout activePage="/adminusers">
      <div className="space-y-8">
        {/* Header Title & Actions */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 ${
          isDark ? 'border-white/10' : 'border-zinc-200'
        }`}>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-6 bg-primary rounded-full"></span>
              <h1 className={`text-3xl font-black tracking-tight flex items-center gap-2.5 ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}>
                <span>User Directory &amp; Account Control</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-mono font-bold">
                  Admin Authority
                </span>
              </h1>
            </div>
            <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Manage registered member accounts, view registration dates, inspect booking activity, and delete inactive or unauthorized users.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className={`px-3.5 py-2 text-xs font-bold border transition flex items-center gap-1.5 ${
                isDark
                  ? 'bg-[#121216] border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <i className="fa-solid fa-arrow-left text-[11px]"></i> Admin Dashboard
            </Link>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-bold bg-primary hover:bg-orange-500 text-black transition flex items-center gap-1.5 shadow-md shadow-orange-950/30 disabled:opacity-50"
            >
              <i className={`fa-solid fa-arrows-rotate text-[11px] ${loading ? 'animate-spin' : ''}`}></i>
              Refresh Directory
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className={`p-5 border transition ${
            isDark ? 'bg-[#121216] border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">Total Users</span>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {stats.total}
              </span>
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-lg">
                👥
              </div>
            </div>
            <span className="text-[11px] text-zinc-400 mt-2 block">Registered accounts in database</span>
          </div>

          <div className={`p-5 border transition ${
            isDark ? 'bg-[#121216] border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <span className="text-xs uppercase font-bold text-green-500 tracking-wider">Verified Accounts</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-black text-green-500 font-mono">
                {stats.verified}
              </span>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center text-lg">
                ✓
              </div>
            </div>
            <span className="text-[11px] text-zinc-400 mt-2 block">Email confirmation active</span>
          </div>

          <div className={`p-5 border transition ${
            isDark ? 'bg-[#121216] border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <span className="text-xs uppercase font-bold text-yellow-500 tracking-wider">Pending Verification</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-black text-yellow-500 font-mono">
                {stats.unverified}
              </span>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center text-lg">
                ⏳
              </div>
            </div>
            <span className="text-[11px] text-zinc-400 mt-2 block">Unverified or trial registrations</span>
          </div>

          <div className={`p-5 border transition ${
            isDark ? 'bg-[#121216] border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <span className="text-xs uppercase font-bold text-primary tracking-wider">Cumulative Bookings</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-black text-primary font-mono">
                {stats.totalBookings}
              </span>
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-lg">
                🎟️
              </div>
            </div>
            <span className="text-[11px] text-zinc-400 mt-2 block">Tickets reserved by members</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className={`p-4 sm:p-5 border ${
          isDark ? 'bg-[#121216] border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-primary pointer-events-none text-sm">
                <i className="fa-solid fa-magnifying-glass text-xs"></i>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users by username, email address, or ID..."
                className={`w-full pl-10 pr-10 py-2.5 text-sm border focus:outline-none focus:border-primary transition ${
                  isDark
                    ? 'bg-[#0a0a0a] border-zinc-800 text-white placeholder-zinc-500'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
                }`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {[
                { id: 'All', label: 'All Users' },
                { id: 'verified', label: 'Verified Only' },
                { id: 'unverified', label: 'Unverified' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-2 text-xs font-bold transition ${
                    statusFilter === tab.id
                      ? 'bg-primary text-black font-black shadow-md'
                      : isDark
                      ? 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className={`border overflow-hidden ${
          isDark ? 'bg-[#121216] border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              <i className="fa-solid fa-users text-primary"></i>
              Registered Member Directory
              <span className="text-xs px-2 py-0.5 font-bold uppercase bg-primary/20 text-primary border border-primary/30">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-zinc-400">Loading user accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-2 opacity-40">👥</div>
              <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                No Users Found
              </h3>
              <p className="text-xs text-zinc-400">
                {searchTerm ? `No users match search query "${searchTerm}"` : 'No registered users in this category.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-[11px] uppercase tracking-wider font-bold ${
                    isDark ? 'bg-zinc-900/80 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                  }`}>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-center">Reservations</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-zinc-200'}`}>
                  {filteredUsers.map((u) => {
                    const initials = u.username ? u.username.slice(0, 2).toUpperCase() : '??';
                    return (
                      <tr
                        key={u._id}
                        className={`transition ${
                          isDark ? 'hover:bg-zinc-900/60' : 'hover:bg-zinc-50'
                        }`}
                      >
                        {/* Member */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff6600] to-[#ffa333] flex items-center justify-center text-black font-black text-xs flex-shrink-0 shadow-sm">
                              {initials}
                            </div>
                            <div>
                              <span className={`font-bold block ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                {u.username}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                ID: {u._id ? `${u._id.slice(0, 8)}...` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 font-mono text-zinc-300">
                          {u.email}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {u.isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/30">
                              <i className="fa-solid fa-check text-[9px]"></i> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                              <i className="fa-solid fa-clock text-[9px]"></i> Pending
                            </span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-zinc-400">
                          {u.createdAt ? dayjs(u.createdAt).format('MMM D, YYYY') : 'N/A'}
                        </td>

                        {/* Activity */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 text-xs font-bold bg-zinc-900 border border-zinc-800 text-primary">
                            {u.bookingCount || 0} {u.bookingCount === 1 ? 'ticket' : 'tickets'}
                          </span>
                        </td>

                        {/* Actions (Delete User) */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="px-3 py-1.5 rounded text-xs font-bold bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 hover:border-red-600 transition flex items-center gap-1.5 ml-auto"
                            title={`Delete user account "${u.username}"`}
                          >
                            <i className="fa-solid fa-trash-can text-xs"></i>
                            <span>Delete User</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Confirmation Modal for Deleting User ── */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-red-600/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-600/30 text-red-500 flex items-center justify-center text-xl flex-shrink-0">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Confirm User Deletion</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  This administrative action permanently removes the user account.
                </p>
              </div>
            </div>

            {/* Target User Card */}
            <div className="p-3.5 bg-black/60 border border-zinc-800 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-semibold">Username:</span>
                <span className="text-white font-bold">{userToDelete.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-semibold">Email:</span>
                <span className="text-primary font-mono">{userToDelete.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-semibold">Total Bookings:</span>
                <span className="text-zinc-300 font-bold">{userToDelete.bookingCount || 0}</span>
              </div>
            </div>

            {/* Warning Message */}
            <p className="text-xs text-red-400/90 leading-relaxed bg-red-950/20 p-3 border border-red-900/30 rounded-lg">
              ⚠️ <strong>Warning:</strong> Deleting this account will permanently erase the user's login access, watchlist, and preferences. This action cannot be reverted.
            </p>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 text-xs font-black bg-red-600 hover:bg-red-700 text-white transition rounded-lg shadow-lg shadow-red-950/50 flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-trash-can"></i>
                    <span>Permanently Delete User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AdminUsers;
