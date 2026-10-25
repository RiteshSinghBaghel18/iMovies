import React from "react";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { 
  User, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  Ticket, 
  Heart, 
  CreditCard, 
  LogOut,
  Sparkles
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, role, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const { data: bookingsData } = useFetch("/bookings/my-bookings");
  const { data: favoritesData } = useFetch("/favorite");

  const bookings = bookingsData?.bookings || [];
  const favorites = favoritesData?.favorites || [];

  const completedBookings = bookings.filter((b) => b.paymentStatus === "Completed");
  const totalSpent = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalTickets = completedBookings.reduce((sum, b) => sum + (b.selectedSeats?.length || 0), 0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-cinema-darkest text-slate-100 pb-20">
      
      {/* Header */}
      <div className="bg-cinema-card border-b border-cinema-border/60 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Avatar */}
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-black text-4xl shadow-xl shadow-red-600/30 border-2 border-red-400/40">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>

            {/* User Meta */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{user?.username}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                  {isAdmin ? "Administrator" : "Movie Fan"}
                </span>
              </div>

              <p className="text-sm text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>{user?.email}</span>
              </p>

              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
              </p>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-red-400 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>

          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Statistics Cards */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Activity Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-6 rounded-2xl bg-cinema-card border border-cinema-border space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase font-semibold">Tickets Booked</span>
                <Ticket className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-3xl font-extrabold text-white">{totalTickets}</p>
              <p className="text-xs text-slate-400">Across {completedBookings.length} orders</p>
            </div>

            <div className="p-6 rounded-2xl bg-cinema-card border border-cinema-border space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase font-semibold">Total Spent</span>
                <CreditCard className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-3xl font-extrabold text-amber-400">₹{totalSpent}</p>
              <p className="text-xs text-slate-400">Verified digital transactions</p>
            </div>

            <div className="p-6 rounded-2xl bg-cinema-card border border-cinema-border space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase font-semibold">Saved in Watchlist</span>
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-3xl font-extrabold text-rose-400">{favorites.length}</p>
              <p className="text-xs text-slate-400">Movies queued for release</p>
            </div>

          </div>
        </div>

        {/* Quick Links Card */}
        <div className="bg-cinema-card border border-cinema-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Quick Shortcuts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/bookings"
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">
                    My Tickets
                  </h4>
                  <p className="text-xs text-slate-400">Download or print digital passes</p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
            </Link>

            <Link
              to="/favoriteshows"
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors">
                    Watchlist
                  </h4>
                  <p className="text-xs text-slate-400">Manage saved movies</p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Profile;
