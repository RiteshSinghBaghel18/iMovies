import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { UserPlus, ArrowLeft, ShieldCheck, Mail, Lock, User } from "lucide-react";
import { toast } from "react-toastify";

const AddAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.length < 3 || password.length < 6) {
      toast.error("Please adhere to length requirements (Username 3-20, Password 6+).");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/admin/register", {
        username,
        email,
        password,
      });

      if (res.data.success) {
        toast.success(`Sub-admin ${username} registered successfully!`);
        navigate("/admin");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register admin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cinema-darkest text-slate-100 pb-20">
      
      <div className="bg-cinema-card border-b border-cinema-border/60 py-6">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Grant Administrator Privileges</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8">
        <div className="bg-cinema-card border border-cinema-border rounded-2xl p-6 sm:p-8 shadow-xl">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Admin Username (3-20 chars) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. cinema_manager"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Admin Corporate Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@imovies.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Secure Password (min 6 chars) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <Link
                to="/admin"
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? "Authorizing..." : "Create Admin Account"}</span>
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
};

export default AddAdmin;
