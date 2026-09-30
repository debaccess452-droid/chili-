import React, { useState } from 'react';
import { Lock, X, ShieldAlert, KeyRound, UserCheck } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Check credentials (matching the existing production credentials)
    setTimeout(() => {
      if (username.trim() === 'kbrteam999' && password.trim() === 'kbrmasale123') {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      } else {
        setIsSubmitting(false);
        setError('Access Denied: Invalid Admin Username or Security Passcode!');
      }
    }, 300);
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
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition"
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
            Restricted administrative gateway for KBR Global Ventures
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Admin Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <UserCheck className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setError('');
                  setUsername(e.target.value);
                }}
                required
                placeholder="Enter Username"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Security Passcode
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setError('');
                  setPassword(e.target.value);
                }}
                required
                placeholder="Enter Security Passcode"
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-royal-900 to-red-900 hover:from-royal-950 hover:to-red-950 text-white font-bold py-3.5 rounded-xl shadow-lg transition transform active:scale-98 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Authenticating...' : 'Login to Admin Dashboard'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
