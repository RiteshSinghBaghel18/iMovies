import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import Loader from "./components/Loader";
import UserProtection from "./components/UserProtection";
import AdminProtection from "./components/AdminProtection";

// Lazy Loaded Pages
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Home = lazy(() => import("./pages/Home"));
const MovieDetails = lazy(() => import("./pages/MovieDetails"));
const MovieShows = lazy(() => import("./pages/MovieShows"));
const SeatMap = lazy(() => import("./pages/SeatMap"));
const Bookings = lazy(() => import("./pages/Bookings"));
const FavoriteShows = lazy(() => import("./pages/FavoriteShows"));
const Profile = lazy(() => import("./pages/Profile"));

// Admin Lazy Loaded Pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AddMovie = lazy(() => import("./pages/AddMovie"));
const AddTheatre = lazy(() => import("./pages/AddTheatre"));
const AddShow = lazy(() => import("./pages/AddShow"));
const AddAdmin = lazy(() => import("./pages/AddAdmin"));
const AdminBookings = lazy(() => import("./pages/AdminBookings"));
const AdminTransactionsPage = lazy(() => import("./pages/AdminTransactionsPage"));

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="flex flex-col min-h-screen bg-cinema-darkest text-slate-100 font-sans selection:bg-primary selection:text-black">
            <Header />

            <main className="flex-1">
              <Suspense fallback={<Loader message="Loading cinematic experience..." />}>
                <Routes>
                  {/* Default & Public Routes */}
                  <Route path="/" element={<Navigate to="/landing" replace />} />
                  <Route path="/landing" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* User Protected Routes */}
                  <Route
                    path="/home"
                    element={
                      <UserProtection>
                        <Home />
                      </UserProtection>
                    }
                  />
                  <Route
                    path="/moviedetails/:movieId"
                    element={
                      <UserProtection>
                        <MovieDetails />
                      </UserProtection>
                    }
                  />
                  <Route
                    path="/movieshows/:movieId"
                    element={
                      <UserProtection>
                        <MovieShows />
                      </UserProtection>
                    }
                  />
                  <Route
                    path="/seatslug/:showId"
                    element={
                      <UserProtection>
                        <SeatMap />
                      </UserProtection>
                    }
                  />
                  <Route
                    path="/bookings"
                    element={
                      <UserProtection>
                        <Bookings />
                      </UserProtection>
                    }
                  />
                  <Route
                    path="/favoriteshows"
                    element={
                      <UserProtection>
                        <FavoriteShows />
                      </UserProtection>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <UserProtection>
                        <Profile />
                      </UserProtection>
                    }
                  />

                  {/* Admin Protected Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminProtection>
                        <AdminDashboard />
                      </AdminProtection>
                    }
                  />
                  <Route
                    path="/addmovie"
                    element={
                      <AdminProtection>
                        <AddMovie />
                      </AdminProtection>
                    }
                  />
                  <Route
                    path="/addtheatre"
                    element={
                      <AdminProtection>
                        <AddTheatre />
                      </AdminProtection>
                    }
                  />
                  <Route
                    path="/addshow"
                    element={
                      <AdminProtection>
                        <AddShow />
                      </AdminProtection>
                    }
                  />
                  <Route
                    path="/addadmin"
                    element={
                      <AdminProtection>
                        <AddAdmin />
                      </AdminProtection>
                    }
                  />
                  <Route
                    path="/adminbookings"
                    element={
                      <AdminProtection>
                        <AdminBookings />
                      </AdminProtection>
                    }
                  />
                  <Route
                    path="/admin/transactions"
                    element={
                      <AdminProtection>
                        <AdminTransactionsPage />
                      </AdminProtection>
                    }
                  />

                  {/* Catch-all 404 Route */}
                  <Route path="*" element={<Navigate to="/landing" replace />} />
                </Routes>
              </Suspense>
            </main>

            <Footer />

            {/* Global Toast Notifications */}
            <ToastContainer
              position="top-right"
              autoClose={3500}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
