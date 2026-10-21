import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const queryEmail = searchParams.get('email') || '';
  const queryToken = searchParams.get('token') || '';

  const [email, setEmail] = useState(queryEmail);
  const [token, setToken] = useState(queryToken);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  // Auto-verify if both email and token are present in URL
  useEffect(() => {
    if (queryEmail && queryToken && !verified) {
      handleVerification(queryEmail, queryToken);
    }
  }, [queryEmail, queryToken]);

  const handleVerification = async (targetEmail, targetToken) => {
    const finalEmail = (targetEmail || email).trim();
    const finalToken = (targetToken || token).trim();

    if (!finalEmail || !finalToken) {
      toast.error('Please provide both email and 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      const res = await api.verifyEmail({ email: finalEmail, token: finalToken });
      if (res.data.success) {
        setVerified(true);
        toast.success(res.data.message || 'Account activated successfully!');

        // If a JWT token was returned, log user in
        if (res.data.token && res.data.user) {
          localStorage.setItem('imovies-token', res.data.token);
          localStorage.setItem('imovies-role', 'user');
          localStorage.setItem('imovies-user', JSON.stringify(res.data.user));
          setTimeout(() => navigate('/home'), 1500);
        } else {
          setTimeout(() => navigate('/login'), 1500);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address to receive a new code');
      return;
    }
    try {
      setResending(true);
      const res = await api.resendVerification({ email: email.trim() });
      toast.success("New verification code dispatched! (Didn't receive it? Please check your spam or junk folder.)");
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  const cardBg = theme === 'dark' ? 'bg-[#121216] border-zinc-800' : 'bg-white border-zinc-200 shadow-xl';
  const inputBg = theme === 'dark' ? 'bg-[#0a0a0a] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900';

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-black text-white' : 'bg-[#f4f4f5] text-zinc-900'}`}>
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        <div className="w-full max-w-md border rounded-none p-6 sm:p-8 relative overflow-hidden z-10 shadow-2xl transition-colors" style={{ backgroundColor: theme === 'dark' ? '#121216' : '#ffffff' }}>
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#ff6600] via-[#ff7700] to-[#ffa333]"></div>

          <div className="text-center mb-6">
            <span className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/30 text-primary text-2xl mb-3 shadow-md">
              <i className="fa-solid fa-envelope-circle-check"></i>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              {verified ? 'Account Activated!' : 'Verify Email Address'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              {verified
                ? 'Your email has been verified. Redirecting you to iMovies...'
                : 'Enter your 6-digit activation code sent to your inbox'}
            </p>
            {!verified && (
              <p className="text-zinc-500 text-xs mt-2 flex items-center justify-center gap-1.5">
                <i className="fa-regular fa-envelope text-primary text-[11px]"></i>
                <span>Didn't receive the email? Please check your spam or junk folder.</span>
              </p>
            )}
          </div>

          {verified ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-primary text-black font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-950/50">
                <i className="fa-solid fa-check text-2xl"></i>
              </div>
              <p className="text-sm font-semibold text-zinc-300">
                Welcome to iMovies! Preparing your cinema experience...
              </p>
              <Link
                to="/home"
                className="inline-block px-6 py-2.5 bg-primary hover:bg-orange-600 text-black font-black text-xs uppercase tracking-wider transition"
              >
                Go to Home Now
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleVerification(); }} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <i className="fa-regular fa-envelope"></i>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-none text-sm focus:outline-none focus:border-primary transition ${inputBg}`}
                  />
                </div>
              </div>

              {/* Verification Code */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    6-Digit Code / Token
                  </label>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    {resending ? 'Sending...' : 'Resend Code?'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <i className="fa-solid fa-key"></i>
                  </div>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="e.g. 582910"
                    maxLength={64}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-none text-base font-mono tracking-widest focus:outline-none focus:border-primary transition ${inputBg}`}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-primary hover:bg-orange-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-950/40 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Verify &amp; Activate Account</span>
                  </>
                )}
              </button>

              <div className="text-center pt-3 border-t border-zinc-800">
                <Link to="/login" className="text-xs text-zinc-400 hover:text-primary transition font-semibold">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default VerifyEmail;
