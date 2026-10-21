import axios from 'axios';

// Base API URL configured via environment variable with local fallback
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
export const API_BASE = `${API_URL}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('imovies-token');
  return { 'auth-token': token || '' };
};

export const api = {
  // Auth & Email Verification
  registerUser: (data) => axios.post(`${API_URL}/api/auth/register`, data),
  verifyEmail: (data) => axios.post(`${API_URL}/api/auth/verify-email`, data),
  resendVerification: (data) => axios.post(`${API_URL}/api/auth/resend-verification`, data),
  loginUser: (data) => axios.post(`${API_URL}/api/auth/login`, data),
  registerAdmin: (data) => axios.post(`${API_URL}/api/auth/admin/register`, data),
  loginAdmin: (data) => axios.post(`${API_URL}/api/auth/admin/login`, data),
  forgotPassword: (data) => axios.post(`${API_URL}/api/auth/forgot-password`, data),
  resetPassword: (data) => axios.post(`${API_URL}/api/auth/reset-password`, data),
  updateProfile: (data) => axios.put(`${API_URL}/api/auth/profile`, data, { headers: getAuthHeaders() }),
  validateToken: () => axios.get(`${API_URL}/api/auth/validate`, { headers: getAuthHeaders() }),
  getAdminStats: () => axios.get(`${API_URL}/api/auth/admin/stats`, { headers: getAuthHeaders() }),
  
  // Movies & Live TMDB Market
  getAllMovies: (params) => axios.get(`${API_URL}/api/movie`, { params }),
  getMovieSections: () => axios.get(`${API_URL}/api/movie/sections`),
  getMovieById: (id) => axios.get(`${API_URL}/api/movie/${id}`),
  getMarketNowPlaying: (params) => axios.get(`${API_URL}/api/movie/market/now-playing`, { params }),
  getMarketPopular: (params) => axios.get(`${API_URL}/api/movie/market/popular`, { params }),
  getMarketUpcoming: (params) => axios.get(`${API_URL}/api/movie/market/upcoming`, { params }),
  searchMarketMovies: (query) => axios.get(`${API_URL}/api/movie/market/search`, { params: { query } }),
  syncTmdbMovies: (limit = 20) => axios.post(`${API_URL}/api/movie/sync-tmdb`, { limit }, { headers: getAuthHeaders() }),
  addMovie: (data) => axios.post(`${API_URL}/api/movie/add`, data, { headers: getAuthHeaders() }),
  updateMovie: (id, data) => axios.put(`${API_URL}/api/movie/update/${id}`, data, { headers: getAuthHeaders() }),
  deleteMovie: (id) => axios.delete(`${API_URL}/api/movie/delete/${id}`, { headers: getAuthHeaders() }),
  
  // Theatres
  getAllTheatres: () => axios.get(`${API_URL}/api/theatre`),
  addTheatre: (data) => axios.post(`${API_URL}/api/theatre/add`, data, { headers: getAuthHeaders() }),
  deleteTheatre: (id) => axios.delete(`${API_URL}/api/theatre/delete/${id}`, { headers: getAuthHeaders() }),
  
  // Shows
  getAllShows: (params) => axios.get(`${API_URL}/api/shows`, { params }),
  getShowById: (showId) => axios.get(`${API_URL}/api/shows/${showId}`),
  getShowsByMovieId: (movieId) => axios.get(`${API_URL}/api/shows/movie/${movieId}`),
  addShow: (data) => axios.post(`${API_URL}/api/shows/add`, data, { headers: getAuthHeaders() }),
  deleteShow: (showId) => axios.delete(`${API_URL}/api/shows/delete/${showId}`, { headers: getAuthHeaders() }),
  
  // Bookings
  lockSeats: (data) => axios.post(`${API_URL}/api/bookings/lock`, data, { headers: getAuthHeaders() }),
  createBooking: (data) => axios.post(`${API_URL}/api/bookings/create`, data, { headers: getAuthHeaders() }),
  getUserBookings: () => axios.get(`${API_URL}/api/bookings/user`, { headers: getAuthHeaders() }),
  cancelBooking: (data) => axios.post(`${API_URL}/api/bookings/cancel`, data, { headers: getAuthHeaders() }),
  getAllBookings: () => axios.get(`${API_URL}/api/bookings/all`, { headers: getAuthHeaders() }),
  
  // Razorpay Payments
  createPaymentOrder: (data) => axios.post(`${API_URL}/api/payment/create-order`, data, { headers: getAuthHeaders() }),
  verifyPayment: (data) => axios.post(`${API_URL}/api/payment/verify`, data, { headers: getAuthHeaders() }),
  getPaymentConfig: () => axios.get(`${API_URL}/api/payment/config`),

  // Admin Transactions & Refund Management
  getAdminTransactions: (params) => axios.get(`${API_URL}/api/admin/transactions`, { params, headers: getAuthHeaders() }),
  issueRefund: (paymentId, data) => axios.post(`${API_URL}/api/admin/refund/${paymentId}`, data || {}, { headers: getAuthHeaders() }),
  getAdminDashboardStats: () => axios.get(`${API_URL}/api/admin/stats`, { headers: getAuthHeaders() }),

  // Favorites
  toggleFavorite: (data) => axios.post(`${API_URL}/api/favorite/toggle`, data, { headers: getAuthHeaders() }),
  addFavorite: (data) => axios.post(`${API_URL}/api/favorite/add`, data, { headers: getAuthHeaders() }),
  removeFavorite: (data) => axios.delete(`${API_URL}/api/favorite/remove`, { data, headers: getAuthHeaders() }),
  getUserFavorites: () => axios.get(`${API_URL}/api/favorite/user`, { headers: getAuthHeaders() }),

  // Reviews
  addReview: (data) => axios.post(`${API_URL}/api/review/add`, data, { headers: getAuthHeaders() }),
  getReviewsByMovieId: (movieId) => axios.get(`${API_URL}/api/review/movie/${movieId}`),
  deleteReview: (id) => axios.delete(`${API_URL}/api/review/delete/${id}`, { headers: getAuthHeaders() }),
};

export default api;
