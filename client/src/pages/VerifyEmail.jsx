import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Loader2, ArrowRight, Film, Mail, Send, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") || "";
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();

  const [loading, setLoading] = useState(Boolean(token));
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  // OTP Verification state
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Resend state
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const performTokenVerification = async () => {
      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        if (res.data.success) {
          setSuccess(true);
          setMessage(res.data.message || "Your email address has been verified successfully!");
          toast.success("Email verified successfully! You can now sign in.");
        }
      } catch (err) {
        setSuccess(false);
        setMessage(
          err.response?.data?.message ||
            "This verification link is invalid or has expired. You can still verify using your 6-digit OTP below."
        );
      } finally {
        setLoading(false);
      }
    };

    performTokenVerification();
  }, [token]);

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
      setSuccess(true);
      setMessage("Your account has been successfully verified via OTP!");
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.info("Please enter your email address to request a new code.");
      return;
    }

    setResending(true);
    try {
      const res = await api.post("/auth/resend-verification", { email });
      if (res.data.success) {
        setResendSuccess(true);
        toast.success(res.data.message || "Fresh 6-digit OTP and activation link sent!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-cinema-card border border-cinema-border rounded-3xl p-8 shadow-2xl shadow-black/80 text-center">
          
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-lg shadow-red-600/30 mb-6">
            <Film className="w-6 h-6 text-white" />
          </div>

          {loading ? (
            /* Automatic Token Verification in Progress */
            <div className="py-8 space-y-4">
              <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-white">Verifying Account...</h2>
              <p className="text-xs text-slate-400">
                Please wait while we validate your activation link.
              </p>
            </div>
          ) : success ? (
            /* Success State */
            <div className="py-4 space-y-5 animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">Account Activated! 🎉</h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left">
                <p className="text-xs text-slate-400">
                  You are now authenticated. You can browse live TMDB releases, select cinema seats, and book tickets instantly.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/home"
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <span>Explore Movies & Shows</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* OTP Verification Window */
            <div className="space-y-5 text-left animate-fade-in">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white">Enter Verification OTP</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter the 6-digit code sent to your email to activate your account
                </p>
              </div>

              {message && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    6-Digit One-Time Password
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    className="w-full bg-slate-950 border-2 border-red-500/50 focus:border-red-500 rounded-2xl py-3 text-center text-xl font-black tracking-[10px] text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner font-mono"
                  />
                  <p className="text-[11px] text-slate-500 text-center mt-1">
                    Check the latest email from iMovies
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{otpLoading ? "Validating OTP..." : "Verify OTP & Activate"}</span>
                </button>
              </form>

              <div className="pt-3 border-t border-slate-800 text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-red-400" />
                  <span>{resending ? "Sending fresh OTP..." : "Resend 6-Digit OTP"}</span>
                </button>

                <div>
                  <Link
                    to="/login"
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
