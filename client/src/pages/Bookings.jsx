import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/Loader';
import { api } from '../utils/api';
import dayjs from 'dayjs';

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.getUserBookings();
      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.bookings || res.data?.data || [];
      setBookings(list);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load your booking passes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      const res = await api.cancelBooking({ bookingId });
      if (res.data?.success || res.status === 200) {
        toast.success('Booking cancelled successfully');
        fetchBookings();
      } else {
        toast.error(res.data?.message || 'Cancellation failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error cancelling reservation');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'Completed').toLowerCase();
    if (s === 'completed' || s === 'confirmed' || s === 'success') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/40 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Confirmed
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-900 text-zinc-400 border border-zinc-700 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> Pending
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-900 text-zinc-400 border border-zinc-700 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span> Cancelled
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <Loader />;

  return (
    <DashboardLayout activePage="/bookings">
      <style>{`
        @media print {
          header, footer, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .ticket-card { border: 1px solid #000 !important; color: #000 !important; background: #fff !important; break-inside: avoid; }
        }
        .notch-left {
          position: absolute;
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          background-color: #000000;
          border-radius: 50%;
        }
        .notch-right {
          position: absolute;
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          background-color: #000000;
          border-radius: 50%;
        }
      `}</style>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span className="text-primary text-3xl">🎟️</span>
              My Ticket Passes
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              View your active cinema admissions, seat numbers, and digital stubs.
            </p>
            <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1.5">
              <i className="fa-regular fa-envelope text-primary text-[11px]"></i>
              <span>Digital tickets are dispatched to your email. Didn't receive the email? Please check your spam or junk folder.</span>
            </div>
          </div>

          {bookings.length > 0 && (
            <button
              onClick={handlePrint}
              className="no-print self-start sm:self-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold rounded-lg border border-gray-700 flex items-center gap-2 transition"
            >
              <i className="fa-solid fa-print"></i>
              <span>Print All Tickets</span>
            </button>
          )}
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-card/40 rounded-2xl border border-gray-800 max-w-md mx-auto p-8">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-bold text-white mb-2">No Bookings Found</h3>
            <p className="text-gray-400 text-sm mb-6">
              You haven't reserved any cinema tickets yet. Explore now showing blockbusters and book your favorite seats!
            </p>
            <Link
              to="/home"
              className="px-6 py-2.5 bg-primary hover:bg-orange-500 text-black text-sm font-black rounded-xl transition inline-flex items-center gap-2"
            >
              <i className="fa-solid fa-film"></i>
              <span>Explore Movies</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {bookings.map((booking) => {
              const bId = booking.bookingId || booking._id || booking.id || 'N/A';
              const movieName = booking.movieName || booking.movieId?.movieName || 'Cinema Feature';
              const theatreName = booking.theatreName || booking.theatreId?.theatreName || 'iMovies Theatre';
              const showDate = booking.showDate || booking.bookingDate;
              const showTime = booking.showTime || '18:00';
              // Backend saves field as 'selectedSeats'
              const seatList = Array.isArray(booking.selectedSeats) && booking.selectedSeats.length > 0
                ? booking.selectedSeats
                : Array.isArray(booking.seats)
                ? booking.seats
                : Array.isArray(booking.seatNumbers)
                ? booking.seatNumbers
                : [];
              const totalAmount = booking.totalAmount || 0;
              // Backend uses paymentStatus enum: Pending | Completed | Failed
              const status = booking.paymentStatus || booking.status || 'Completed';
              const isCancelled = status.toLowerCase() === 'failed' || status.toLowerCase() === 'cancelled';

              return (
                <div
                  key={bId}
                  className="ticket-card relative bg-card/90 rounded-2xl border border-gray-800 p-6 shadow-2xl flex flex-col justify-between overflow-hidden group hover:border-primary/50 transition"
                >
                  {/* Decorative stub notches */}
                  <div className="notch-left hidden sm:block border-r border-gray-800"></div>
                  <div className="notch-right hidden sm:block border-l border-gray-800"></div>

                  <div>
                    {/* Header bar */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-800/80">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-primary font-bold block mb-1">
                          ADMIT {seatList.length || 1} • E-TICKET
                        </span>
                        <h3 className="text-xl font-black text-white">{movieName}</h3>
                        <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                          <i className="fa-solid fa-location-dot text-primary"></i>
                          <span>{theatreName}</span>
                        </p>
                      </div>
                      <div>{getStatusBadge(status)}</div>
                    </div>

                    {/* Show Timing Details */}
                    <div className="grid grid-cols-3 gap-4 py-4 border-b border-dashed border-gray-800 text-center">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">Date</span>
                        <span className="text-sm font-bold text-gray-200 mt-0.5 block">
                          {showDate ? dayjs(showDate).format('MMM D, YYYY') : 'Upcoming'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">Time</span>
                        <span className="text-sm font-bold text-primary mt-0.5 block">{showTime}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">Total Paid</span>
                        <span className="text-sm font-black text-white font-mono mt-0.5 block">
                          ₹{totalAmount}
                        </span>
                      </div>
                    </div>

                    {/* Seats Breakdown */}
                    <div className="py-4">
                      <span className="text-xs text-gray-400 font-semibold uppercase block mb-2">
                        Reserved Seats ({seatList.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {seatList.map((st, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md bg-gray-900 border border-gray-700 text-white font-mono font-bold text-xs"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ticket Footer / Perforated Stub Actions */}
                  <div className="pt-4 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="font-mono text-gray-500 text-[11px] truncate max-w-[200px]">
                      ID: {bId}
                    </div>

                    <div className="flex items-center gap-3 no-print">
                      {!isCancelled && (
                        <button
                          onClick={() => handleCancel(bId)}
                          disabled={cancellingId === bId}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-primary border border-primary/40 hover:bg-primary/20 transition disabled:opacity-50"
                        >
                          {cancellingId === bId ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      )}
                      <button
                        onClick={handlePrint}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
                      >
                        <i className="fa-solid fa-download mr-1"></i> Pass
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Bookings;
