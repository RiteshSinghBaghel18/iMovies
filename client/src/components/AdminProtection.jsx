import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

const AdminProtection = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader message="Verifying administrator credentials..." />;
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" state={{ from: location, requireAdmin: true }} replace />;
  }

  return children;
};

export default AdminProtection;
