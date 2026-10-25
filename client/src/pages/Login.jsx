import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Film, Lock, Mail, ShieldCheck, AlertTriangle, Send, X, CheckCircle2, KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import api from "../utils/api";

const Login = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Unverified email banner state
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resendingVerification, setResendingVerification] = useState(false);

  // OTP modal state on Login
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loginOtp, setLoginOtp] = useState("");
  const [loginOtpLoading, setLoginOtpLoading] = useState(false);

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || (isAdmin ? "/admin" : "/home");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setUnverifiedEmail(null);
    const result = await login(email, password, isAdmin);
    setLoading(false);

    if (result?.success) {
      if (result.role === "admin") {
        navigate("/admin");
      } else {
        navigate(from === "/admin" ? "/home" : from);
      }
    } else if (result?.requiresVerification) {
      setUnverifiedEmail(result.email || email);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = unverifiedEmail || email;
    if (!targetEmail) return;

    setResendingVerification(true);
    try {
      const res = await api.post("/auth/resend-verification", { email: targetEmail });
      if (res.data.success) {
        toast.success(res.data.message || "Fresh verification code & link sent! Please check your email.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not resend verification email.");
    } finally {
      setResendingVerification(false);
    }
  };

  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    const targetEmail = unverifiedEmail || email;
    if (!loginOtp || loginOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP code.");
      return;
    }

    setLoginOtpLoading(true);
    const result = await verifyOtp(targetEmail, loginOtp);
    setLoginOtpLoading(false);

    if (result?.success) {
      setShowOtpModal(false);
      navigate(from === "/admin" ? "/home" : from);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: forgotEmail });
      if (res.data.success) {
        setForgotSuccess(true);
        toast.success("Password reset instructions sent to your email!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process password reset request.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#000000]">
      <div className="w-full max-w-md">
        
        {/* Amazon Prime Replica Card */}
        <div className="bg-[#121216] border border-[#27272a] rounded-2xl p-8 shadow-2xl relative">
          
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#ff6600]/15 text-[#ff6600] flex items-center justify-center border border-[#ff6600]/30 shadow-md">
                <Film className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-white">
                i<span className="text-[#ff6600]">Movies</span>
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {isAdmin ? "Admin Portal Access" : "Sign In to Your Account"}
            </h2>
            <p className="text-xs text-[#a1a1aa] mt-1">
              {isAdmin
                ? "Enter verified administrative credentials to manage shows and bookings"
                : "Book tickets, select seats in real-time, and download passes"}
            </p>
          </div>

          {/* Unverified Email Alert Banner */}
          {unverifiedEmail && (
            <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-600/50 text-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-2 flex-1">
                  <p className="font-bold text-amber-300">Account Needs Activation</p>
                  <p className="text-amber-200/90 leading-relaxed">
                    Your email (<strong>{unverifiedEmail}</strong>) is not verified yet. We sent you an activation email with a 6-digit OTP code and a one-click link.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowOtpModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff6600] hover:bg-[#ff7700] text-slate-950 font-bold text-[11px] shadow-sm transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Enter 6-Digit OTP</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendingVerification}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181f] hover:bg-[#3f3f46] text-[#ff6600] border border-[#27272a] font-bold text-[11px] shadow-sm transition-all disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>{resendingVerification ? "Sending..." : "Resend OTP & Link"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Role Switcher Tabs (Only Sign In as Admin, No Signup for Admin) */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#09090b] border border-[#27272a] mb-6">
            <button
              type="button"
              onClick={() => {
                setIsAdmin(false);
                setUnverifiedEmail(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                !isAdmin
                  ? "bg-[#ff6600] text-slate-950 font-black shadow-md shadow-[#ff6600]/30"
                  : "text-[#a1a1aa] hover:text-white"
              }`}
            >
              Movie Fan (User)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdmin(true);
                setUnverifiedEmail(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                isAdmin
                  ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30"
                  : "text-[#a1a1aa] hover:text-white"
              }`}
            >
              Sign In as Admin
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {isAdmin ? "Admin Email Address" : "Email Address"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#18181f] border border-[#27272a] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#ff6600] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotSuccess(false);
                      setShowForgotModal(true);
                    }}
                    className="text-xs text-[#ff6600] hover:text-[#ff7700] transition-colors font-medium hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#18181f] border border-[#27272a] rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#ff6600] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-white transition-colors focus:outline-none p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm text-slate-950 transition-all shadow-lg hover:scale-[1.02] disabled:opacity-50 mt-2 ${
                isAdmin
                  ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/30"
                  : "bg-[#ff6600] hover:bg-[#ff7700] shadow-[#ff6600]/30"
              }`}
            >
              {loading ? "Authenticating..." : isAdmin ? "Sign In as Admin" : "Sign In to iMovies"}
            </button>
          </form>

          {/* Conditional Bottom Footer (No Admin Signup Allowed) */}
          {isAdmin ? (
            <div className="mt-6 p-3.5 rounded-xl bg-[#09090b] border border-[#27272a] text-center">
              <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                🔒 <strong>Administrator Access:</strong> New admin accounts can only be provisioned by existing administrators through the Admin Dashboard.
              </p>
            </div>
          ) : (
            <div className="mt-6 text-center text-xs text-[#a1a1aa]">
              New to iMovies?{" "}
              <Link to="/register" className="text-[#ff6600] hover:text-[#ff7700] font-bold transition-colors">
                Create an account
              </Link>
            </div>
          )}

        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121216] border border-[#27272a] rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative text-center">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#18181f] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/30 mb-4">
              <KeyRound className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white">Enter Verification OTP</h3>
            <p className="text-xs text-[#a1a1aa] mt-1">
              Enter the 6-digit code sent to:
            </p>
            <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-bold text-[#ff6600]">
              {unverifiedEmail || email}
            </div>

            <form onSubmit={handleVerifyLoginOtp} className="space-y-4 mt-6 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider text-center mb-2">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  value={loginOtp}
                  onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  className="w-full bg-[#09090b] border-2 border-[#ff6600]/50 focus:border-[#ff6600] rounded-2xl py-3.5 text-center text-2xl font-black tracking-[12px] text-white placeholder-slate-600 focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-300 bg-[#18181f] hover:bg-[#3f3f46] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loginOtpLoading || loginOtp.length !== 6}
                  className="flex-1 py-3 px-4 rounded-xl font-black text-sm text-slate-950 bg-[#ff6600] hover:bg-[#ff7700] shadow-lg shadow-[#ff6600]/30 transition-all disabled:opacity-50"
                >
                  {loginOtpLoading ? "Verifying..." : "Verify & Sign In"}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-[#27272a]">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="text-xs text-[#a1a1aa] hover:text-[#ff6600] inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3 h-3 text-[#ff6600]" />
                <span>{resendingVerification ? "Sending fresh OTP..." : "Resend OTP Code"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121216] border border-[#27272a] rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#18181f] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {forgotSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Reset Email Dispatched!</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We've sent a secure password reset link to <strong>{forgotEmail}</strong>. Please check your inbox and click the link to choose a new password.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="w-full py-3 rounded-xl bg-[#18181f] hover:bg-[#3f3f46] text-white font-bold text-sm transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/30">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Reset Your Password</h3>
                    <p className="text-xs text-[#a1a1aa]">Enter your registered email to receive a recovery link</p>
                  </div>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Account Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-[#18181f] border border-[#27272a] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#ff6600] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-300 bg-[#18181f] hover:bg-[#3f3f46] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-3 px-4 rounded-xl font-black text-sm text-slate-950 bg-[#ff6600] hover:bg-[#ff7700] shadow-lg shadow-[#ff6600]/30 transition-all disabled:opacity-50"
                    >
                      {forgotLoading ? "Sending Link..." : "Send Reset Link"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
