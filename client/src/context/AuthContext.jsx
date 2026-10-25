import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [role, setRole] = useState(() => localStorage.getItem("role") || null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount if token exists
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await api.get("/auth/me");
          if (res.data.success) {
            setUser(res.data.user);
            setRole(res.data.role);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            localStorage.setItem("role", res.data.role);
          }
        } catch (err) {
          console.warn("Auth check failed:", err.message);
          logout(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password, isAdmin = false) => {
    try {
      const endpoint = isAdmin ? "/auth/admin/login" : "/auth/login";
      const res = await api.post(endpoint, { email, password });

      if (res.data.success) {
        const receivedToken = res.data.token;
        const loggedUser = res.data.user || res.data.admin;
        const userRole = isAdmin ? "admin" : "user";

        setToken(receivedToken);
        setUser(loggedUser);
        setRole(userRole);

        localStorage.setItem("token", receivedToken);
        localStorage.setItem("user", JSON.stringify(loggedUser));
        localStorage.setItem("role", userRole);

        toast.success(res.data.message || `Welcome back, ${loggedUser.username}!`);
        return { success: true, role: userRole };
      }
    } catch (err) {
      const data = err.response?.data || {};
      const msg = data.message || "Login failed. Please check your credentials.";
      toast.error(msg);
      return {
        success: false,
        message: msg,
        requiresVerification: Boolean(data.requiresVerification),
        email: data.email || email,
      };
    }
  };

  const register = async (username, email, password, isAdmin = false) => {
    try {
      const endpoint = isAdmin ? "/auth/admin/register" : "/auth/register";
      const res = await api.post(endpoint, { username, email, password });

      if (res.data.success) {
        if (res.data.requiresVerification) {
          toast.success(res.data.message || "Account created! Please check your email for the verification link.");
          return {
            success: true,
            requiresVerification: true,
            emailDelivered: res.data.emailDelivered,
            devOtp: res.data.devOtp,
            ipNotice: res.data.ipNotice,
            user: res.data.user,
            role: "user",
          };
        }

        const receivedToken = res.data.token;
        const registeredUser = res.data.user || res.data.admin;
        const userRole = isAdmin ? "admin" : "user";

        setToken(receivedToken);
        setUser(registeredUser);
        setRole(userRole);

        localStorage.setItem("token", receivedToken);
        localStorage.setItem("user", JSON.stringify(registeredUser));
        localStorage.setItem("role", userRole);

        toast.success(res.data.message || "Registration successful!");
        return { success: true, role: userRole };
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed.";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      if (res.data.success) {
        const receivedToken = res.data.token;
        const verifiedUser = res.data.user;

        setToken(receivedToken);
        setUser(verifiedUser);
        setRole("user");

        localStorage.setItem("token", receivedToken);
        localStorage.setItem("user", JSON.stringify(verifiedUser));
        localStorage.setItem("role", "user");

        toast.success(res.data.message || "Account verified successfully!");
        return { success: true, user: verifiedUser };
      }
    } catch (err) {
      const msg = err.response?.data?.message || "OTP verification failed. Please try again.";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = (showToast = true) => {
    setToken(null);
    setUser(null);
    setRole(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    if (showToast) {
      toast.info("Logged out successfully.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAdmin: role === "admin",
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
