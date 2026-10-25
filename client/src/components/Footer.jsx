import React from "react";
import { Film, Heart, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#000000] border-t border-[#27272a] text-[#a1a1aa] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#ff6600]/15 text-[#ff6600] flex items-center justify-center border border-[#ff6600]/30">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-white">
                i<span className="text-[#ff6600]">Movies</span>
              </span>
            </div>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              Movie ticket booking made simple. Live interactive seat map, Razorpay payment verification, Brevo transactional notifications, and instant digital passes.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/home" className="hover:text-[#ff6600] transition-colors">Now Showing Movies</Link>
              </li>
              <li>
                <Link to="/home" className="hover:text-[#ff6600] transition-colors">Popular Releases (TMDB)</Link>
              </li>
              <li>
                <Link to="/favoriteshows" className="hover:text-[#ff6600] transition-colors">My Watchlist</Link>
              </li>
              <li>
                <Link to="/bookings" className="hover:text-[#ff6600] transition-colors">Digital Passes & QR</Link>
              </li>
            </ul>
          </div>

          {/* Cinemas & Formats */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Viewing Formats
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>4K UHD Laser Projection</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Dolby Atmos Spatial Audio</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>IMAX Experience</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>VIP Recliner Lounges</span>
              </li>
            </ul>
          </div>

          {/* Trust & Guarantee */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Security & Guarantee
            </h4>
            <div className="bg-[#121216] p-4 rounded-xl border border-[#27272a] space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Shield className="w-4 h-4" />
                <span>100% Razorpay Secured</span>
              </div>
              <p className="text-[#a1a1aa]">
                Encrypted end-to-end checkout with instant automated refunds on cancellation.
              </p>
              <div className="pt-2 text-[11px] text-[#ff6600] font-semibold">
                TTL Seat Locking & Real-Time Socket Availability
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-[#27272a] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#a1a1aa] gap-4">
          <p>© {new Date().getFullYear()} iMovies Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Notice</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer transition-colors">Help & FAQ</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
