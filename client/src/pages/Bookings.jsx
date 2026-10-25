import React, { useState } from "react";
import useFetch from "../hooks/useFetch";
import api from "../utils/api";
import Loader from "../components/Loader";
import DigitalTicketModal from "../components/DigitalTicketModal";
import { 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  Printer, 
  XCircle, 
  CheckCircle2, 
  AlertCircle,
  Film
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const Bookings = () => {
  const { data, loading, error, refetch } = useFetch("/bookings/my-bookings");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const bookings = data?.bookings || [];

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking? Your seats will be released immediately and full refund will be processed.")) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const res = await api.post(`/bookings/cancel/${bookingId}`);
      if (res.data.success) {
        toast.success(res.data.message || "Booking cancelled and refund initiated.");
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <Loader message="Fetching your bookings & tickets..." />;
  }

  return (
    <div className="min-h-screen bg-cinema-darkest text-slate-100 pb-20">
      
      {/* Header */}
      <div className="bg-cinema-card border-b border-cinema-border/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff6600]/15 text-[#ff6600] flex items-center justify-center border border-[#ff6600]/30">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase text-[#ff6600]">Tickets & Passes</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">My Movie Tickets</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                View your confirmed reservations, download digital passes, or manage bookings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-cinema-card rounded-3xl border border-cinema-border p-8 max-w-xl mx-auto">
            <Film className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Bookings Yet</h3>
            <p className="text-sm text-slate-400 mb-6">
              You haven't booked any movie tickets yet. Explore now showing blockbusters and pick your favorite seats!
            </p>
            <Link
              to="/home"
              className="px-6 py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff7700] text-slate-950 font-black text-sm shadow-lg shadow-[#ff6600]/30 transition-all inline-block"
            >
              Explore Movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map((booking) => {
              const isCancelled = booking.paymentStatus === "Cancelled";

              return (
                <div
                  key={booking.bookingId}
                  className={`bg-cinema-card border rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all hover:border-slate-700 ${
                    isCancelled ? "border-slate-800 opacity-60" : "border-cinema-border"
                  }`}
                >
                  <div className="p-6">
                    {/* Top status & ID */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Booking ID
                        </span>
                        <p className="text-xs font-mono font-bold text-red-400">
                          #{booking.bookingId}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isCancelled
                            ? "bg-slate-800 text-slate-400 border border-slate-700"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {isCancelled ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Cancelled
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Confirmed
                          </>
                        )}
                      </span>
                    </div>

                    {/* Movie and Venue details */}
                    <div className="flex gap-4 items-start">
                      {booking.movieDetails?.posterUrl && (
                        <img
                          src={booking.movieDetails.posterUrl}
                          alt={booking.movieDetails.movieName}
                          className="w-16 h-24 object-cover rounded-lg border border-slate-800 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">
                          {booking.movieDetails?.movieName || "Movie"}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {booking.movieDetails?.language} • {booking.movieDetails?.duration}
                        </p>
                        <p className="text-xs text-amber-400 font-medium flex items-center gap-1 mt-2 truncate">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          {booking.theatreDetails?.theatreName || "Multiplex"}
                        </p>
                      </div>
                    </div>

                    {/* Showtime & Seats summary */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 mt-4 text-xs">
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-semibold">Show Date & Time</p>
                        <p className="font-bold text-slate-200 mt-0.5">
                          {booking.showDate} at {booking.showTime}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-semibold">Reserved Seats</p>
                        <p className="font-bold text-emerald-400 mt-0.5">
                          {booking.selectedSeats?.join(", ") || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Price Footer */}
                  <div className="px-6 py-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Amount Paid</span>
                      <p className="text-lg font-extrabold text-amber-400">₹{booking.totalAmount}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCancelled && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(booking)}
                            className="px-4 py-2 rounded-xl bg-[#ff6600] hover:bg-[#ff7700] text-slate-950 font-black text-xs shadow-md shadow-[#ff6600]/20 flex items-center gap-1.5 transition-all"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            View Digital Pass
                          </button>

                          <button
                            type="button"
                            disabled={cancellingId === booking.bookingId}
                            onClick={() => handleCancelBooking(booking.bookingId)}
                            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            {cancellingId === booking.bookingId ? "Cancelling..." : "Cancel"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <DigitalTicketModal
          booking={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

    </div>
  );
};

export default Bookings;
