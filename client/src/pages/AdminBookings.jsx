import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import api from "../utils/api";
import Loader from "../components/Loader";
import DigitalTicketModal from "../components/DigitalTicketModal";
import { 
  Ticket, 
  Search, 
  ArrowLeft, 
  XCircle, 
  CheckCircle2, 
  Printer, 
  RefreshCw 
} from "lucide-react";
import { toast } from "react-toastify";

const AdminBookings = () => {
  const { data, loading, error, refetch } = useFetch("/bookings/admin/all");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const bookings = data?.bookings || [];

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = search.toLowerCase();
      return (
        b.bookingId.toLowerCase().includes(q) ||
        b.userEmail.toLowerCase().includes(q) ||
        b.movieDetails?.movieName?.toLowerCase().includes(q)
      );
    });
  }, [bookings, search]);

  const handleAdminCancel = async (bookingId) => {
    if (!window.confirm("Admin Action: Cancel this reservation and release seats back to inventory?")) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const res = await api.post(`/bookings/cancel/${bookingId}`);
      if (res.data.success) {
        toast.success(res.data.message || "Reservation cancelled.");
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel reservation.");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <Loader message="Auditing platform reservations..." />;
  }

  return (
    <div className="min-h-screen bg-cinema-darkest text-slate-100 pb-20">
      
      {/* Header */}
      <div className="bg-cinema-card border-b border-cinema-border/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Ticket className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Platform Reservation Moderation</h1>
            </div>

            <button
              onClick={() => refetch()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-300 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Search Bar */}
        <div className="bg-cinema-card border border-cinema-border rounded-2xl p-4 mb-6 shadow-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reservations by Booking ID, Customer Email, or Movie Name..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Master Bookings Table */}
        <div className="bg-cinema-card border border-cinema-border rounded-2xl overflow-hidden shadow-xl">
          {filteredBookings.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-12">No matching reservations found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Booking ID</th>
                    <th className="py-3.5 px-4">Customer Email</th>
                    <th className="py-3.5 px-4">Movie & Showtime</th>
                    <th className="py-3.5 px-4">Theatre</th>
                    <th className="py-3.5 px-4">Seats</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredBookings.map((b) => {
                    const isCancelled = b.paymentStatus === "Cancelled";

                    return (
                      <tr key={b.bookingId} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-red-400">#{b.bookingId}</td>
                        <td className="py-3.5 px-4 font-medium">{b.userEmail}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white">{b.movieDetails?.movieName || "Movie"}</p>
                          <p className="text-[10px] text-slate-400">{b.showDate} • {b.showTime}</p>
                        </td>
                        <td className="py-3.5 px-4">{b.theatreDetails?.theatreName || "Multiplex"}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                          {b.selectedSeats?.join(", ")}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-amber-400">₹{b.totalAmount}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isCancelled
                                ? "bg-slate-800 text-slate-400"
                                : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {b.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedTicket(b)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Printer className="w-3 h-3" />
                              Pass
                            </button>

                            {!isCancelled && (
                              <button
                                type="button"
                                disabled={cancellingId === b.bookingId}
                                onClick={() => handleAdminCancel(b.bookingId)}
                                className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-semibold transition-all disabled:opacity-50"
                              >
                                {cancellingId === b.bookingId ? "Cancelling..." : "Cancel"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {selectedTicket && (
        <DigitalTicketModal
          booking={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

    </div>
  );
};

export default AdminBookings;
