import React, { useState } from 'react';
import { Mail, Phone, Lock, User, ArrowRight, ArrowLeft, X, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { signInCustomer, signUpCustomer, sendPasswordResetEmail } from '../services/authService';
import { UserSession } from '../types';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserSession) => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>('signin');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('');
    setResetEmailSent(false);
  };

  const handleSwitchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
    setResetEmailSent(false);
  };

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await signInCustomer(cleanEmail, password);
      const userSession: UserSession = {
        id: res.user?.id,
        email: res.user?.email || cleanEmail,
        phone: res.profile?.phone || '',
        fullName: res.profile?.full_name || '',
        role: res.role,
        time: new Date().toLocaleTimeString(),
      };

      onLoginSuccess(userSession);
      resetForm();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both passwords.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await signUpCustomer({
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password,
      });

      if (res.requiresEmailConfirmation) {
        setSuccessMessage('Account created successfully! Please check your email to confirm your account before logging in.');
        setIsLoading(false);
        return;
      }

      const userSession: UserSession = {
        id: res.user?.id,
        email: res.user?.email || cleanEmail,
        phone: res.profile?.phone || cleanPhone,
        fullName: res.profile?.full_name || cleanName,
        role: 'customer',
        time: new Date().toLocaleTimeString(),
      };

      onLoginSuccess(userSession);
      resetForm();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(cleanEmail);
      setResetEmailSent(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border-2 border-amber-500/50 relative overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Background decorative spice glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition z-20 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5 relative z-10">
          <div className="inline-flex p-3 rounded-full bg-amber-100/90 text-amber-800 mb-2.5 shadow-inner ring-4 ring-amber-50">
            <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 4.4-3.6 8-8 8z" fill="#047857" fillOpacity="0.2"></path>
              <path d="M11 20c-3.3 0-6-2.7-6-6 0-3 2.5-5.5 5.5-5.5" stroke="#047857"></path>
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-royal-950">
            {mode === 'signin' && 'Welcome to KBR Masale'}
            {mode === 'signup' && 'Create Customer Account'}
            {mode === 'forgot' && 'Reset Account Password'}
          </h2>
          <p className="text-xs text-gray-600 mt-1 font-medium">
            {mode === 'signin' && 'Sign in to access your orders, saved spices, and express checkout'}
            {mode === 'signup' && 'Join KBR Global Ventures for pure heritage Indian spices'}
            {mode === 'forgot' && 'Enter your registered email address to receive a secure password reset link'}
          </p>
        </div>

        {/* Navigation Tabs or Back Link */}
        {mode !== 'forgot' ? (
          <div className="flex bg-amber-50 p-1 rounded-2xl border border-amber-200/80 mb-5 relative z-10">
            <button
              type="button"
              onClick={() => handleSwitchMode('signin')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                mode === 'signin'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-gray-600 hover:text-amber-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                mode === 'signup'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-gray-600 hover:text-amber-900'
              }`}
            >
              Create Account
            </button>
          </div>
        ) : (
          <div className="mb-4 relative z-10">
            <button
              type="button"
              onClick={() => handleSwitchMode('signin')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-in fade-in duration-150">
            {errorMessage}
          </div>
        )}

        {/* Success Feedback Banner */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ================= FORGOT PASSWORD FORM ================= */}
        {mode === 'forgot' ? (
          resetEmailSent ? (
            <div className="text-center py-4 space-y-4 relative z-10 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-50">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                  Password reset link sent
                </h3>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed max-w-xs mx-auto">
                  Check your email and follow the link to create a new password.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmailSent(false);
                    handleSwitchMode('signin');
                  }}
                  className="w-full bg-gradient-to-r from-amber-800 to-royal-900 hover:from-amber-900 hover:to-royal-950 text-white font-bold py-3 min-h-[44px] rounded-xl shadow-md transition transform active:scale-98 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setErrorMessage('');
                      setEmail(e.target.value);
                    }}
                    required
                    placeholder="yourname@gmail.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-xs sm:text-sm transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-800 to-royal-900 hover:from-amber-900 hover:to-royal-950 text-white font-bold py-3 sm:py-3.5 min-h-[44px] rounded-xl shadow-md transition transform active:scale-98 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('signin')}
                  className="text-xs text-gray-500 hover:text-amber-800 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )
        ) : mode === 'signin' ? (
          /* ================= SIGN IN FORM ================= */
          <form onSubmit={handleSignIn} className="space-y-3.5 relative z-10">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setErrorMessage('');
                    setEmail(e.target.value);
                  }}
                  required
                  placeholder="yourname@gmail.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-xs sm:text-sm transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('forgot')}
                  className="text-xs text-amber-800 hover:text-amber-950 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setErrorMessage('');
                    setPassword(e.target.value);
                  }}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-xs sm:text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-800 to-royal-900 hover:from-amber-900 hover:to-royal-950 text-white font-bold py-3 sm:py-3.5 min-h-[44px] rounded-xl shadow-md transition transform active:scale-98 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to KBR Masale</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* ================= SIGN UP FORM ================= */
          <form onSubmit={handleSignUp} className="space-y-3 relative z-10">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setErrorMessage('');
                    setFullName(e.target.value);
                  }}
                  required
                  placeholder="e.g. Ramesh Kumar"
                  autoComplete="name"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-xs sm:text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setErrorMessage('');
                    setEmail(e.target.value);
                  }}
                  required
                  placeholder="yourname@gmail.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-xs sm:text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Mobile Number *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-semibold text-xs sm:text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setErrorMessage('');
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                  }}
                  maxLength={10}
                  required
                  placeholder="10-digit mobile number"
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-xs sm:text-sm transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setErrorMessage('');
                      setPassword(e.target.value);
                    }}
                    required
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs sm:text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setErrorMessage('');
                      setConfirmPassword(e.target.value);
                    }}
                    required
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs sm:text-sm transition"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Show passwords</span>
              </label>
              <span>Role: Verified Customer</span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-800 to-royal-900 hover:from-amber-900 hover:to-royal-950 text-white font-bold py-3 sm:py-3.5 min-h-[44px] rounded-xl shadow-md transition transform active:scale-98 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Customer Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs text-gray-500 hover:text-amber-800 font-medium underline underline-offset-2 cursor-pointer"
          >
            Skip and browse spices as guest
          </button>
        </div>

      </div>
    </div>
  );
};
