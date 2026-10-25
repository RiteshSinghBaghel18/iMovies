import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { 
  Film, 
  Ticket, 
  Heart, 
  User, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X,
  Compass,
  CreditCard,
  Search,
  Sparkles,
  Sun,
  Moon
} from "lucide-react";

const Header = () => {
  const { user, role, isAdmin, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#000000]/95 backdrop-blur-md border-b border-[#27272a] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo (Clean iMovies branding with Film Icon) */}
          <Link to={isAuthenticated ? "/home" : "/landing"} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#ff6600]/15 text-[#ff6600] flex items-center justify-center border border-[#ff6600]/30 group-hover:bg-[#ff6600] group-hover:text-slate-950 transition-all shadow-md shadow-[#ff6600]/15">
              <Film className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center">
                i<span className="text-[#ff6600]">Movies</span>
              </span>
              <span className="text-[9px] tracking-widest text-[#a1a1aa] uppercase -mt-1 hidden sm:block font-bold">
                Tickets Made Simple
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/home"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                isActive("/home")
                  ? "bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/30 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-[#18181f]/60"
              }`}
            >
              <Compass className="w-4 h-4 text-[#ff6600]" />
              Explore Movies
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/favoriteshows"
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    isActive("/favoriteshows")
                      ? "bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/30 font-bold"
                      : "text-slate-300 hover:text-white hover:bg-[#18181f]/60"
                  }`}
                >
                  <Heart className="w-4 h-4 text-rose-400" />
                  Watchlist
                </Link>

                <Link
                  to="/bookings"
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    isActive("/bookings")
                      ? "bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/30 font-bold"
                      : "text-slate-300 hover:text-white hover:bg-[#18181f]/60"
                  }`}
                >
                  <Ticket className="w-4 h-4 text-[#ff6600]" />
                  My Tickets
                </Link>

                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                        isActive("/admin")
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "text-amber-300 hover:text-white hover:bg-amber-500/10"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Admin Dashboard
                    </Link>

                    <Link
                      to="/admin/transactions"
                      className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                        isActive("/admin/transactions")
                          ? "bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/30"
                          : "text-slate-300 hover:text-white hover:bg-[#18181f]/60"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-[#ff6600]" />
                      Refunds & Razorpay
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-[#18181f] border border-[#27272a] text-[#ff6600] hover:text-white hover:border-[#ff6600] transition-all flex items-center justify-center shadow-sm"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#ff6600]" />
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#18181f] border border-[#27272a] hover:border-[#ff6600]/60 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#ff6600]/20 text-[#ff6600] flex items-center justify-center font-bold text-xs uppercase border border-[#ff6600]/30">
                    {user?.username?.charAt(0) || "U"}
                  </div>
                  <span className="text-sm font-medium text-slate-200 pr-1">
                    {user?.username}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Admin
                    </span>
                  )}
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-[#a1a1aa] hover:text-rose-400 hover:bg-[#18181f] transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-bold text-slate-200 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-black bg-[#ff6600] hover:bg-[#ff7700] text-slate-950 transition-all shadow-md shadow-[#ff6600]/20"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger & Theme button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[#18181f] border border-[#27272a] text-[#ff6600]"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#ff6600]" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#18181f]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#27272a] bg-[#09090b] px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/home"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-[#18181f]"
          >
            Explore Movies
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/favoriteshows"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-[#18181f]"
              >
                Watchlist
              </Link>
              <Link
                to="/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-[#18181f]"
              >
                My Tickets
              </Link>
              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10"
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    to="/admin/transactions"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#ff6600] hover:bg-[#ff6600]/10"
                  >
                    Refunds & Razorpay
                  </Link>
                </>
              )}
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-[#18181f]"
              >
                Profile ({user?.username})
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center rounded-lg text-sm font-bold bg-[#18181f] text-white"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center rounded-lg text-sm font-black bg-[#ff6600] text-slate-950"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
