import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTheme } from '../utils/ThemeContext';

function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('imovies-role');
    const storedUserStr = localStorage.getItem('imovies-user');
    setRole(storedRole);

    if (storedUserStr) {
      try {
        setUser(JSON.parse(storedUserStr));
      } catch {
        setUser({ username: storedUserStr, email: storedUserStr });
      }
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('imovies-token');
    localStorage.removeItem('imovies-role');
    localStorage.removeItem('imovies-user');
    toast.success('Logged out successfully');
    navigate('/landing');
  };

  const isActive = (path) => location.pathname === path;

  const adminNavItems = [
    { label: 'Overview', path: '/admin', icon: 'fa-solid fa-chart-pie' },
    { label: 'Manage Movies', path: '/addmovie', icon: 'fa-solid fa-film' },
    { label: 'Theatres', path: '/addtheatre', icon: 'fa-solid fa-building' },
    { label: 'Schedule Shows', path: '/addshow', icon: 'fa-solid fa-calendar-plus' },
    { label: 'Transactions & Refunds', path: '/adminbookings', icon: 'fa-solid fa-money-bill-transfer', badge: 'Live' },
    { label: 'Admin Team', path: '/addadmin', icon: 'fa-solid fa-user-shield' },
  ];

  const userNavItems = [
    { label: 'Explore Movies', path: '/home', icon: 'fa-solid fa-compass' },
    { label: 'My Bookings', path: '/bookings', icon: 'fa-solid fa-ticket' },
    { label: 'My Watchlist', path: '/favoriteshows', icon: 'fa-solid fa-heart' },
    { label: 'User Profile', path: '/profile', icon: 'fa-solid fa-user' },
  ];

  const navItems = role === 'admin' ? adminNavItems : userNavItems;

  const isDark = theme === 'dark';

  const NavContent = () => (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>
        <Link
          to={role === 'admin' ? '/admin' : '/home'}
          className="flex items-center gap-3 group text-decoration-none"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff6600] to-[#ffa333] flex items-center justify-center text-black font-black shadow-lg shadow-orange-950/50 group-hover:scale-105 transition">
            <i className="fa-solid fa-film text-lg text-black"></i>
          </div>
          <div>
            <div className={`flex items-center gap-1.5 font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              <span>iMovies</span>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-primary">
              {role === 'admin' ? 'Admin Portal' : 'Cinema Streaming'}
            </div>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className={`md:hidden p-1.5 rounded-lg transition ${isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'}`}
          aria-label="Close Sidebar"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      {/* Role Indicator Banner */}
      <div className="px-5 py-3">
        <div className={`px-3 py-1.5 rounded-lg border flex items-center justify-between text-xs ${
          isDark ? 'bg-[#121216] border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <span className={`font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Active Mode</span>
          <span
            className="font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider bg-primary/20 text-primary border border-primary/30"
          >
            {role === 'admin' ? 'Admin' : 'Member'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {role === 'admin' ? 'Management' : 'Navigation'}
        </div>

        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                active
                  ? 'bg-primary text-black shadow-lg shadow-orange-950/40 font-semibold'
                  : isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <i
                  className={`${item.icon} text-base transition duration-200 ${
                    active ? 'text-black' : isDark ? 'text-zinc-400 group-hover:text-primary' : 'text-zinc-500 group-hover:text-primary'
                  }`}
                ></i>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    active
                      ? 'bg-black/20 text-black'
                      : 'bg-primary/20 text-primary border border-primary/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom User Profile & Settings */}
      <div className={`p-3 border-t space-y-2 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
        {/* User Card */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
          isDark ? 'bg-[#121216] border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff6600] to-[#ffa333] flex items-center justify-center font-bold text-xs text-black flex-shrink-0 shadow-inner">
              {user?.username ? user.username.charAt(0).toUpperCase() : (role === 'admin' ? 'A' : 'U')}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {user?.username || (role === 'admin' ? 'Admin' : 'Cinema Fan')}
              </div>
              <div className={`text-[10px] truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {user?.email || (role === 'admin' ? 'admin@imovies.com' : 'user@imovies.com')}
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition flex-shrink-0 ${
              isDark ? 'text-zinc-400 hover:text-primary hover:bg-white/5' : 'text-zinc-600 hover:text-primary hover:bg-zinc-200'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? (
              <i className="fa-solid fa-sun text-xs text-primary"></i>
            ) : (
              <i className="fa-solid fa-moon text-xs text-primary"></i>
            )}
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          type="button"
          className="w-full py-2 px-3 text-xs font-semibold text-zinc-400 hover:text-primary hover:bg-primary/20 border border-transparent hover:border-primary/30 transition flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 border-r z-40 hidden md:block transition-colors duration-200 ${
        isDark ? 'bg-[#09090b] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        <NavContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 border-r z-50 md:hidden transform transition-transform duration-300 ease-in-out transition-colors ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDark ? 'bg-[#09090b] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}
      >
        <NavContent />
      </aside>
    </>
  );
}

export default Sidebar;
