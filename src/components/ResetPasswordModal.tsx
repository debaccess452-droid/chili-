import React, { useState } from 'react';
import { Lock, ArrowRight, X, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { updateUserPassword, signOutUser } from '../services/authService';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both passwords.');
      return;
    }

    setIsLoading(true);

    try {
      await updateUserPassword(newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToSignIn = async () => {
    try {
      await signOutUser();
    } catch {
      // Continue to sign in modal regardless
    }
    setNewPassword('');
    setConfirmPassword('');
    setIsSuccess(false);
    onSuccess();
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
            Create New Password
          </h2>
          <p className="text-xs text-gray-600 mt-1 font-medium">
            Enter and confirm your new secure account password below.
          </p>
        </div>

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-in fade-in duration-150">
            {errorMessage}
          </div>
        )}

        {isSuccess ? (
          /* ================= SUCCESS STATE ================= */
          <div className="text-center py-4 space-y-4 relative z-10 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-50">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                Password updated successfully.
              </h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                Your password has been reset. You can now continue and sign in with your new credentials.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleContinueToSignIn}
                className="w-full bg-gradient-to-r from-amber-800 to-royal-900 hover:from-amber-900 hover:to-royal-950 text-white font-bold py-3 min-h-[44px] rounded-xl shadow-md transition transform active:scale-98 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <span>Continue to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* ================= RESET PASSWORD FORM ================= */
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                New Password *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setErrorMessage('');
                    setNewPassword(e.target.value);
                  }}
                  required
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
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

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setErrorMessage('');
                    setConfirmPassword(e.target.value);
                  }}
                  required
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-xs sm:text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
