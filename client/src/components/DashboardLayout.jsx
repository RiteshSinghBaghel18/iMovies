import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useTheme } from '../utils/ThemeContext';

function DashboardLayout({ children, activePage = '' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen flex relative transition-colors duration-200 ${theme === 'dark' ? 'bg-[#000000] text-white' : 'bg-[#ffffff] text-zinc-900'}`}>
      {/* Fixed Left Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area Occupying Right Side */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen w-full overflow-x-hidden">
        {/* Mobile Top Header */}
        <header className={`md:hidden sticky top-0 z-30 px-4 py-3 flex items-center justify-between border-b transition-colors duration-200 ${
          theme === 'dark' ? 'bg-[#09090b] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={`p-2 rounded-lg transition ${
              theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            aria-label="Open Navigation Menu"
          >
            <i className="fa-solid fa-bars text-lg"></i>
          </button>

          <Link to="/home" className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <span className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>iMovies</span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition ${
              theme === 'dark' ? 'text-zinc-400 hover:text-primary hover:bg-white/5' : 'text-zinc-600 hover:text-primary hover:bg-zinc-100'
            }`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <i className="fa-solid fa-sun text-primary"></i>
            ) : (
              <i className="fa-solid fa-moon text-primary"></i>
            )}
          </button>
        </header>

        {/* Content Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>

        {/* Unified Cinematic Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default DashboardLayout;
