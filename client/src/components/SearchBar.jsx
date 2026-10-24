import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const COUNTRIES = [
  'All Countries',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'South Korea',
  'United Arab Emirates',
  'Singapore',
  'Spain',
  'Italy',
  'Mexico',
  'Brazil',
];

const GENRES = [
  'All Genres',
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Drama',
  'Family',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Science Fiction',
  'Thriller',
];

const LANGUAGES = [
  'All Languages',
  'English',
  'Korean',
  'Japanese',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Arabic',
];

function SearchBar({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterChange,
  onPerformSearch,
  onClearSearch,
  isSearching = false,
}) {
  const [countries, setCountries] = useState(COUNTRIES);
  const [localQuery, setLocalQuery] = useState(searchQuery || '');

  useEffect(() => {
    setLocalQuery(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    // Dynamically load any additional registered theatre country locations
    const fetchLocations = async () => {
      try {
        const res = await api.getAllTheatres();
        const theatreList = Array.isArray(res.data) ? res.data : res.data?.theatres || res.data?.data || [];
        const countrySet = new Set(COUNTRIES);
        theatreList.forEach((t) => {
          if (t.location && t.location.trim() && !/india/i.test(t.location)) {
            countrySet.add(t.location.trim());
          }
        });
        setCountries(Array.from(countrySet));
      } catch (err) {
        // Fallback to COUNTRIES
        setCountries(COUNTRIES);
      }
    };
    fetchLocations();
  }, []);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (onPerformSearch) {
      onPerformSearch(localQuery);
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    if (onClearSearch) {
      onClearSearch();
    }
  };

  const selectCls = "px-3 py-2.5 text-xs font-semibold bg-[#0a0a0a] border border-zinc-800 text-white focus:outline-none focus:border-primary transition cursor-pointer";

  return (
    <div className="p-4 sm:p-6 bg-[#121216] border border-zinc-800 shadow-xl space-y-4">
      {/* Top Banner: TMDB Live Market Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-base font-black">
            <i className="fa-solid fa-magnifying-glass text-xs text-primary"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
                TMDB Live Movie Search
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/40">
                Live Market
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Instant global cinema search powered by The Movie Database API
            </p>
          </div>
        </div>

        {/* Clear Search Button if query or filters active */}
        {(localQuery || activeFilters.genre !== 'All' || activeFilters.language !== 'All' || activeFilters.location !== 'All') && (
          <button
            onClick={handleClear}
            className="text-xs font-semibold text-primary hover:text-white px-3 py-1.5 border border-primary/40 hover:bg-primary/20 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <i className="fa-solid fa-xmark text-[11px]"></i>
            Clear Filters &amp; Search
          </button>
        )}
      </div>

      {/* Main Search Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-primary pointer-events-none text-sm">
            <i className="fa-solid fa-film text-xs"></i>
          </span>
          <input
            type="text"
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value);
              if (onSearchChange) onSearchChange(e.target.value);
            }}
            placeholder="Search movie titles across TMDB live market..."
            className="w-full pl-10 pr-10 py-3 text-sm bg-[#0a0a0a] border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery('');
                if (onSearchChange) onSearchChange('');
                if (onClearSearch) onClearSearch();
              }}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="px-6 py-3 bg-primary hover:bg-orange-500 text-black font-black text-xs sm:text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-50 flex-shrink-0"
        >
          {isSearching ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin"></div>
              <span>Searching TMDB...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-magnifying-glass text-xs"></i>
              <span>Search TMDB</span>
            </>
          )}
        </button>
      </form>

      {/* Structured Filters Row: Country Location, Genre, and Language */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Country Location Dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
            <i className="fa-solid fa-earth-americas text-primary text-[10px]"></i> Country Location
          </label>
          <select
            value={activeFilters.location || 'All Countries'}
            onChange={(e) => onFilterChange('location', e.target.value)}
            className={`w-full ${selectCls}`}
          >
            {countries.map((c) => (
              <option key={c} value={c} className="bg-zinc-900 text-white">
                {c === 'All Countries' ? '🌍 All Countries' : `📍 ${c}`}
              </option>
            ))}
          </select>
        </div>

        {/* Genre Dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
            <i className="fa-solid fa-masks-theater text-primary text-[10px]"></i> Genre Filter
          </label>
          <select
            value={activeFilters.genre || 'All Genres'}
            onChange={(e) => onFilterChange('genre', e.target.value)}
            className={`w-full ${selectCls}`}
          >
            {GENRES.map((g) => (
              <option key={g} value={g} className="bg-zinc-900 text-white">
                {g === 'All Genres' ? '🎭 All Genres' : `🎭 ${g}`}
              </option>
            ))}
          </select>
        </div>

        {/* Language Dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
            <i className="fa-solid fa-language text-primary text-[10px]"></i> Language Filter
          </label>
          <select
            value={activeFilters.language || 'All Languages'}
            onChange={(e) => onFilterChange('language', e.target.value)}
            className={`w-full ${selectCls}`}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l} className="bg-zinc-900 text-white">
                {l === 'All Languages' ? '🌐 All Languages' : `🌐 ${l}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
