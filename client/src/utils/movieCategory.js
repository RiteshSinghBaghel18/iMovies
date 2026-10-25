/**
 * Helper to strictly partition movies into "Upcoming Releases" vs "Now in Theatres".
 * 
 * Rules:
 * - For admin-added or custom movies: strictly determined by releaseDate
 *   (releaseDate > today => upcoming; releaseDate <= today => now in theatres).
 * - For TMDB titles: if category === "upcoming" OR releaseDate is in the future => upcoming.
 * - Otherwise => now in theatres.
 */
export const isUpcomingMovie = (movie) => {
  if (!movie) return false;

  // Admin-added or custom movies strictly determined by releaseDate
  if (movie.isAdminAdded || movie.isCustom) {
    if (!movie.releaseDate) return false;
    const release = new Date(movie.releaseDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return release > today;
  }

  // TMDB upcoming releases
  if (movie.category === "upcoming") {
    return true;
  }

  // Future release date check
  if (movie.releaseDate) {
    const release = new Date(movie.releaseDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (release > today) {
      return true;
    }
  }

  return false;
};
