import React from 'react';
import { PageId } from '../types';
import { Phone, Clock, Instagram, Youtube, Facebook, MapPin, ShieldCheck, RefreshCw, Award } from 'lucide-react';

interface FooterProps {
  setCurrentPage: (page: PageId) => void;
  onAdminTrigger?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentPage, onAdminTrigger }) => {
  const handleNav = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#3b0909] text-white pt-10 sm:pt-12 pb-6 border-t-4 border-amber-500 mt-16 sm:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trust Badges Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-8 sm:pb-10 mb-8 sm:mb-10 border-b border-amber-900/60 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl bg-amber-950/40 border border-amber-600/20">
            <Award className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <h5 className="text-xs sm:text-sm font-bold text-amber-200">100% Pure & Lab Tested</h5>
              <p className="text-[11px] text-gray-300">Natural aroma & zero artificial coloring</p>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl bg-amber-950/40 border border-amber-600/20">
            <ShieldCheck className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <h5 className="text-xs sm:text-sm font-bold text-amber-200">Hygienic Cold Processing</h5>
              <p className="text-[11px] text-gray-300">Preserves vital essential spice oils</p>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl bg-amber-950/40 border border-amber-600/20">
            <RefreshCw className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <h5 className="text-xs sm:text-sm font-bold text-amber-200">7-Day Freshness Guarantee</h5>
              <p className="text-[11px] text-gray-300">Hassle-free replacement policy</p>
            </div>
          </div>
        </div>

        {/* 4-Column Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 text-left">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-3">
            <h3 className="text-amber-400 font-extrabold text-base sm:text-lg tracking-wide">
              KBR GLOBAL VENTURES
            </h3>
            <p className="text-gray-300 text-xs leading-relaxed">
              Premium quality pure Indian masale packaged with complete hygiene and perfection. Direct from traditional cultivation centers to your kitchen.
            </p>
            <div className="pt-2 space-y-1.5 text-xs text-amber-400 font-bold">
              <a href="tel:+918527386834" className="flex items-center gap-2 hover:text-white transition">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>Support: 8527386834</span>
              </a>
              <div className="flex items-center gap-2 text-amber-300">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Opening Time: 24 Hours Open</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div>
            <h4 className="text-amber-400 font-bold text-xs sm:text-sm mb-3 uppercase tracking-wider">
              QUICK NAVIGATION
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <button 
                  onClick={() => handleNav('home')} 
                  className="hover:text-amber-400 transition py-0.5"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('products')} 
                  className="hover:text-amber-400 transition py-0.5"
                >
                  Products Range
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('about')} 
                  className="hover:text-amber-400 transition py-0.5"
                >
                  About Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('services')} 
                  className="hover:text-amber-400 transition py-0.5"
                >
                  Services & Help
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('reviews')} 
                  className="hover:text-amber-400 transition py-0.5"
                >
                  Customer Reviews
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Policies */}
          <div>
            <h4 className="text-amber-400 font-bold text-xs sm:text-sm mb-3 uppercase tracking-wider">
              POLICIES & ASSURANCE
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <button 
                  onClick={() => handleNav('privacy')} 
                  className="hover:text-amber-400 transition py-0.5"
                >
                  Privacy & Data Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('return')} 
                  className="hover:text-amber-400 transition py-0.5"
                >
                  Return & Refund Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('services')} 
                  className="hover:text-amber-400 transition py-0.5"
                >
                  Customer Support Ticket
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Social Connect */}
          <div>
            <h4 className="text-amber-400 font-bold text-xs sm:text-sm mb-3 uppercase tracking-wider">
              SOCIAL CONNECT
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-300">
              <li className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
                <span>Instagram: <span className="font-semibold text-white">COMING SOON</span></span>
              </li>
              <li className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                <span>YouTube: <span className="font-semibold text-white">COMING SOON</span></span>
              </li>
              <li className="flex items-center gap-2">
                <Facebook className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Facebook: <span className="font-semibold text-white">COMING SOON</span></span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Google Map: <span className="font-semibold text-white">COMING SOON</span></span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Strip — Notice: NO visible admin button */}
        <div className="pt-6 border-t border-amber-900/60 flex flex-col sm:flex-row justify-between items-center text-center text-xs text-amber-200/80 gap-2">
          <div>
            <span 
              onClick={onAdminTrigger} 
              className="cursor-default select-none"
              title="KBR Global Ventures"
            >
              ©
            </span>{' '}
            2026 KBR Global Ventures. All Rights Reserved. Contact: 8527386834
          </div>
          <div className="text-[11px] text-amber-300/60">
            FSSAI Standards Compliant • Hand-Crafted Spices
          </div>
        </div>

      </div>
    </footer>
  );
};
