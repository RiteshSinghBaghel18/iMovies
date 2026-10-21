import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const queryEmail = searchParams.get('email') || '';
  const queryToken = searchParams.get('token') || '';
  const queryRole = searchParams.get('role') || 'user';

  const [email, setEmail] = useState(queryEmail);
  const [token, setToken] = useState(queryToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !token.trim() || !newPassword) {
      toast.error('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const res = await api.resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword,
        role: queryRole
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Password reset successful! Please sign in.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const inputBg = theme === 'dark' ? 'bg-[#0a0a0a] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900';

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-black text-white' : 'bg-[#f4f4f5] text-zinc-900'}`}>
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        <div
          className="w-full max-w-md border rounded-none p-6 sm:p-8 relative overflow-hidden z-10 shadow-2xl transition-colors"
          style={{ backgroundColor: theme === 'dark' ? '#121216' : '#ffffff' }}
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#ff6600] via-[#ff7700] to-[#ffa333]"></div>

          <div className="text-center mb-6">
            <span className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/30 text-primary text-2xl mb-3 shadow-md">
              <i className="fa-solid fa-lock-open"></i>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Reset Your Password
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Choose a strong, secure new password for your iMovies account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!token.trim() && (
              <div className="p-3 bg-primary/10 border border-primary/30 text-xs text-primary flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>Missing reset token. Please open this page using the link sent to your email.</span>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className={`w-full px-4 py-2.5 border rounded-none text-sm focus:outline-none focus:border-primary transition ${inputBg}`}
              />
            </div>

            {/* Hidden Token Field */}
            <input type="hidden" name="token" value={token} />

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`w-full pl-4 pr-10 py-2.5 border rounded-none text-sm focus:outline-none focus:border-primary transition ${inputBg}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-primary transition-colors cursor-pointer focus:outline-none"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`w-full pl-4 pr-10 py-2.5 border rounded-none text-sm focus:outline-none focus:border-primary transition ${inputBg}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-primary transition-colors cursor-pointer focus:outline-none"
                >
                  <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
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
                  <span>Resetting Password...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>Update Password</span>
                </>
              )}
            </button>

            <div className="text-center pt-3 border-t border-zinc-800">
              <Link to="/login" className="text-xs text-zinc-400 hover:text-primary transition font-semibold">
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ResetPassword;
