import React, { useState } from 'react';
import { Phone, Mail, Clock, MapPin, Send, CheckCircle2, Headphones } from 'lucide-react';

interface ServicesViewProps {
  onSubmitQuery: (phone: string, queryText: string) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ onSubmitQuery }) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !message.trim()) return;
    onSubmitQuery(phone.trim(), message.trim());
    setSubmitted(true);
    setPhone('');
    setMessage('');
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="border-b border-amber-200/80 pb-4 mb-6 sm:mb-8 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-royal-950 flex items-center justify-center sm:justify-start gap-2">
          <Headphones className="w-6 h-6 text-amber-700" />
          <span>Customer Care & Support Services</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Have questions about bulk orders, spice quality, or delivery status? We are at your service 24/7.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
              <Phone className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Direct Helpline
            </h4>
            <a href="tel:+918527386834" className="text-sm font-extrabold text-royal-950 hover:underline">
              +91 8527386834
            </a>
            <p className="text-[11px] text-gray-500 mt-1">
              Available 24 hours daily for order assistance.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Email Support
            </h4>
            <a href="mailto:support@kbrglobalventures.com" className="text-xs font-extrabold text-royal-950 hover:underline break-all">
              support@kbrglobalventures.com
            </a>
            <p className="text-[11px] text-gray-500 mt-1">
              Guaranteed response within 4 hours.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Operating Hours
            </h4>
            <p className="text-sm font-extrabold text-royal-950">
              24 Hours Open (Pan-India)
            </p>
          </div>
        </div>

        {/* Query Submission Form */}
        <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl shadow-md border border-amber-200">
          <h3 className="text-lg font-bold text-royal-950 mb-1">
            Submit a Customer Care Ticket
          </h3>
          <p className="text-xs text-gray-500 mb-6">
            Enter your mobile number and describe your inquiry. Our support representative will connect with you.
          </p>

          {submitted && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Your query ticket has been submitted successfully! We will reach out shortly.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Your Phone / Mobile Number *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit Mobile Number"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Query / Inquiries Details *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your question or requirement (e.g. bulk supply, tracking enquiry, restaurant partnership)..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              className="bg-amber-800 hover:bg-amber-900 text-white font-bold py-3.5 px-8 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Send className="w-4 h-4" />
              <span>Submit Ticket</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
