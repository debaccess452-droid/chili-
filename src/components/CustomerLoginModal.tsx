import React, { useState } from 'react';
import { UserSession } from '../types';
import { Mail, Phone, ArrowRight, X, Sparkles } from 'lucide-react';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserSession) => void;
}

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    const newUser: UserSession = {
      phone: cleanPhone,
      email: email.trim().toLowerCase(),
      time: new Date().toLocaleTimeString(),
    };

    onLogin(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border-2 border-amber-500/50 relative overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        
        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex p-3 sm:p-4 rounded-full bg-amber-100/90 text-amber-800 mb-3 shadow-inner ring-4 ring-amber-50">
            <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 4.4-3.6 8-8 8z" fill="#b45309" fillOpacity="0.2"></path>
              <path d="M11 20c-3.3 0-6-2.7-6-6 0-3 2.5-5.5 5.5-5.5" stroke="#b45309"></path>
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-royal-950">
            Welcome to KBR Masale
          </h2>
          <p className="text-xs text-gray-600 mt-1 font-medium">
            Verify your identity for express ordering & order tracking
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Mobile Number *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 font-semibold text-sm">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setError('');
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                }}
                maxLength={10}
                required
                placeholder="Enter 10 Digit Mobile No."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Gmail / Email Address *
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
                placeholder="yourname@gmail.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-sm transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-800 to-royal-900 hover:from-amber-900 hover:to-royal-950 text-white font-bold py-3.5 rounded-xl shadow-lg transition transform active:scale-98 flex items-center justify-center gap-2 text-sm"
            >
              <span>Continue To Store</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-amber-800 font-medium underline underline-offset-2"
            >
              Skip and browse spices as guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
