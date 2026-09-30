import React from 'react';
import { PageId } from '../types';
import { Sparkles, Truck, ShieldCheck, PhoneCall, ArrowRight, HeartHandshake } from 'lucide-react';

interface LowerBannerProps {
  onNavigate: (page: PageId) => void;
}

export const LowerBanner: React.FC<LowerBannerProps> = ({ onNavigate }) => {
  return (
    <section className="relative overflow-hidden my-6 sm:my-8 lg:my-10 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#2b0000] via-[#4a0000] to-[#200000] text-white p-5 sm:p-7 md:p-9 border-2 border-amber-500/40 shadow-xl relative">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
          {/* Main Brand Copy */}
          <div className="lg:col-span-7 space-y-2.5 sm:space-y-3 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Authentic Indian Heritage & Purity</span>
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-400 tracking-tight leading-tight">
              KBR Global Ventures
            </h3>
            
            <p className="text-xs sm:text-sm text-amber-100/90 font-light leading-relaxed max-w-xl">
              From traditional spice orchards directly to your kitchen. We bring you hand-picked, hygienically ground masale preserving every ounce of essential natural oils, vibrant aroma, and unadulterated taste.
            </p>

            {/* Compact Feature Highlights Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-left">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-amber-500/20">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] font-semibold text-amber-100">100% Pure & Lab Verified</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-amber-500/20">
                <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] font-semibold text-amber-100">Pan-India Express Delivery</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-amber-500/20">
                <HeartHandshake className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] font-semibold text-amber-100">7-Day Freshness Assurance</span>
              </div>
            </div>
          </div>

          {/* Action & Direct Helpline Card */}
          <div className="lg:col-span-5 flex flex-col gap-2.5 justify-center">
            <div className="p-3.5 sm:p-4 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3 truncate">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-[10px] text-amber-300 uppercase tracking-wider font-bold">24/7 Helpline Desk</div>
                  <a 
                    href="tel:+918527386834" 
                    className="text-sm sm:text-base font-extrabold text-white hover:text-amber-400 transition"
                  >
                    +91 8527386834
                  </a>
                </div>
              </div>
              <span className="hidden sm:inline-block text-[10px] bg-emerald-700/60 text-emerald-200 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                Live Support
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  onNavigate('products');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-royal-950 font-extrabold py-2.5 sm:py-3 px-4 min-h-[44px] rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer"
              >
                <span>Explore Spice Range</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => {
                  onNavigate('services');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 sm:py-3 px-4 min-h-[44px] rounded-xl text-xs sm:text-sm border border-amber-400/30 transition text-center cursor-pointer"
              >
                Customer Care Desk
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
