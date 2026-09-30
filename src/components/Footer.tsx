import React from 'react';
import { PageId } from '../types';
import { Phone, Clock, Instagram, Youtube, Facebook, MapPin } from 'lucide-react';

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
    <footer className="bg-[#2b0404] text-white pt-8 sm:pt-10 pb-5 border-t-2 border-amber-500/80 mt-10 sm:mt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Responsive Multi-Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 text-left">
          
          {/* Column 1: Brand Info (Spans 2 cols on mobile for great readability) */}
          <div className="col-span-2 md:col-span-1 space-y-2.5">
            <h3 className="text-amber-400 font-extrabold text-base tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
              <span>KBR GLOBAL VENTURES</span>
            </h3>
            <p className="text-gray-300 text-xs leading-relaxed max-w-sm">
              Premium quality pure Indian masale packaged with complete hygiene and perfection. Direct from traditional cultivation centers to your kitchen.
            </p>
            <div className="pt-1 space-y-1 text-xs text-amber-300 font-medium">
              <a href="tel:+918527386834" className="flex items-center gap-1.5 hover:text-white transition">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Support: +91 8527386834</span>
              </a>
              <div className="flex items-center gap-1.5 text-amber-200/80 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Opening Time: 24 Hours Open</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div className="col-span-1">
            <h4 className="text-amber-400 font-bold text-xs mb-2.5 uppercase tracking-wider">
              QUICK NAVIGATION
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300">
              <li>
                <button 
                  onClick={() => handleNav('home')} 
                  className="hover:text-amber-400 transition py-0.5 cursor-pointer text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('products')} 
                  className="hover:text-amber-400 transition py-0.5 cursor-pointer text-left"
                >
                  Products Range
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('about')} 
                  className="hover:text-amber-400 transition py-0.5 cursor-pointer text-left"
                >
                  About Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('services')} 
                  className="hover:text-amber-400 transition py-0.5 cursor-pointer text-left"
                >
                  Services & Help
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('reviews')} 
                  className="hover:text-amber-400 transition py-0.5 cursor-pointer text-left"
                >
                  Customer Reviews
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Policies */}
          <div className="col-span-1">
            <h4 className="text-amber-400 font-bold text-xs mb-2.5 uppercase tracking-wider">
              POLICIES
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300">
              <li>
                <button 
                  onClick={() => handleNav('privacy')} 
                  className="hover:text-amber-400 transition py-0.5 cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('return')} 
                  className="hover:text-amber-400 transition py-0.5 cursor-pointer text-left"
                >
                  Return Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('services')} 
                  className="hover:text-amber-400 transition py-0.5 cursor-pointer text-left"
                >
                  Support Ticket
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('orders')} 
                  className="hover:text-amber-400 transition py-0.5 cursor-pointer text-left"
                >
                  Track Order
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Social Connect */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-amber-400 font-bold text-xs mb-2.5 uppercase tracking-wider">
              SOCIAL CONNECT
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Instagram className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span className="truncate">Instagram <span className="text-[10px] text-amber-300/70">(Soon)</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="truncate">YouTube <span className="text-[10px] text-amber-300/70">(Soon)</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Facebook className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">Facebook <span className="text-[10px] text-amber-300/70">(Soon)</span></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Google Map <span className="text-[10px] text-amber-300/70">(Soon)</span></span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Strip — No obvious Admin Login link for customers */}
        <div className="pt-4 border-t border-amber-900/50 flex flex-col sm:flex-row justify-between items-center text-center text-xs text-amber-200/70 gap-2">
          <div>
            <span 
              onClick={onAdminTrigger} 
              className="cursor-default select-none"
              title="KBR Global Ventures"
            >
              ©
            </span>{' '}
            2026 KBR Global Ventures. All Rights Reserved. Helpline: +91 8527386834
          </div>
          <div className="text-[11px] text-amber-300/60">
            FSSAI Standards Compliant • Pure Hand-Crafted Spices
          </div>
        </div>

      </div>
    </footer>
  );
};
