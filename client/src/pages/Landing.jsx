import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTheme } from '../utils/ThemeContext';

const FEATURE_CARDS = [
  {
    icon: '🎬',
    color: 'orange',
    title: 'Latest Blockbusters',
    desc: 'Explore a rich library of cinema releases, filtered by genre, language, and rating.',
  },
  {
    icon: '🎭',
    color: 'orange',
    title: 'Real-Time Seat Map',
    desc: 'Live interactive seat layout with instant locks powered by WebSocket technology.',
  },
  {
    icon: '🎟️',
    color: 'orange',
    title: 'Instant Booking',
    desc: 'Seamless one-click confirmation with transparent Balcony, Middle, and Lower pricing.',
  },
  {
    icon: '📧',
    color: 'orange',
    title: 'Digital Tickets',
    desc: 'Printable cinema passes with perforated design, booking history, and cancellation.',
  },
];

function Landing() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col selection:bg-primary selection:text-black ${
      isDark ? 'bg-[#0a0a0f] text-white' : 'bg-slate-50 text-gray-900'
    }`}>
      <Header />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-18px) rotate(6deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%       { opacity: 0.55; transform: scale(1.1); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .fade-up-1 { animation: fadeUp 0.7s ease both; animation-delay: 0.1s; }
        .fade-up-2 { animation: fadeUp 0.7s ease both; animation-delay: 0.25s; }
        .fade-up-3 { animation: fadeUp 0.7s ease both; animation-delay: 0.4s; }
        .fade-up-4 { animation: fadeUp 0.7s ease both; animation-delay: 0.55s; }
        .float-reel { animation: floatSlow 9s ease-in-out infinite; }
        .glow-pulse { animation: pulseGlow 5s ease-in-out infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, #ff6600 0%, #ffa333 40%, #ff6600 60%, #ff7700 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* ── HERO SECTION ──────────────────────────────────────── */}
      <section
        className={`relative flex-1 flex flex-col items-center justify-center text-center overflow-hidden py-24 px-4 sm:px-6 lg:px-8 ${
          isDark
            ? 'bg-[radial-gradient(ellipse_at_top,#1a0f05_0%,#000000_60%)]'
            : 'bg-[radial-gradient(ellipse_at_top,#fff7ed_0%,#ffffff_60%)]'
        }`}
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}
      >
        {/* Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none glow-pulse bg-primary/20" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none glow-pulse bg-primary/15" style={{ animationDelay: '2.5s' }} />

        {/* Floating Decorations (hidden on mobile) */}
        <div className="absolute top-16 left-12 text-7xl opacity-[0.08] float-reel pointer-events-none hidden lg:block select-none">🎞️</div>
        <div className="absolute bottom-24 right-16 text-8xl opacity-[0.07] float-reel pointer-events-none hidden lg:block select-none" style={{ animationDelay: '3s' }}>📽️</div>
        <div className="absolute top-1/3 right-12 text-6xl opacity-[0.08] float-reel pointer-events-none hidden lg:block select-none" style={{ animationDelay: '1.5s' }}>🍿</div>
        <div className="absolute bottom-1/3 left-20 text-5xl opacity-[0.06] float-reel pointer-events-none hidden xl:block select-none" style={{ animationDelay: '4s' }}>⭐</div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Live badge */}
          <div className="fade-up-1 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase mb-8 shadow-inner border bg-primary/20 border-primary/40 text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            Next-Generation Cinema Experience
          </div>

          {/* Headline */}
          <h1 className="fade-up-2 text-5xl sm:text-7xl lg:text-[88px] font-black tracking-tight leading-none mb-6">
            <span className={`block mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome to
            </span>
            <span className="shimmer-text">iMovies</span>
          </h1>

          {/* Subheadline */}
          <p className={`fade-up-3 text-lg sm:text-2xl font-light max-w-2xl mx-auto mb-10 leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Your ultimate destination for the latest blockbusters, timeless classics, and{' '}
            <span className="font-semibold text-primary">real-time interactive seat booking</span>.
          </p>

          {/* CTAs */}
          <div className="fade-up-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-primary hover:bg-orange-500 text-black font-black text-lg shadow-2xl shadow-orange-950/60 transform hover:-translate-y-1 transition duration-200 flex items-center justify-center gap-3"
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>Sign In Now</span>
            </Link>
            <Link
              to="/register"
              className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-lg transform hover:-translate-y-1 transition duration-200 flex items-center justify-center gap-3 border ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-white border-white/20 hover:border-white/40'
                  : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300 hover:border-gray-400 shadow-md'
              }`}
            >
              <i className="fa-solid fa-user-plus text-primary"></i>
              <span>Create Account</span>
            </Link>
          </div>

          {/* Quick trust badges */}
          <div className={`mt-14 pt-8 border-t flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm ${
            isDark ? 'border-gray-800/60 text-gray-400' : 'border-gray-200 text-gray-500'
          }`}>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-bolt text-primary"></i>
              <span>Instant Seat Locking</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-shield-halved text-primary"></i>
              <span>Zero Booking Fees</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-qrcode text-primary"></i>
              <span>Instant E-Tickets</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-primary"></i>
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE HIGHLIGHTS ────────────────────────────────── */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-[#070710]' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Why Moviegoers Choose{' '}
              <span className="text-primary">iMovies</span>
            </h2>
            <p className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Built with cutting-edge real-time technology to give you the front-row cinema
              experience before you even arrive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURE_CARDS.map((f, i) => {
              return (
                <div
                  key={i}
                  className={`p-6 rounded-2xl border transition duration-300 group hover:-translate-y-1.5 hover:border-primary/50 ${
                    isDark ? 'bg-[#121216] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl border border-primary/30 bg-primary/10 text-primary text-3xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className={`text-lg font-bold mb-2 transition-colors group-hover:text-primary ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {f.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-[#0a0a0f]' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white">
            Book in <span className="text-primary">3 Simple Steps</span>
          </h2>
          <p className={`text-base mb-14 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            From browsing to your digital ticket — all under 2 minutes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { step: '01', icon: '🎬', title: 'Browse & Discover', desc: 'Explore movies by genre, language, or search. Read cast details and user reviews.' },
              { step: '02', icon: '💺', title: 'Pick Your Seat', desc: 'Choose from Balcony, Middle, or Lower tiers. Seats lock instantly for 10 minutes.' },
              { step: '03', icon: '🎟️', title: 'Confirm & Enjoy', desc: 'Instant booking confirmation. Your digital ticket is ready to show at the cinema.' },
            ].map((s, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border relative overflow-hidden ${
                  isDark ? 'bg-[#111827] border-gray-800' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <span className={`absolute top-4 right-4 text-6xl font-black opacity-5 ${isDark ? 'text-white' : 'text-gray-400'}`}>
                  {s.step}
                </span>
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────── */}
      <section className={`py-16 text-center px-4 border-y ${
        isDark ? 'bg-[#0a0a0a] border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <h3 className={`text-2xl sm:text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Ready for your next movie night? 🍿
        </h3>
        <p className={`max-w-xl mx-auto mb-8 text-sm sm:text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Join thousands of movie lovers booking their favourite seats in advance with zero hassle.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-8 py-3.5 rounded-xl bg-primary hover:bg-orange-500 text-black font-black transition shadow-lg shadow-orange-950/40"
          >
            Get Started — It's Free
          </Link>
          <Link
            to="/login"
            className={`px-8 py-3.5 rounded-xl font-bold border transition ${
              isDark
                ? 'text-gray-200 border-gray-600 hover:border-gray-400 hover:text-white'
                : 'text-gray-700 border-gray-300 hover:border-gray-500 hover:text-gray-900 bg-white'
            }`}
          >
            Already have an account?
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Landing;
