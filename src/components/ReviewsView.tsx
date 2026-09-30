import React, { useState } from 'react';
import { Review } from '../types';
import { Star, MessageSquareQuote, CheckCircle2, UserCheck } from 'lucide-react';

interface ReviewsViewProps {
  reviews: Review[];
  onSubmitReview: (name: string, rating: number, comment: string) => void;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({ reviews, onSubmitReview }) => {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;
    onSubmitReview(name.trim(), Number(rating), comment.trim());
    setName('');
    setComment('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="border-b border-amber-200/80 pb-4 mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-royal-950 flex items-center gap-2">
            <MessageSquareQuote className="w-6 h-6 text-amber-700" />
            <span>Customer Reviews & Feedback</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Real impressions from households and professional chefs across India.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-100/80 px-3.5 py-1.5 rounded-full border border-amber-300">
          <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
          <span className="text-xs font-bold text-royal-950">
            {avgRating} / 5.0 Rating ({reviews.length} reviews)
          </span>
        </div>
      </div>

      {/* Review Submit Box */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-md border border-amber-200 mb-8">
        <h3 className="font-extrabold text-base sm:text-lg text-royal-950 mb-1">
          Share Your Experience
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Tell us how KBR spices elevated your daily cooking.
        </p>

        {submitted && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Thank you! Your verified review has been posted.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Spice Quality Rating *
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
              >
                <option value={5}>⭐⭐⭐⭐⭐ 5 Stars (Exceptional Taste & Aroma)</option>
                <option value={4}>⭐⭐⭐⭐ 4 Stars (Very Good Quality)</option>
                <option value={3}>⭐⭐⭐ 3 Stars (Satisfactory)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Your Review & Comments *
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think of the freshness, color, packaging, and flavor?..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="bg-amber-800 hover:bg-amber-900 text-white font-bold py-3 px-8 rounded-xl text-xs sm:text-sm shadow-md transition"
          >
            Post Review
          </button>
        </form>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs hover:border-amber-300 transition"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center font-bold text-xs text-amber-900">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-royal-950">{r.name}</h4>
                  <span className="text-[10px] text-gray-400">
                    {r.date || 'Verified Buyer'}
                  </span>
                </div>
              </div>

              <div className="text-amber-500 text-sm">
                {'★'.repeat(r.rating)}
                {'☆'.repeat(5 - r.rating)}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed pl-10">
              "{r.comment}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
