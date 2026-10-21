import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';

function Login() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'admin'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setUnverifiedEmail(null);
      let response;
      if (activeTab === 'user') {
        response = await api.loginUser({
          email: formData.email,
          password: formData.password,
        });
      } else {
        response = await api.loginAdmin({
          email: formData.email,
          password: formData.password,
        });
      }

      const data = response.data;
      if (data.success || data.token) {
        const token = data.token || data.authToken;
        const role = activeTab;
        const userObj = data.user || data.admin || { email: formData.email, role };

        localStorage.setItem('imovies-token', token);
        localStorage.setItem('imovies-role', role);
        localStorage.setItem('imovies-user', JSON.stringify(userObj));

        toast.success(`Welcome back, ${userObj.username || formData.email}!`);
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/home');
        }
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.isUnverified) {
        setUnverifiedEmail(errData.email || formData.email);
        toast.warning(errData.message || 'Please verify your email address to log in.');
      } else {
        toast.error(errData?.message || err.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your account email address');
      return;
    }
    try {
      setForgotLoading(true);
      const res = await api.forgotPassword({
        email: forgotEmail.trim(),
        role: activeTab,
      });
      setForgotSuccess(true);
      toast.success("Password recovery link sent! (Didn't receive it? Please check your spam or junk folder.)");
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-black text-white' : 'bg-[#f4f4f5] text-zinc-900'}`}>
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        <div
          className="w-full max-w-md border rounded-none p-6 sm:p-8 relative overflow-hidden z-10 shadow-2xl transition-colors"
          style={{ backgroundColor: isDark ? '#121216' : '#ffffff' }}
        >
          {/* Top highlight bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#ff6600] via-[#ff7700] to-[#ffa333]"></div>

          <div className="text-center mb-6">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-none bg-primary/10 border border-primary/20 text-primary text-xl mb-3">
              🎬
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Sign In to iMovies</h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">Book premier seats for blockbuster releases</p>
          </div>

          {/* Unverified account warning banner */}
          {unverifiedEmail && (
            <div className="mb-4 p-3 border border-orange-500/40 bg-orange-500/10 text-xs text-orange-200 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-primary">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>Email Verification Required</span>
              </div>
              <p className="text-zinc-300">
                A verification code was sent to <strong>{unverifiedEmail}</strong>.
              </p>
              <Link
                to={`/verify?email=${encodeURIComponent(unverifiedEmail)}`}
                className="self-start px-3 py-1 bg-primary text-black font-bold text-xs uppercase tracking-wider"
              >
                Enter Verification Code &rarr;
              </Link>
            </div>
          )}

          {/* Role Tabs */}
          <div className="flex p-1 mb-6 border border-zinc-800" style={{ backgroundColor: isDark ? '#0a0a0a' : '#f4f4f5' }}>
            <button
              type="button"
              onClick={() => { setActiveTab('user'); setUnverifiedEmail(null); setShowPassword(false); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'user'
                  ? 'bg-primary text-black shadow-md'
                  : 'text-zinc-400 hover:text-primary'
              }`}
            >
              <i className="fa-solid fa-user text-xs"></i>
              <span>User Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setUnverifiedEmail(null); setShowPassword(false); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-primary text-black shadow-md'
                  : 'text-zinc-400 hover:text-primary'
              }`}
            >
              <i className="fa-solid fa-shield-halved text-xs"></i>
              <span>Admin Sign In</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
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
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={activeTab === 'admin' ? 'admin@imovies.com' : 'user@example.com'}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-none text-sm focus:outline-none focus:border-primary transition ${
                    isDark ? 'bg-[#0a0a0a] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(formData.email || '');
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <i className="fa-solid fa-lock"></i>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-none text-sm focus:outline-none focus:border-primary transition ${
                    isDark ? 'bg-[#0a0a0a] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-primary hover:bg-orange-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-950/40 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket"></i>
                  <span>Sign In as {activeTab === 'admin' ? 'Administrator' : 'User'}</span>
                </>
              )}
            </button>
          </form>

          {/* Conditional Footer: ONLY show registration link for users */}
          <div className="mt-6 text-center text-sm text-zinc-400 pt-4 border-t border-zinc-800">
            {activeTab === 'user' ? (
              <div className="text-xs">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline font-bold ml-1">
                  Create an account
                </Link>
              </div>
            ) : (
              <div className="p-2.5 bg-black/20 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-center gap-2">
                <i className="fa-solid fa-shield-halved text-primary"></i>
                <span>Admin accounts must be provisioned internally by authorized administrators.</span>
              </div>
            )}
          </div>
        </div>

        {/* ── FORGOT PASSWORD MODAL ── */}
        {showForgotModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div
              className="w-full max-w-md border rounded-none p-6 sm:p-8 relative shadow-2xl transition-colors"
              style={{ backgroundColor: isDark ? '#121216' : '#ffffff' }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <i className="fa-solid fa-key text-primary"></i>
                  <span>Reset Password</span>
                </h3>
                <button
                  onClick={() => { setShowForgotModal(false); setForgotSuccess(false); }}
                  className="text-zinc-400 hover:text-primary transition text-lg"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {forgotSuccess ? (
                /* Success State inside Modal */
                <div className="text-center py-4 space-y-3">
                  <div className="w-14 h-14 bg-primary/20 border border-primary/40 text-primary flex items-center justify-center mx-auto text-2xl shadow-md">
                    <i className="fa-solid fa-envelope-circle-check"></i>
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight text-white">
                    Password Reset Link Sent
                  </h4>
                  <p className="text-xs text-zinc-300">
                    We've dispatched a secure password recovery link to <strong>{forgotEmail}</strong>.
                  </p>
                  <p className="text-zinc-500 text-xs flex items-center justify-center gap-1.5 pt-1">
                    <i className="fa-regular fa-envelope text-primary text-[11px]"></i>
                    <span>Didn't receive the email? Please check your spam or junk folder.</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(false); setForgotSuccess(false); setForgotEmail(''); }}
                    className="mt-4 px-6 py-2.5 bg-primary hover:bg-[#ff7700] text-black font-black text-xs uppercase tracking-wider transition shadow-md"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-zinc-400 mb-1">
                    Enter your registered {activeTab === 'admin' ? 'Admin' : 'User'} email address. We'll send a secure password recovery link via Brevo.
                  </p>
                  <p className="text-zinc-500 text-xs mb-4 flex items-center gap-1.5">
                    <i className="fa-regular fa-envelope text-primary text-[11px]"></i>
                    <span>Didn't receive the email? Please check your spam or junk folder.</span>
                  </p>

                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Account Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full px-4 py-2.5 border rounded-none text-sm focus:outline-none focus:border-primary transition ${
                          isDark ? 'bg-[#0a0a0a] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => { setShowForgotModal(false); setForgotSuccess(false); }}
                        className="px-4 py-2 border border-zinc-700 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="px-5 py-2 bg-primary hover:bg-[#ff7700] text-black font-black text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {forgotLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-paper-plane text-[11px]"></i>
                            <span>Send Reset Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Login;
