import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Film, Lock, Mail, User, ShieldCheck, CheckCircle2, Send, ArrowRight, KeyRound, AlertTriangle, Sparkles, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import api from "../utils/api";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP Verification Window state
  const [showOtpWindow, setShowOtpWindow] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [devOtp, setDevOtp] = useState(null);
  const [ipNotice, setIpNotice] = useState(null);

  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (username.length < 3 || username.length > 20) {
      toast.error("Username must be between 3 and 20 characters.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const result = await register(username, email, password, false);
    setLoading(false);

    if (result?.success) {
      if (result.requiresVerification) {
        if (result.devOtp) setDevOtp(result.devOtp);
        if (result.ipNotice) setIpNotice(result.ipNotice);
        setShowOtpWindow(true);
      } else {
        navigate("/home");
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP code.");
      return;
    }

    setOtpLoading(true);
    const result = await verifyOtp(email, otp);
    setOtpLoading(false);

    if (result?.success) {
      navigate("/home");
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const res = await api.post("/auth/resend-verification", { email });
      if (res.data.success) {
        if (res.data.devOtp) setDevOtp(res.data.devOtp);
        if (res.data.ipNotice) setIpNotice(res.data.ipNotice);
        toast.success(res.data.message || "Fresh 6-digit OTP sent!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#000000]">
      <div className="w-full max-w-md">
        
        {/* Amazon Prime Replica Card */}
        <div className="bg-[#121216] border border-[#27272a] rounded-2xl p-8 shadow-2xl">
          
          {showOtpWindow ? (
            /* OTP Verification Window */
            <div className="py-2 space-y-5 animate-fade-in text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#76b900]/15 text-[#76b900] border border-[#76b900]/30 shadow-lg">
                <KeyRound className="w-8 h-8 text-[#76b900]" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">Enter Verification OTP</h2>
                <p className="text-xs text-[#a1a1aa] mt-1">
                  We've generated a 6-digit code for:
                </p>
                <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-bold text-[#76b900]">
                  {email}
                </div>
              </div>

              {/* Notice if Brevo IP Whitelisting is pending */}
              {devOtp && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/50 text-amber-200 text-left text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Brevo Live Delivery Notice</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Brevo requires authorizing your current network IP at{" "}
                    <a
                      href="https://app.brevo.com/security/authorised_ips"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white underline font-semibold"
                    >
                      brevo.com/security/authorised_ips
                    </a>{" "}
                    for live Gmail delivery.
                  </p>
                  <div className="pt-1 flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-amber-500/30">
                    <span className="text-[11px] text-slate-300 font-medium">Session OTP Code:</span>
                    <button
                      type="button"
                      onClick={() => setOtp(devOtp)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs font-mono shadow-sm transition-all"
                    >
                      Fill {devOtp}
                    </button>
                  </div>
                </div>
              )}

              {/* OTP Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    6-Digit One-Time Password
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      autoFocus
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="• • • • • •"
                      className="w-full bg-[#09090b] border-2 border-[#76b900]/50 focus:border-[#76b900] rounded-2xl py-3.5 text-center text-2xl font-black tracking-[12px] text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-[#a1a1aa] mt-1.5">
                    Check your email inbox (and spam folder) for the 6-digit code
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className="w-full py-3.5 px-4 rounded-xl font-black text-sm text-slate-950 bg-[#76b900] hover:bg-[#8cd600] shadow-lg shadow-[#76b900]/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{otpLoading ? "Verifying Code..." : "Verify OTP & Continue"}</span>
                </button>
              </form>

              <div className="pt-2 border-t border-[#27272a] space-y-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-xs text-[#a1a1aa] hover:text-[#76b900] inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-[#76b900]" />
                  <span>{resending ? "Sending fresh OTP..." : "Didn't receive code? Resend OTP"}</span>
                </button>

                <div>
                  <Link
                    to="/login"
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Standard User Registration Form (No Admin Signup Allowed) */
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#76b900]/15 text-[#76b900] flex items-center justify-center border border-[#76b900]/30 shadow-md">
                    <Film className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black text-white">
                    i<span className="text-[#76b900]">Movies</span>
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Create Your Account
                </h2>
                <p className="text-xs text-[#a1a1aa] mt-1">
                  Join iMovies to book tickets, reserve live seats, and manage passes
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Username (3-20 characters)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      minLength={3}
                      maxLength={20}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. alex_harrison"
                      className="w-full bg-[#18181f] border border-[#27272a] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#76b900] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address (max 50 chars)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      maxLength={50}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-[#18181f] border border-[#27272a] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#76b900] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#18181f] border border-[#27272a] rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#76b900] transition-colors"
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
                  className="w-full py-3.5 px-4 rounded-xl font-black text-sm text-slate-950 bg-[#76b900] hover:bg-[#8cd600] shadow-lg shadow-[#76b900]/30 transition-all hover:scale-[1.02] disabled:opacity-50 mt-2"
                >
                  {loading ? "Creating Account..." : "Create Account & Send OTP"}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-[#a1a1aa]">
                Already have an account?{" "}
                <Link to="/login" className="text-[#76b900] hover:text-[#8cd600] font-bold transition-colors">
                  Sign In
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;
