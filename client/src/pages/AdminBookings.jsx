import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import AdminTransactions from '../components/AdminTransactions';

function AdminBookings() {
  return (
    <DashboardLayout activePage="/adminbookings">
      <div className="space-y-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-6 bg-primary rounded-full"></span>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                <span>Transactions &amp; Refund Management</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-mono font-bold">
                  Razorpay Live
                </span>
              </h1>
            </div>
            <p className="text-zinc-400 text-sm mt-1">
              Audit user bookings, payment signatures, settled amounts, and execute instant Razorpay refunds with automatic seat release.
            </p>
          </div>
        </div>

        {/* Transactions Component with Metrics, Search, Table & Refund Modal */}
        <AdminTransactions />
      </div>
    </DashboardLayout>
  );
}

export default AdminBookings;
