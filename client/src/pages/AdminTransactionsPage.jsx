import React from "react";
import { Link } from "react-router-dom";
import AdminTransactions from "../components/AdminTransactions";
import { ArrowLeft, CreditCard, RotateCcw, ShieldCheck } from "lucide-react";

const AdminTransactionsPage = () => {
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
            Back to Admin Portal
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Razorpay Transactions & Refund Management</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Audit payment gateways, track live settlement statuses, and issue verified refunds
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Razorpay Test Mode Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <AdminTransactions />
      </div>

    </div>
  );
};

export default AdminTransactionsPage;
