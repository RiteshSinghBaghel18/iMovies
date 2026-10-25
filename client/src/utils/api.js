import axios from "axios";

// In production (e.g., Vercel), uses VITE_API_URL if configured, otherwise defaults to '/api'
const rawApiUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = rawApiUrl
  ? (rawApiUrl.replace(/\/+$/, "").endsWith("/api")
      ? rawApiUrl.replace(/\/+$/, "")
      : `${rawApiUrl.replace(/\/+$/, "")}/api`)
  : "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers["auth-token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token invalid or expired
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/landing" && currentPath !== "/") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
