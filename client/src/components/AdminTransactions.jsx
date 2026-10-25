import React, { useState, useMemo } from "react";
import useFetch from "../hooks/useFetch";
import api from "../utils/api";
import Loader from "./Loader";
import DigitalTicketModal from "./DigitalTicketModal";
import { 
  CreditCard, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Printer, 
  RefreshCw, 
  ShieldCheck,
  TrendingDown,
  DollarSign,
  ArrowRight,
  Filter
} from "lucide-react";
import { toast } from "react-toastify";

const AdminTransactions = () => {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Refund Modal State
  const [refundModalBooking, setRefundModalBooking] = useState(null);
  const [refundReason, setRefundReason] = useState("Customer requested cancellation");
  const [processingRefund, setProcessingRefund] = useState(false);

  const { data, loading, error, refetch } = useFetch(
    `/admin/transactions?status=${selectedStatus}&search=${encodeURIComponent(searchQuery)}`
  );

  const transactions = data?.transactions || [];
  const metrics = data?.metrics || {
    totalTransactions: 0,
    completedCount: 0,
    refundedCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
    totalRevenue: 0,
    totalRefunded: 0,
  };

  // Trigger backend refund
  const handleConfirmRefund = async () => {
    if (!refundModalBooking) return;
    setProcessingRefund(true);

    try {
      const paymentId = refundModalBooking.razorpayPaymentId || refundModalBooking.bookingId;
      const res = await api.post(`/admin/refund/${paymentId}`, {
        reason: refundReason,
        amount: refundModalBooking.totalAmount,
      });

      if (res.data.success) {
        toast.success(res.data.message || "Refund processed successfully!");
        setRefundModalBooking(null);
        refetch();
      } else {
        throw new Error(res.data.message || "Refund could not be completed.");
      }
    } catch (err) {
      console.error("[Refund Error]:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to process refund.");
    } finally {
      setProcessingRefund(false);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case "Refunded":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <RotateCcw className="w-3 h-3" />
            Refunded
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "Cancelled":
      case "Failed":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            {status || "Cancelled"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Total Revenue (Net)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">
            ₹{metrics.totalRevenue?.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">
            {metrics.completedCount} successful payments
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Total Refunded</span>
            <TrendingDown className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400">
            ₹{metrics.totalRefunded?.toLocaleString()}
          </p>
          <p className="text-[11px] text-purple-400/80">
            {metrics.refundedCount} transactions refunded
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Total Transactions</span>
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-white">
            {metrics.totalTransactions}
          </p>
          <p className="text-[11px] text-slate-400">
            {metrics.pendingCount} pending / {metrics.cancelledCount} cancelled
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Razorpay Test Gateway</span>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm font-bold text-white flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active & Verified</span>
          </p>
          <p className="text-[11px] text-slate-400 font-mono truncate">
            Key: rzp_test_TrN3oYMB...
          </p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-cinema-card border border-cinema-border rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Booking ID, Razorpay Payment ID, Customer Email, or Movie..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {["All", "Completed", "Refunded", "Pending", "Cancelled"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedStatus === st
                    ? "bg-primary text-black font-bold shadow-md shadow-orange-500/30"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {st}
              </button>
            ))}

            <button
              type="button"
              onClick={() => refetch()}
              title="Refresh transaction data"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors ml-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-cinema-card border border-cinema-border rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16">
            <Loader message="Loading transactions and refund audit..." />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Transactions Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No payment records match your active search and status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Booking ID</th>
                  <th className="py-3.5 px-4">Payment & Gateway IDs</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Movie & Seats</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {transactions.map((t) => {
                  const isEligibleForRefund = t.paymentStatus === "Completed";
                  const isRefunded = t.paymentStatus === "Refunded";

                  return (
                    <tr key={t.bookingId} className="hover:bg-slate-900/50 transition-colors">
                      
                      {/* Booking ID */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-red-400">#{t.bookingId}</span>
                      </td>

                      {/* Payment & Gateway IDs */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-200">
                          <span className="text-slate-400">PayID:</span>
                          <span className="text-primary font-semibold truncate max-w-[140px]">
                            {t.razorpayPaymentId || t.transactionId || "—"}
                          </span>
                        </div>
                        {t.razorpayOrderId && (
                          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                            <span>Ord:</span>
                            <span className="truncate max-w-[140px]">{t.razorpayOrderId}</span>
                          </div>
                        )}
                        {t.refundId && (
                          <div className="flex items-center gap-1 font-mono text-[10px] text-purple-400">
                            <span>Rfnd:</span>
                            <span className="truncate max-w-[140px]">{t.refundId}</span>
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white truncate max-w-[140px]">{t.userEmail}</p>
                        <p className="text-[10px] text-slate-400">{t.paymentMethod || "Razorpay"}</p>
                      </td>

                      {/* Movie & Seats */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white truncate max-w-[160px]">
                          {t.movieDetails?.movieName || "Movie"}
                        </p>
                        <p className="text-[11px] text-emerald-400 font-mono">
                          Seats: {t.selectedSeats?.join(", ") || "—"}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-black text-amber-400">₹{t.totalAmount}</span>
                        {isRefunded && (
                          <p className="text-[10px] text-purple-400 font-semibold">
                            (Refunded ₹{t.refundAmount || t.totalAmount})
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(t.paymentStatus)}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString()}
                        <span className="block text-[10px] text-slate-400">
                          {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* View Digital Pass */}
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(t)}
                            title="Inspect Digital E-Ticket Pass"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Printer className="w-3 h-3" />
                            Pass
                          </button>

                          {/* Issue Refund / Cancel Button */}
                          {isEligibleForRefund && (
                            <button
                              type="button"
                              onClick={() => {
                                setRefundModalBooking(t);
                                setRefundReason("Customer cancellation request via Admin");
                              }}
                              title="Process Razorpay refund & free up seats"
                              className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Issue Refund
                            </button>
                          )}

                          {isRefunded && (
                            <span className="text-[11px] font-semibold text-purple-400 px-2 py-1 bg-purple-500/10 rounded">
                              Refund Settled
                            </span>
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

      {/* CONFIRM REFUND INTERACTIVE MODAL */}
      {refundModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-cinema-card border border-cinema-border rounded-3xl p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Issue Razorpay Refund</h3>
                  <p className="text-xs text-slate-400">Booking #{refundModalBooking.bookingId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalBooking(null)}
                disabled={processingRefund}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Refund Snapshot */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-white">{refundModalBooking.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Movie & Theatre:</span>
                <span className="text-slate-200">
                  {refundModalBooking.movieDetails?.movieName} • {refundModalBooking.theatreDetails?.theatreName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Seats Reserved:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {refundModalBooking.selectedSeats?.join(", ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Gateway ID:</span>
                <span className="font-mono text-primary font-semibold">
                  {refundModalBooking.razorpayPaymentId || refundModalBooking.transactionId}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                <span className="font-bold text-white">Refund Amount:</span>
                <span className="text-xl font-black text-rose-400">₹{refundModalBooking.totalAmount}</span>
              </div>
            </div>

            {/* Refund Reason */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Refund Reason / Audit Note
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Customer cancelled via support, showtime rescheduled"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 leading-relaxed">
              ⚠️ <span className="font-bold">Important:</span> Executing this refund will invoke Razorpay's API (<code className="text-white">razorpay.payments.refund()</code>), set booking status to <strong className="text-white">Refunded</strong>, and immediately release seats <strong className="text-white">{refundModalBooking.selectedSeats?.join(", ")}</strong> back into the public seating map.
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRefundModalBooking(null)}
                disabled={processingRefund}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRefund}
                disabled={processingRefund}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {processingRefund ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Refund...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm & Process Refund</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Digital Ticket Modal */}
      {selectedTicket && (
        <DigitalTicketModal
          booking={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

    </div>
  );
};

export default AdminTransactions;
