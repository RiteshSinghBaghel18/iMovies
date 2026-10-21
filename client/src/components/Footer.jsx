import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';

function Footer() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <footer className={`border-t pt-12 pb-8 mt-auto transition-colors duration-200 ${
      isDark ? 'bg-[#000000] border-white/10 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-2xl font-black tracking-wider text-primary">
              <span>🎬</span>
              <span className="bg-gradient-to-r from-[#ff6600] via-[#ff7700] to-[#ffa333] bg-clip-text text-transparent">iMovies</span>
            </div>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-zinc-600'}`}>
              Experience the magic of cinema with instant seat reservation, premier theater experiences, and real-time updates.
            </p>
            <div className="flex space-x-4 pt-2 text-lg">
              <a href="#facebook" className="text-zinc-400 hover:text-primary transition"><i className="fa-brands fa-facebook"></i></a>
              <a href="#twitter" className="text-zinc-400 hover:text-primary transition"><i className="fa-brands fa-twitter"></i></a>
              <a href="#instagram" className="text-zinc-400 hover:text-primary transition"><i className="fa-brands fa-instagram"></i></a>
              <a href="#youtube" className="text-zinc-400 hover:text-primary transition"><i className="fa-brands fa-youtube"></i></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`font-semibold text-base mb-4 tracking-wide uppercase ${isDark ? 'text-white' : 'text-zinc-900'}`}>Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/home" className="hover:text-primary transition">Movies Now Showing</Link></li>
              <li><Link to="/bookings" className="hover:text-primary transition">My Bookings</Link></li>
              <li><Link to="/favoriteshows" className="hover:text-primary transition">Watchlist</Link></li>
              <li><Link to="/profile" className="hover:text-primary transition">User Profile</Link></li>
              <li><Link to="/landing" className="hover:text-primary transition">About Platform</Link></li>
            </ul>
          </div>

          {/* Popular Genres */}
          <div>
            <h4 className={`font-semibold text-base mb-4 tracking-wide uppercase ${isDark ? 'text-white' : 'text-zinc-900'}`}>Popular Genres</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-primary cursor-pointer transition">Action & Adventure</span></li>
              <li><span className="hover:text-primary cursor-pointer transition">Sci-Fi & Fantasy</span></li>
              <li><span className="hover:text-primary cursor-pointer transition">Comedy & Drama</span></li>
              <li><span className="hover:text-primary cursor-pointer transition">Horror & Thriller</span></li>
              <li><span className="hover:text-primary cursor-pointer transition">Animation & Family</span></li>
            </ul>
          </div>

          {/* Cinema Experience */}
          <div>
            <h4 className={`font-semibold text-base mb-4 tracking-wide uppercase ${isDark ? 'text-white' : 'text-zinc-900'}`}>Cinema Experience</h4>
            <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-zinc-600'}`}>
              Dolby Atmos sound, 4K Laser Projection, and luxury recliners available across our partner theatres.
            </p>
            <div className={`p-3 rounded-none border ${isDark ? 'bg-[#121216] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <span className="text-xs text-primary font-bold block mb-1">CUSTOMER SUPPORT</span>
              <span className={`text-xs block ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>support@imovies.internal</span>
              <span className={`text-xs block mt-1 ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>+1 (800) 555-FILM</span>
            </div>
          </div>
        </div>

        <div className={`pt-8 mt-8 border-t flex flex-col md:flex-row items-center justify-between text-xs ${
          isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-500'
        }`}>
          <p>© {new Date().getFullYear()} iMovies Entertainment Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="hover:text-primary cursor-pointer">Privacy Policy</span>
            <span className="hover:text-primary cursor-pointer">Terms of Service</span>
            <span className="hover:text-primary cursor-pointer">Cookie Preferences</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
