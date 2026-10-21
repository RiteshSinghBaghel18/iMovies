/**
 * movieHistory.js — Manages User Viewed Movies & User Searched Movies in localStorage
 */

const VIEWED_KEY = 'imovies_viewed_movies';
const SEARCHED_MOVIES_KEY = 'imovies_searched_movies';
const SEARCH_QUERIES_KEY = 'imovies_search_queries';

export const recordMovieView = (movie) => {
  if (!movie) return;
  const id = movie._id || movie.id;
  if (!id) return;

  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((m) => (m._id || m.id) !== id);
    const updated = [
      {
        _id: id,
        id,
        movieName: movie.movieName,
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl,
        rating: movie.rating,
        genres: movie.genres,
        language: movie.language,
        duration: movie.duration,
        certification: movie.certification,
        trailerUrl: movie.trailerUrl,
        viewedAt: new Date().toISOString(),
      },
      ...filtered,
    ].slice(0, 16);

    localStorage.setItem(VIEWED_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('imovies_viewed_updated', { detail: updated }));
  } catch (err) {
    console.warn('Failed to save viewed movie:', err);
  }
};

export const getViewedMovies = () => {
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearViewedMovies = () => {
  try {
    localStorage.removeItem(VIEWED_KEY);
    window.dispatchEvent(new CustomEvent('imovies_viewed_updated', { detail: [] }));
  } catch (err) {
    console.warn('Failed to clear viewed movies:', err);
  }
};

export const recordMovieSearch = (query, movies = []) => {
  if (!query || !query.trim()) return;
  const cleanQuery = query.trim();

  try {
    // 1. Record search query string
    const rawQueries = localStorage.getItem(SEARCH_QUERIES_KEY);
    const existingQueries = rawQueries ? JSON.parse(rawQueries) : [];
    const filteredQueries = existingQueries.filter((q) => q.toLowerCase() !== cleanQuery.toLowerCase());
    const updatedQueries = [cleanQuery, ...filteredQueries].slice(0, 10);
    localStorage.setItem(SEARCH_QUERIES_KEY, JSON.stringify(updatedQueries));

    // 2. If matching movies returned, record top matching movies into searched movies pool
    if (Array.isArray(movies) && movies.length > 0) {
      const rawMovies = localStorage.getItem(SEARCHED_MOVIES_KEY);
      const existingMovies = rawMovies ? JSON.parse(rawMovies) : [];
      const newMap = new Map();
      movies.forEach((m) => {
        const id = m._id || m.id;
        if (id) newMap.set(id, m);
      });
      existingMovies.forEach((m) => {
        const id = m._id || m.id;
        if (id && !newMap.has(id)) newMap.set(id, m);
      });
      const updatedMovies = Array.from(newMap.values()).slice(0, 16);
      localStorage.setItem(SEARCHED_MOVIES_KEY, JSON.stringify(updatedMovies));
    }

    window.dispatchEvent(new CustomEvent('imovies_search_updated'));
  } catch (err) {
    console.warn('Failed to record search history:', err);
  }
};

export const getSearchedMovies = () => {
  try {
    const raw = localStorage.getItem(SEARCHED_MOVIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getSearchQueries = () => {
  try {
    const raw = localStorage.getItem(SEARCH_QUERIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearSearchedMovies = () => {
  try {
    localStorage.removeItem(SEARCHED_MOVIES_KEY);
    localStorage.removeItem(SEARCH_QUERIES_KEY);
    window.dispatchEvent(new CustomEvent('imovies_search_updated'));
  } catch (err) {
    console.warn('Failed to clear searched movies:', err);
  }
};
