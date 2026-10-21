import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Loader from './components/Loader';
import UserProtection from './utils/UserProtection';
import AdminProtection from './utils/AdminProtection';
import { ThemeProvider } from './utils/ThemeContext';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const MovieDetails = lazy(() => import('./pages/MovieDetails'));
const MovieShows = lazy(() => import('./pages/MovieShows'));
const SeatSlug = lazy(() => import('./pages/SeatSlug'));
const Bookings = lazy(() => import('./pages/Bookings'));
const FavoriteShows = lazy(() => import('./pages/FavoriteShows'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const AddMovie = lazy(() => import('./pages/AddMovie'));
const AddTheatre = lazy(() => import('./pages/AddTheatre'));
const AddShow = lazy(() => import('./pages/AddShow'));
const AddAdmin = lazy(() => import('./pages/AddAdmin'));
const AdminBookings = lazy(() => import('./pages/AdminBookings'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/landing" />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/home" element={<UserProtection><Home /></UserProtection>} />
            <Route path="/moviedetails/:movieId" element={<UserProtection><MovieDetails /></UserProtection>} />
            <Route path="/movieshows/:movieId" element={<UserProtection><MovieShows /></UserProtection>} />
            <Route path="/seatslug/:showId" element={<UserProtection><SeatSlug /></UserProtection>} />
            <Route path="/bookings" element={<UserProtection><Bookings /></UserProtection>} />
            <Route path="/favoriteshows" element={<UserProtection><FavoriteShows /></UserProtection>} />
            <Route path="/profile" element={<UserProtection><Profile /></UserProtection>} />
            <Route path="/admin" element={<AdminProtection><Admin /></AdminProtection>} />
            <Route path="/addmovie" element={<AdminProtection><AddMovie /></AdminProtection>} />
            <Route path="/addtheatre" element={<AdminProtection><AddTheatre /></AdminProtection>} />
            <Route path="/addshow" element={<AdminProtection><AddShow /></AdminProtection>} />
            <Route path="/addadmin" element={<AdminProtection><AddAdmin /></AdminProtection>} />
            <Route path="/adminbookings" element={<AdminProtection><AdminBookings /></AdminProtection>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

