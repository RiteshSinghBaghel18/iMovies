import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTheme } from '../utils/ThemeContext';

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const storedToken = localStorage.getItem('imovies-token');
    const storedRole = localStorage.getItem('imovies-role');
    const storedUserStr = localStorage.getItem('imovies-user');

    setToken(storedToken);
    setRole(storedRole);
    if (storedUserStr) {
      try {
        setUser(JSON.parse(storedUserStr));
      } catch {
        setUser({ username: storedUserStr });
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('imovies-token');
    localStorage.removeItem('imovies-role');
    localStorage.removeItem('imovies-user');
    toast.success('Logged out successfully');
    navigate('/landing');
  };

  const isActive = (path) => location.pathname === path;
  const homeDestination = role === 'admin' ? '/admin' : token ? '/home' : '/landing';

  const navLinkCls = (path) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'text-primary bg-primary/10 border-b-2 border-primary'
        : theme === 'dark'
        ? 'text-zinc-300 hover:text-white hover:bg-white/5'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  const mobileLinkCls = (path) =>
    `block px-3 py-2.5 rounded-lg text-base font-medium transition ${
      isActive(path)
        ? 'bg-primary text-white'
        : theme === 'dark'
        ? 'text-zinc-300 hover:bg-white/5'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  const headerBg = scrolled
    ? theme === 'dark'
      ? 'bg-[#000000] shadow-xl'
      : 'bg-white shadow-lg shadow-gray-200/80'
    : theme === 'dark'
    ? 'bg-[#000000]'
    : 'bg-white';

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${headerBg} ${
        theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to={homeDestination}
            className="flex items-center space-x-2 text-2xl font-black tracking-wider group"
          >
            <span className="text-3xl transition-transform group-hover:scale-110 group-hover:rotate-6">🎬</span>
            <span className="bg-gradient-to-r from-[#ff6600] via-[#ff7700] to-[#ffa333] bg-clip-text text-transparent">
              iMovies
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {role === 'user' && (
              <>
                <Link to="/home" className={navLinkCls('/home')}>
                  <i className="fa-solid fa-film mr-1.5"></i> Home
                </Link>
                <Link to="/bookings" className={navLinkCls('/bookings')}>
                  <i className="fa-solid fa-ticket mr-1.5"></i> Bookings
                </Link>
                <Link to="/favoriteshows" className={navLinkCls('/favoriteshows')}>
                  <i className="fa-solid fa-heart mr-1.5 text-primary"></i> Favorites
                </Link>
                <Link to="/profile" className={navLinkCls('/profile')}>
                  <i className="fa-solid fa-user mr-1.5"></i> Profile
                </Link>
              </>
            )}

            {role === 'admin' && (
              <>
                <Link to="/admin" className={navLinkCls('/admin')}>
                  <i className="fa-solid fa-chart-line mr-1.5"></i> Dashboard
                </Link>
                <Link to="/addmovie" className={navLinkCls('/addmovie')}>
                  <i className="fa-solid fa-plus-circle mr-1.5"></i> Add Movie
                </Link>
                <Link to="/addtheatre" className={navLinkCls('/addtheatre')}>
                  <i className="fa-solid fa-building mr-1.5"></i> Theatre
                </Link>
                <Link to="/addshow" className={navLinkCls('/addshow')}>
                  <i className="fa-solid fa-calendar-plus mr-1.5"></i> Show
                </Link>
                <Link to="/adminbookings" className={navLinkCls('/adminbookings')}>
                  <i className="fa-solid fa-money-bill-transfer mr-1.5"></i> Transactions & Refunds
                </Link>
                <Link to="/adminusers" className={navLinkCls('/adminusers')}>
                  <i className="fa-solid fa-users mr-1.5"></i> Users
                </Link>
              </>
            )}

            {/* Right section: theme toggle + auth */}
            <div className="flex items-center space-x-2 ml-3 pl-3 border-l border-gray-700/50">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className={`w-9 h-9 flex items-center justify-center text-sm transition-all duration-300 hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-primary border border-zinc-800'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                }`}
              >
                <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>

              {token ? (
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs px-2.5 py-1 font-semibold tracking-wide uppercase ${
                      theme === 'dark'
                        ? 'bg-primary/20 border border-primary/40 text-primary'
                        : 'bg-orange-50 border border-orange-200 text-orange-700'
                    }`}
                  >
                    {role} {user?.username ? `· ${user.username}` : ''}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-black text-sm font-medium transition duration-200 border border-primary/40"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket mr-1"></i> Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-1.5 text-sm font-semibold text-black bg-primary hover:bg-orange-500 transition shadow-md shadow-orange-950/40"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className={`px-4 py-1.5 text-sm font-semibold border transition ${
                      theme === 'dark'
                        ? 'text-gray-200 border-zinc-700 hover:border-primary hover:text-white'
                        : 'text-gray-700 border-gray-300 hover:border-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              title="Toggle Theme"
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
                theme === 'dark'
                  ? 'bg-gray-800 text-primary border border-gray-700'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-md focus:outline-none transition ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label="Toggle Menu"
            >
              <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className={`md:hidden border-b px-4 pt-2 pb-4 space-y-1 ${
            theme === 'dark'
              ? 'bg-[#111827]/98 border-gray-800'
              : 'bg-white/98 border-gray-200'
          }`}
        >
          {role === 'user' && (
            <>
              <Link to="/home" onClick={() => setIsOpen(false)} className={mobileLinkCls('/home')}>
                <i className="fa-solid fa-film mr-2"></i> Home
              </Link>
              <Link to="/bookings" onClick={() => setIsOpen(false)} className={mobileLinkCls('/bookings')}>
                <i className="fa-solid fa-ticket mr-2"></i> Bookings
              </Link>
              <Link to="/favoriteshows" onClick={() => setIsOpen(false)} className={mobileLinkCls('/favoriteshows')}>
                <i className="fa-solid fa-heart mr-2 text-primary"></i> Favorites
              </Link>
              <Link to="/profile" onClick={() => setIsOpen(false)} className={mobileLinkCls('/profile')}>
                <i className="fa-solid fa-user mr-2"></i> Profile
              </Link>
            </>
          )}

          {role === 'admin' && (
            <>
              <Link to="/admin" onClick={() => setIsOpen(false)} className={mobileLinkCls('/admin')}>
                <i className="fa-solid fa-chart-line mr-2"></i> Dashboard
              </Link>
              <Link to="/addmovie" onClick={() => setIsOpen(false)} className={mobileLinkCls('/addmovie')}>
                <i className="fa-solid fa-plus-circle mr-2"></i> Add Movie
              </Link>
              <Link to="/addtheatre" onClick={() => setIsOpen(false)} className={mobileLinkCls('/addtheatre')}>
                <i className="fa-solid fa-building mr-2"></i> Add Theatre
              </Link>
              <Link to="/addshow" onClick={() => setIsOpen(false)} className={mobileLinkCls('/addshow')}>
                <i className="fa-solid fa-calendar-plus mr-2"></i> Add Show
              </Link>
              <Link to="/addadmin" onClick={() => setIsOpen(false)} className={mobileLinkCls('/addadmin')}>
                <i className="fa-solid fa-user-shield mr-2"></i> Add Admin
              </Link>
              <Link to="/adminbookings" onClick={() => setIsOpen(false)} className={mobileLinkCls('/adminbookings')}>
                <i className="fa-solid fa-money-bill-transfer mr-2"></i> Transactions & Refunds
              </Link>
              <Link to="/adminusers" onClick={() => setIsOpen(false)} className={mobileLinkCls('/adminusers')}>
                <i className="fa-solid fa-users mr-2"></i> Manage Users
              </Link>
            </>
          )}

          {token ? (
            <div className={`pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`px-3 py-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Signed in as{' '}
                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {user?.username || role}
                </span>
              </div>
              <button
                onClick={() => { setIsOpen(false); handleLogout(); }}
                className="w-full mt-2 text-left block px-3 py-2 rounded-md text-base font-medium text-primary hover:bg-primary/20 transition"
              >
                <i className="fa-solid fa-arrow-right-from-bracket mr-2"></i> Logout
              </button>
            </div>
          ) : (
            <div className={`pt-3 border-t flex flex-col space-y-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block text-center px-4 py-2 text-base font-semibold rounded-md text-black bg-primary hover:bg-orange-500 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className={`block text-center px-4 py-2 text-base font-medium rounded-md border transition ${
                  theme === 'dark'
                    ? 'text-gray-300 border-gray-600 hover:text-white'
                    : 'text-gray-700 border-gray-300 hover:text-gray-900'
                }`}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;
