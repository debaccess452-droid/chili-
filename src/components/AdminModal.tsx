import React, { useState } from 'react';
import { Lock, X, ShieldAlert, Mail, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';
import { signInAdmin } from '../services/authService';
import { UserSession } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminSession: UserSession) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid administrator email address.');
      return;
    }

    if (!password) {
      setError('Please enter your security passcode.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await signInAdmin(cleanEmail, password);
      
      const adminSession: UserSession = {
        id: res.user?.id,
        email: res.user?.email || cleanEmail,
        phone: res.profile?.phone || '',
        fullName: res.profile?.full_name || 'Super Admin',
        role: 'admin',
        time: new Date().toLocaleTimeString(),
      };

      setIsSubmitting(false);
      onSuccess(adminSession);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Access Denied: Invalid credentials or insufficient permissions.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border-2 border-red-900 relative my-auto animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 min-w-[40px] min-h-[40px] text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition flex items-center justify-center cursor-pointer"
          aria-label="Close admin modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-red-100 text-red-900 mb-3 shadow-inner">
            <Lock className="w-7 h-7 text-red-800" />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-royal-950">
            Admin Access Portal
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Restricted gateway protected by Supabase Role-Based Access Control
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-150">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Admin Email Address *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setError('');
                  setEmail(e.target.value);
                }}
                required
                placeholder="admin@kbrglobalventures.com"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Security Passcode / Password *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setError('');
                  setPassword(e.target.value);
                }}
                required
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-900 hover:bg-red-950 text-white font-bold py-3 sm:py-3.5 min-h-[44px] rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying administrator authorization...</span>
                </>
              ) : (
                <span>Login to Admin Dashboard</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400">
            Authorization is verified against the database <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600 font-mono">user_roles</code> table.
          </p>
        </div>
      </div>
    </div>
  );
};
