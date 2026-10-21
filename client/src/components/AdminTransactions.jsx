import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { api } from '../utils/api';
import dayjs from 'dayjs';

function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalRefunded: 0,
    totalTransactions: 0,
    completedCount: 0,
    refundedCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Refund Modal State
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState(null);
  const [refundReason, setRefundReason] = useState('Customer requested refund');
  const [refundProcessing, setRefundProcessing] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminTransactions();
      const list = res.data?.transactions || res.data?.bookings || [];
      setTransactions(list);
      if (res.data?.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Error fetching admin transactions:', err);
      toast.error('Failed to load transaction records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions by status & search
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const status = (t.paymentStatus || 'Completed').toLowerCase();
      const matchesStatus =
        statusFilter === 'All' ? true : status === statusFilter.toLowerCase();

      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        (t.bookingId && t.bookingId.toLowerCase().includes(search)) ||
        (t.userEmail && t.userEmail.toLowerCase().includes(search)) ||
        (t.movieName && t.movieName.toLowerCase().includes(search)) ||
        (t.theatreName && t.theatreName.toLowerCase().includes(search)) ||
        (t.razorpayPaymentId && t.razorpayPaymentId.toLowerCase().includes(search)) ||
        (t.razorpayOrderId && t.razorpayOrderId.toLowerCase().includes(search));

      return matchesStatus && matchesSearch;
    });
  }, [transactions, statusFilter, searchTerm]);

  // Execute refund via backend API
  const handleConfirmRefund = async () => {
    if (!selectedBookingForRefund) return;

    const paymentIdentifier =
      selectedBookingForRefund.razorpayPaymentId || selectedBookingForRefund.bookingId;

    try {
      setRefundProcessing(true);
      const res = await api.issueRefund(paymentIdentifier, {
        amount: selectedBookingForRefund.totalAmount,
        reason: refundReason,
      });

      if (res.data?.success) {
        toast.success(
          `💸 Refund of ₹${selectedBookingForRefund.totalAmount} processed successfully! Seats released.`
        );
        setSelectedBookingForRefund(null);
        fetchTransactions();
      } else {
        toast.error(res.data?.message || 'Failed to process refund');
      }
    } catch (err) {
      console.error('Refund execution error:', err);
      toast.error(err.response?.data?.message || 'Error executing Razorpay refund');
    } finally {
      setRefundProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'Completed').toLowerCase();
    if (s === 'completed') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/40 flex items-center gap-1 w-fit">
          <i className="fa-solid fa-circle-check text-[10px]"></i>
          Completed
        </span>
      );
    }
    if (s === 'refunded') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-900 text-zinc-300 border border-zinc-700 flex items-center gap-1 w-fit">
          <i className="fa-solid fa-rotate-left text-[10px]"></i>
          Refunded
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-900 text-zinc-400 border border-zinc-700 flex items-center gap-1 w-fit">
          <i className="fa-solid fa-clock text-[10px] text-primary"></i>
          Pending
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center gap-1 w-fit">
        <i className="fa-solid fa-ban text-[10px]"></i>
        {status || 'Cancelled'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Summary Metrics Bar ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Settled Revenue */}
        <div className="bg-[#121216] p-5 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider block">
              Settled Revenue
            </span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              ₹{summary.totalRevenue.toLocaleString()}
            </span>
            <span className="text-[11px] text-primary flex items-center gap-1 mt-1 font-semibold">
              <i className="fa-solid fa-arrow-up"></i> {summary.completedCount} completed orders
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xl">
            💳
          </div>
        </div>

        {/* Metric 2: Total Refunded */}
        <div className="bg-[#121216] p-5 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider block">
              Total Refunded
            </span>
            <span className="text-2xl font-black text-zinc-300 font-mono mt-1 block">
              ₹{summary.totalRefunded.toLocaleString()}
            </span>
            <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-1 font-semibold">
              <i className="fa-solid fa-rotate-left text-primary"></i> {summary.refundedCount} transactions refunded
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center text-xl">
            💸
          </div>
        </div>

        {/* Metric 3: Active Transactions */}
        <div className="bg-[#121216] p-5 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider block">
              Total Transactions
            </span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              {summary.totalTransactions}
            </span>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Across Razorpay test gateway
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xl">
            📊
          </div>
        </div>

        {/* Metric 4: Pending Checkouts */}
        <div className="bg-[#121216] p-5 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider block">
              Pending Checkouts
            </span>
            <span className="text-2xl font-black text-zinc-300 font-mono mt-1 block">
              {summary.pendingCount}
            </span>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Awaiting payment authorization
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-primary flex items-center justify-center text-xl">
            ⏳
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ───────────────────────────── */}
      <div className="bg-[#121216] p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {['All', 'Completed', 'Refunded', 'Pending', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-primary text-white shadow-lg shadow-orange-950/40'
                  : 'bg-black/60 text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-xs"></i>
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search email, movie, payment ID..."
            className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-primary text-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white"
            >
              <i className="fa-solid fa-circle-xmark text-xs"></i>
            </button>
          )}
        </div>
      </div>

      {/* ── Transactions Data Table ───────────────────────────── */}
      <div className="bg-[#121216] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-black border-b border-zinc-800 text-zinc-400 uppercase font-mono tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Booking ID</th>
                <th className="py-3.5 px-4 font-semibold">Razorpay Payment ID</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Movie Title</th>
                <th className="py-3.5 px-4 font-semibold">Show Details</th>
                <th className="py-3.5 px-4 font-semibold">Seats</th>
                <th className="py-3.5 px-4 font-semibold">Amount</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading transaction records...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-gray-500 italic">
                    No transaction records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const bId = tx.bookingId || tx._id || 'N/A';
                  const isCompleted = (tx.paymentStatus || '').toLowerCase() === 'completed';
                  const isRefunded = (tx.paymentStatus || '').toLowerCase() === 'refunded';

                  return (
                    <tr key={bId} className="hover:bg-gray-900/50 transition">
                      {/* Booking ID */}
                      <td className="py-3 px-4 font-mono text-gray-300 font-semibold" title={bId}>
                        {bId.substring(0, 8)}...
                      </td>

                      {/* Razorpay Payment ID */}
                      <td className="py-3 px-4">
                        {tx.razorpayPaymentId ? (
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-700">
                            {tx.razorpayPaymentId}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4 text-white font-medium max-w-[150px] truncate" title={tx.userEmail}>
                        {tx.userEmail}
                      </td>

                      {/* Movie Title */}
                      <td className="py-3 px-4 font-semibold text-white max-w-[150px] truncate" title={tx.movieName}>
                        {tx.movieName || 'Movie Feature'}
                      </td>

                      {/* Show Details */}
                      <td className="py-3 px-4 text-gray-300">
                        <div>{tx.theatreName}</div>
                        <div className="text-[10px] text-gray-500">
                          {tx.showDate} • {tx.showTime}
                        </div>
                      </td>

                      {/* Seats */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[120px]">
                          {(tx.selectedSeats || []).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-700"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        ₹{tx.totalAmount}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(tx.paymentStatus)}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-gray-400 text-[11px]">
                        {dayjs(tx.createdAt).format('DD MMM, h:mm A')}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isCompleted ? (
                          <button
                            onClick={() => setSelectedBookingForRefund(tx)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/20 hover:bg-primary text-primary hover:text-black border border-primary/40 transition duration-150 flex items-center gap-1.5 ml-auto shadow-sm"
                            title="Process refund and release seats"
                          >
                            <i className="fa-solid fa-rotate-left text-[11px]"></i>
                            <span>Issue Refund</span>
                          </button>
                        ) : isRefunded ? (
                          <span
                            className="text-[11px] text-zinc-500 italic block font-mono"
                            title={`Refund ID: ${tx.refundId || 'N/A'}`}
                          >
                            Refunded ✓
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Interactive Refund Confirmation Modal ──────────────── */}
      {selectedBookingForRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fade-in">
          <div className="bg-[#0d0d11] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-lg">
                  💸
                </div>
                <div>
                  <h3 className="text-lg font-bold">Issue Booking Refund</h3>
                  <p className="text-xs text-zinc-400">Connected with Razorpay Payment Gateway</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingForRefund(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Booking Details Summary */}
            <div className="p-4 rounded-xl bg-[#050508] border border-zinc-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Booking ID:</span>
                <span className="font-mono text-white font-semibold">{selectedBookingForRefund.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Customer:</span>
                <span className="text-white font-semibold">{selectedBookingForRefund.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Movie Title:</span>
                <span className="text-white font-semibold">{selectedBookingForRefund.movieName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Seats to Release:</span>
                <span className="text-primary font-mono font-bold">
                  {(selectedBookingForRefund.selectedSeats || []).join(', ')}
                </span>
              </div>
              {selectedBookingForRefund.razorpayPaymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Razorpay Payment ID:</span>
                  <span className="font-mono text-zinc-300">{selectedBookingForRefund.razorpayPaymentId}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-800 pt-2 text-sm font-bold">
                <span className="text-gray-300">Refund Amount:</span>
                <span className="text-primary font-mono text-base">₹{selectedBookingForRefund.totalAmount}</span>
              </div>
            </div>

            {/* Refund Reason Input */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">
                Reason for Refund / Cancellation
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Customer cancelled show in advance"
                className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-orange-200 text-xs">
              <i className="fa-solid fa-triangle-exclamation mr-1.5 text-primary"></i>
              This will trigger a live Razorpay test-mode refund of <strong>₹{selectedBookingForRefund.totalAmount}</strong>, mark the reservation as <strong>Refunded</strong>, and immediately release the seats back to available status.
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBookingForRefund(null)}
                disabled={refundProcessing}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-zinc-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRefund}
                disabled={refundProcessing}
                className="px-5 py-2 rounded-none text-xs font-black bg-primary hover:bg-[#ff7700] text-black shadow-lg transition flex items-center gap-2"
              >
                {refundProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent animate-spin"></div>
                    <span>Processing Refund...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-rotate-left"></i>
                    <span>Confirm &amp; Process Refund</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTransactions;
