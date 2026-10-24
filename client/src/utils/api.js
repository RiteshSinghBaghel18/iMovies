import axios from 'axios';

// Base API URL resolver with local fallback, protocol normalization, and cold-start support
const resolveApiUrl = () => {
  let envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (envUrl) {
    if (!/^https?:\/\//i.test(envUrl)) {
      envUrl = `https://${envUrl}`;
    }
    return envUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    // Check if custom URL stored in localStorage
    const stored = localStorage.getItem('imovies_api_url');
    if (stored && stored.trim()) {
      let s = stored.trim();
      if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
      return s.replace(/\/+$/, '');
    }

    // If running on localhost / 127.0.0.1, connect to local backend port 5000
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      return 'http://localhost:5000';
    }

    // In production on HTTPS (e.g. Vercel) where VITE_API_URL was not set
    console.warn(
      '[iMovies API] VITE_API_URL is not set. Ensure your Render backend URL is configured in your Vercel project environment settings.'
    );
  }

  return 'http://localhost:5000';
};

export const API_URL = resolveApiUrl();
export const API_BASE = `${API_URL}/api`;

export const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('imovies-token') : null;
  return { 'auth-token': token || '' };
};

// Pre-configured Axios instance with timeouts and automatic cold-start retries
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 45000, // 45 seconds to accommodate free cloud tier (Render) spin-up
});

// Auto-attach auth token header
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('imovies-token') : null;
    if (token && !config.headers['auth-token']) {
      config.headers['auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: automatically retries up to 2 times on cold starts / network glitches
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const isNetworkOrColdStart =
      !error.response || error.response.status === 502 || error.response.status === 503;

    if (config && isNetworkOrColdStart && (config.__retryCount || 0) < 2) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      console.warn(
        `[iMovies API] Retrying request (attempt ${config.__retryCount}/2) to ${config.url} due to network cold-start delay...`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000 * config.__retryCount));
      return apiClient(config);
    }

    if (!error.response) {
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_URL.startsWith('http://localhost')) {
        error.message = `Backend URL is pointing to ${API_URL} on a live HTTPS site. In your Vercel Project Settings -> Environment Variables, add VITE_API_URL=<your-render-url> and redeploy.`;
      } else {
        error.message =
          'Network error: unable to connect to server. If this is a free cloud deployment, the backend may be waking up from sleep (cold start). Please wait 30 seconds and try again.';
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth & Email Verification
  registerUser: (data) => apiClient.post(`${API_URL}/api/auth/register`, data),
  verifyEmail: (data) => apiClient.post(`${API_URL}/api/auth/verify-email`, data),
  resendVerification: (data) => apiClient.post(`${API_URL}/api/auth/resend-verification`, data),
  loginUser: (data) => apiClient.post(`${API_URL}/api/auth/login`, data),
  registerAdmin: (data) => apiClient.post(`${API_URL}/api/auth/admin/register`, data),
  loginAdmin: (data) => apiClient.post(`${API_URL}/api/auth/admin/login`, data),
  forgotPassword: (data) => apiClient.post(`${API_URL}/api/auth/forgot-password`, data),
  resetPassword: (data) => apiClient.post(`${API_URL}/api/auth/reset-password`, data),
  updateProfile: (data) => apiClient.put(`${API_URL}/api/auth/profile`, data, { headers: getAuthHeaders() }),
  validateToken: () => apiClient.get(`${API_URL}/api/auth/validate`, { headers: getAuthHeaders() }),
  getAdminStats: () => apiClient.get(`${API_URL}/api/auth/admin/stats`, { headers: getAuthHeaders() }),

  // Movies & Live TMDB Market
  getAllMovies: (params) => apiClient.get(`${API_URL}/api/movie`, { params }),
  getMovieSections: () => apiClient.get(`${API_URL}/api/movie/sections`),
  getMovieById: (id) => apiClient.get(`${API_URL}/api/movie/${id}`),
  getMarketNowPlaying: (params) => apiClient.get(`${API_URL}/api/movie/market/now-playing`, { params }),
  getMarketPopular: (params) => apiClient.get(`${API_URL}/api/movie/market/popular`, { params }),
  getMarketUpcoming: (params) => apiClient.get(`${API_URL}/api/movie/market/upcoming`, { params }),
  searchMarketMovies: (query) => apiClient.get(`${API_URL}/api/movie/market/search`, { params: { query } }),
  syncTmdbMovies: (limit = 20) => apiClient.post(`${API_URL}/api/movie/sync-tmdb`, { limit }, { headers: getAuthHeaders() }),
  addMovie: (data) => apiClient.post(`${API_URL}/api/movie/add`, data, { headers: getAuthHeaders() }),
  updateMovie: (id, data) => apiClient.put(`${API_URL}/api/movie/update/${id}`, data, { headers: getAuthHeaders() }),
  deleteMovie: (id) => apiClient.delete(`${API_URL}/api/movie/delete/${id}`, { headers: getAuthHeaders() }),

  // Theatres
  getAllTheatres: () => apiClient.get(`${API_URL}/api/theatre`),
  addTheatre: (data) => apiClient.post(`${API_URL}/api/theatre/add`, data, { headers: getAuthHeaders() }),
  deleteTheatre: (id) => apiClient.delete(`${API_URL}/api/theatre/delete/${id}`, { headers: getAuthHeaders() }),

  // Shows
  getAllShows: (params) => apiClient.get(`${API_URL}/api/shows`, { params }),
  getShowById: (showId) => apiClient.get(`${API_URL}/api/shows/${showId}`),
  getShowsByMovieId: (movieId) => apiClient.get(`${API_URL}/api/shows/movie/${movieId}`),
  addShow: (data) => apiClient.post(`${API_URL}/api/shows/add`, data, { headers: getAuthHeaders() }),
  deleteShow: (showId) => apiClient.delete(`${API_URL}/api/shows/delete/${showId}`, { headers: getAuthHeaders() }),

  // Bookings
  lockSeats: (data) => apiClient.post(`${API_URL}/api/bookings/lock`, data, { headers: getAuthHeaders() }),
  createBooking: (data) => apiClient.post(`${API_URL}/api/bookings/create`, data, { headers: getAuthHeaders() }),
  getUserBookings: () => apiClient.get(`${API_URL}/api/bookings/user`, { headers: getAuthHeaders() }),
  cancelBooking: (data) => apiClient.post(`${API_URL}/api/bookings/cancel`, data, { headers: getAuthHeaders() }),
  getAllBookings: () => apiClient.get(`${API_URL}/api/bookings/all`, { headers: getAuthHeaders() }),

  // Razorpay Payments
  createPaymentOrder: (data) => apiClient.post(`${API_URL}/api/payment/create-order`, data, { headers: getAuthHeaders() }),
  verifyPayment: (data) => apiClient.post(`${API_URL}/api/payment/verify`, data, { headers: getAuthHeaders() }),
  getPaymentConfig: () => apiClient.get(`${API_URL}/api/payment/config`),

  // Admin Transactions & Refund Management
  getAdminTransactions: (params) => apiClient.get(`${API_URL}/api/admin/transactions`, { params, headers: getAuthHeaders() }),
  issueRefund: (paymentId, data) => apiClient.post(`${API_URL}/api/admin/refund/${paymentId}`, data || {}, { headers: getAuthHeaders() }),
  getAdminDashboardStats: () => apiClient.get(`${API_URL}/api/admin/stats`, { headers: getAuthHeaders() }),

  // Admin User Directory & Account Management
  getAllUsers: (params) => apiClient.get(`${API_URL}/api/admin/users`, { params, headers: getAuthHeaders() }),
  deleteUser: (userId) => apiClient.delete(`${API_URL}/api/admin/users/${userId}`, { headers: getAuthHeaders() }),

  // Favorites
  toggleFavorite: (data) => apiClient.post(`${API_URL}/api/favorite/toggle`, data, { headers: getAuthHeaders() }),
  addFavorite: (data) => apiClient.post(`${API_URL}/api/favorite/add`, data, { headers: getAuthHeaders() }),
  removeFavorite: (data) => apiClient.delete(`${API_URL}/api/favorite/remove`, { data, headers: getAuthHeaders() }),
  getUserFavorites: () => apiClient.get(`${API_URL}/api/favorite/user`, { headers: getAuthHeaders() }),

  // Reviews
  addReview: (data) => apiClient.post(`${API_URL}/api/review/add`, data, { headers: getAuthHeaders() }),
  getReviewsByMovieId: (movieId) => apiClient.get(`${API_URL}/api/review/movie/${movieId}`),
  deleteReview: (id) => apiClient.delete(`${API_URL}/api/review/delete/${id}`, { headers: getAuthHeaders() }),
};

export default api;
