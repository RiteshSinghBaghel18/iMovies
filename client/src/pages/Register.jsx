import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';

function Register() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState('form'); // 'form' or 'verify'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: 'Empty', score: 0, color: 'bg-zinc-700' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { label: 'Weak', score: 25, color: 'bg-zinc-700' };
    if (score === 2) return { label: 'Fair', score: 50, color: 'bg-orange-700' };
    if (score === 3) return { label: 'Good', score: 75, color: 'bg-orange-500' };
    return { label: 'Strong', score: 100, color: 'bg-primary' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password, confirmPassword } = formData;

    if (!username.trim() || !email.trim() || !password) {
      toast.error('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const payload = { username: username.trim(), email: email.trim(), password };
      const response = await api.registerUser(payload);

      if (response.data.success) {
        toast.success(response.data.message || "Verification email dispatched! (Didn't receive it? Please check your spam or junk folder.)");
        // Transition to verification code step
        setStep('verify');
      } else {
        toast.error(response.data.message || 'Registration failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      toast.error('Please enter the 6-digit verification code from your email');
      return;
    }

    try {
      setLoading(true);
      const res = await api.verifyEmail({
        email: formData.email.trim(),
        token: verificationCode.trim(),
      });

      if (res.data.success) {
        toast.success('Account verified successfully! Welcome to iMovies.');
        if (res.data.token && res.data.user) {
          localStorage.setItem('imovies-token', res.data.token);
          localStorage.setItem('imovies-role', 'user');
          localStorage.setItem('imovies-user', JSON.stringify(res.data.user));
          navigate('/home');
        } else {
          navigate('/login');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResending(true);
      const res = await api.resendVerification({ email: formData.email.trim() });
      toast.success("New verification code dispatched! (Didn't receive it? Please check your spam or junk folder.)");
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend verification code');
    } finally {
      setResending(false);
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
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#ff6600] via-[#ff7700] to-[#ffa333]"></div>

          {step === 'form' ? (
            <>
              <div className="text-center mb-6">
                <span className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 border border-primary/20 text-primary text-xl mb-3">
                  🍿
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Create User Account</h2>
                <p className="text-zinc-400 text-xs sm:text-sm mt-1">Unlock instant ticket bookings and watchlist features</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <i className="fa-solid fa-user"></i>
                    </div>
                    <input
                      type="text"
                      name="username"
                      required
                      minLength={3}
                      maxLength={20}
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="cinephile99"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-none text-sm focus:outline-none focus:border-primary transition ${
                        isDark ? 'bg-[#0a0a0a] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Email */}
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
                      placeholder="user@example.com"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-none text-sm focus:outline-none focus:border-primary transition ${
                        isDark ? 'bg-[#0a0a0a] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <i className="fa-solid fa-lock"></i>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      minLength={6}
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

                  {/* Password strength bar */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
                        <span>Strength: {strength.label}</span>
                        <span>{strength.score}%</span>
                      </div>
                      <div className="h-1 w-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{ width: `${strength.score}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <i className="fa-solid fa-lock-open"></i>
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      minLength={6}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-none text-sm focus:outline-none focus:border-primary transition ${
                        isDark ? 'bg-[#0a0a0a] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
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
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-user-plus"></i>
                      <span>Sign Up &amp; Verify Email</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-zinc-400 pt-4 border-t border-zinc-800">
                Already registered?{' '}
                <Link to="/login" className="text-primary hover:underline font-bold ml-1">
                  Sign In instead
                </Link>
              </div>
            </>
          ) : (
            /* STEP 2: VERIFICATION CODE INPUT */
            <div className="space-y-5">
              <div className="text-center">
                <span className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/30 text-primary text-2xl mb-3 shadow-md">
                  <i className="fa-solid fa-envelope-circle-check"></i>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Check Your Inbox</h2>
                <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                  We've dispatched a 6-digit verification code to <strong>{formData.email}</strong>.
                </p>
                <p className="text-zinc-500 text-xs mt-2 flex items-center justify-center gap-1.5">
                  <i className="fa-regular fa-envelope text-primary text-[11px]"></i>
                  <span>Didn't receive the email? Please check your spam or junk folder.</span>
                </p>
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      6-Digit Activation Code
                    </label>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resending}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      {resending ? 'Sending...' : 'Resend Code?'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="e.g. 549102"
                    className={`w-full px-4 py-3 border rounded-none text-center font-mono text-xl tracking-widest focus:outline-none focus:border-primary transition ${
                      isDark ? 'bg-[#0a0a0a] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-orange-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-950/40 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i>
                      <span>Verify &amp; Activate Account</span>
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-zinc-400 hover:text-white transition flex items-center gap-1 font-semibold"
                >
                  <i className="fa-solid fa-arrow-left"></i> Change Email
                </button>
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Register;
