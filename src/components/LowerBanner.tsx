import React from 'react';
import { PageId } from '../types';
import { Sparkles, Truck, ShieldCheck, PhoneCall, ArrowRight, HeartHandshake } from 'lucide-react';

interface LowerBannerProps {
  onNavigate: (page: PageId) => void;
}

export const LowerBanner: React.FC<LowerBannerProps> = ({ onNavigate }) => {
  return (
    <section className="relative overflow-hidden my-8 sm:my-12 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-br from-[#2b0000] via-[#4a0000] to-[#200000] text-white p-6 sm:p-10 lg:p-12 border-2 border-amber-500/40 shadow-2xl relative">
        {/* Decorative background glow & pattern */}
        <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Copy */}
          <div className="lg:col-span-7 space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Authentic Indian Heritage & Purity</span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-400 tracking-tight leading-tight">
              KBR Global Ventures
            </h3>
            
            <p className="text-sm sm:text-base text-amber-100/90 font-light leading-relaxed max-w-2xl">
              From traditional spice orchards directly to your kitchen. We bring you hand-picked, hygienically ground masale preserving every ounce of essential natural oils, vibrant aroma, and unadulterated taste.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/25 border border-amber-500/20 text-left">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs font-medium text-amber-100">100% Pure & Lab Verified</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/25 border border-amber-500/20 text-left">
                <Truck className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs font-medium text-amber-100">Pan-India Express Delivery</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/25 border border-amber-500/20 text-left">
                <HeartHandshake className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs font-medium text-amber-100">7-Day Freshness Assurance</span>
              </div>
            </div>
          </div>

          {/* Action Card / Helpline */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
            <div className="p-5 rounded-2xl bg-amber-950/60 border border-amber-500/30 text-center sm:text-left space-y-3">
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-amber-300 uppercase tracking-wider font-bold">Direct Order Helpline</div>
                  <a 
                    href="tel:+918527386834" 
                    className="text-base sm:text-lg font-extrabold text-white hover:text-amber-400 transition"
                  >
                    +91 8527386834
                  </a>
                </div>
              </div>
              <p className="text-[11px] text-gray-300 leading-snug">
                Need bulk orders, culinary assistance or customized spice packaging? Our support desk is available 24/7.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                onClick={() => {
                  onNavigate('products');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-royal-950 font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer"
              >
                <span>Explore Spice Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => {
                  onNavigate('services');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm border border-amber-400/30 transition text-center cursor-pointer"
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
