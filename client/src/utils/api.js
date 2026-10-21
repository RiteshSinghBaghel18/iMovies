import axios from 'axios';

const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('imovies-token');
  return { 'auth-token': token || '' };
};

export const api = {
  // Auth & Email Verification
  registerUser: (data) => axios.post(`${API_BASE}/auth/register`, data),
  verifyEmail: (data) => axios.post(`${API_BASE}/auth/verify-email`, data),
  resendVerification: (data) => axios.post(`${API_BASE}/auth/resend-verification`, data),
  loginUser: (data) => axios.post(`${API_BASE}/auth/login`, data),
  registerAdmin: (data) => axios.post(`${API_BASE}/auth/admin/register`, data),
  loginAdmin: (data) => axios.post(`${API_BASE}/auth/admin/login`, data),
  forgotPassword: (data) => axios.post(`${API_BASE}/auth/forgot-password`, data),
  resetPassword: (data) => axios.post(`${API_BASE}/auth/reset-password`, data),
  updateProfile: (data) => axios.put(`${API_BASE}/auth/profile`, data, { headers: getAuthHeaders() }),
  validateToken: () => axios.get(`${API_BASE}/auth/validate`, { headers: getAuthHeaders() }),
  getAdminStats: () => axios.get(`${API_BASE}/auth/admin/stats`, { headers: getAuthHeaders() }),
  
  // Movies & Live TMDB Market
  getAllMovies: (params) => axios.get(`${API_BASE}/movie`, { params }),
  getMovieSections: () => axios.get(`${API_BASE}/movie/sections`),
  getMovieById: (id) => axios.get(`${API_BASE}/movie/${id}`),
  getMarketNowPlaying: (params) => axios.get(`${API_BASE}/movie/market/now-playing`, { params }),
  getMarketPopular: (params) => axios.get(`${API_BASE}/movie/market/popular`, { params }),
  getMarketUpcoming: (params) => axios.get(`${API_BASE}/movie/market/upcoming`, { params }),
  searchMarketMovies: (query) => axios.get(`${API_BASE}/movie/market/search`, { params: { query } }),
  syncTmdbMovies: (limit = 20) => axios.post(`${API_BASE}/movie/sync-tmdb`, { limit }, { headers: getAuthHeaders() }),
  addMovie: (data) => axios.post(`${API_BASE}/movie/add`, data, { headers: getAuthHeaders() }),
  updateMovie: (id, data) => axios.put(`${API_BASE}/movie/update/${id}`, data, { headers: getAuthHeaders() }),
  deleteMovie: (id) => axios.delete(`${API_BASE}/movie/delete/${id}`, { headers: getAuthHeaders() }),
  
  // Theatres
  getAllTheatres: () => axios.get(`${API_BASE}/theatre`),
  addTheatre: (data) => axios.post(`${API_BASE}/theatre/add`, data, { headers: getAuthHeaders() }),
  deleteTheatre: (id) => axios.delete(`${API_BASE}/theatre/delete/${id}`, { headers: getAuthHeaders() }),
  
  // Shows
  getAllShows: (params) => axios.get(`${API_BASE}/shows`, { params }),
  getShowById: (showId) => axios.get(`${API_BASE}/shows/${showId}`),
  getShowsByMovieId: (movieId) => axios.get(`${API_BASE}/shows/movie/${movieId}`),
  addShow: (data) => axios.post(`${API_BASE}/shows/add`, data, { headers: getAuthHeaders() }),
  deleteShow: (showId) => axios.delete(`${API_BASE}/shows/delete/${showId}`, { headers: getAuthHeaders() }),
  
  // Bookings
  lockSeats: (data) => axios.post(`${API_BASE}/bookings/lock`, data, { headers: getAuthHeaders() }),
  createBooking: (data) => axios.post(`${API_BASE}/bookings/create`, data, { headers: getAuthHeaders() }),
  getUserBookings: () => axios.get(`${API_BASE}/bookings/user`, { headers: getAuthHeaders() }),
  cancelBooking: (data) => axios.post(`${API_BASE}/bookings/cancel`, data, { headers: getAuthHeaders() }),
  getAllBookings: () => axios.get(`${API_BASE}/bookings/all`, { headers: getAuthHeaders() }),
  
  // Razorpay Payments
  createPaymentOrder: (data) => axios.post(`${API_BASE}/payment/create-order`, data, { headers: getAuthHeaders() }),
  verifyPayment: (data) => axios.post(`${API_BASE}/payment/verify`, data, { headers: getAuthHeaders() }),
  getPaymentConfig: () => axios.get(`${API_BASE}/payment/config`),

  // Admin Transactions & Refund Management
  getAdminTransactions: (params) => axios.get(`${API_BASE}/admin/transactions`, { params, headers: getAuthHeaders() }),
  issueRefund: (paymentId, data) => axios.post(`${API_BASE}/admin/refund/${paymentId}`, data || {}, { headers: getAuthHeaders() }),
  getAdminDashboardStats: () => axios.get(`${API_BASE}/admin/stats`, { headers: getAuthHeaders() }),

  // Favorites
  toggleFavorite: (data) => axios.post(`${API_BASE}/favorite/toggle`, data, { headers: getAuthHeaders() }),
  addFavorite: (data) => axios.post(`${API_BASE}/favorite/add`, data, { headers: getAuthHeaders() }),
  removeFavorite: (data) => axios.delete(`${API_BASE}/favorite/remove`, { data, headers: getAuthHeaders() }),
  getUserFavorites: () => axios.get(`${API_BASE}/favorite/user`, { headers: getAuthHeaders() }),

  // Reviews
  addReview: (data) => axios.post(`${API_BASE}/review/add`, data, { headers: getAuthHeaders() }),
  getReviewsByMovieId: (movieId) => axios.get(`${API_BASE}/review/movie/${movieId}`),
  deleteReview: (id) => axios.delete(`${API_BASE}/review/delete/${id}`, { headers: getAuthHeaders() }),
};

export default api;
