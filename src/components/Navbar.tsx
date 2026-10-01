import React, { useState, useEffect } from 'react';
import { PageId, UserSession } from '../types';
import { 
  Phone, 
  Truck, 
  Heart, 
  ShoppingCart, 
  Menu, 
  X, 
  User, 
  Package, 
  MessageSquareQuote, 
  HelpCircle, 
  Info, 
  Home, 
  Sparkles,
  LogOut,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface NavbarProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  currentUser: UserSession | null;
  onOpenCustomerLogin: () => void;
  onLogoutCustomer: () => void;
  cartCount: number;
  wishlistCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
  currentUser,
  onOpenCustomerLogin,
  onLogoutCustomer,
  cartCount,
  wishlistCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (page: PageId) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* TOP NOTIFICATION BANNER - Compact & Clean on all devices */}
      <div className="bg-gradient-to-r from-royal-950 via-royal-900 to-royal-950 text-amber-200 text-[10px] sm:text-xs py-1.5 px-3 sm:px-4 border-b border-amber-600/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          {/* Helpline */}
          <a 
            href="tel:+918527386834" 
            className="flex items-center text-amber-300 hover:text-white transition font-medium truncate"
          >
            <Phone className="w-3 h-3 text-amber-400 mr-1.5 shrink-0" />
            <span className="truncate">Helpline: +91 8527386834</span>
          </a>

          {/* Delivery Note */}
          <div className="flex items-center space-x-2 text-[10px] sm:text-xs">
            <span className="inline-flex items-center font-medium text-amber-300">
              <Truck className="w-3 h-3 text-amber-400 mr-1 shrink-0" />
              <span>Express Pan-India Delivery</span>
            </span>
          </div>
        </div>
      </div>

      {/* MAIN STICKY NAVBAR */}
      <header className="bg-royal-950 text-white sticky top-0 z-40 border-b border-amber-600/30 shadow-md w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2">
          
          {/* BRAND LOGO & TITLE */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center space-x-2 shrink-0 cursor-pointer group select-none min-h-[44px]"
            role="button"
            tabIndex={0}
            aria-label="KBR Masale Home"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-50 border border-emerald-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition transform">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 4.4-3.6 8-8 8z" fill="#059669" fillOpacity="0.2"></path>
                <path d="M11 20c-3.3 0-6-2.7-6-6 0-3 2.5-5.5 5.5-5.5" stroke="#047857"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-xs sm:text-sm md:text-base font-extrabold tracking-wider text-amber-400 leading-tight">
                KBR MASALE
              </h1>
              <p className="text-[8px] sm:text-[9px] text-amber-200/80 font-semibold tracking-widest uppercase leading-none">
                Global Ventures
              </p>
            </div>
          </div>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs xl:text-sm font-semibold">
            <button 
              onClick={() => handleNavClick('home')}
              className={`hover:text-amber-400 transition pb-0.5 cursor-pointer ${currentPage === 'home' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-200'}`}
            >
              Home
            </button>
            <button 
              onClick={() => handleNavClick('products')}
              className={`hover:text-amber-400 transition pb-0.5 cursor-pointer ${currentPage === 'products' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-200'}`}
            >
              Products Range
            </button>
            <button 
              onClick={() => handleNavClick('about')}
              className={`hover:text-amber-400 transition pb-0.5 cursor-pointer ${currentPage === 'about' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-200'}`}
            >
              About Us
            </button>
            <button 
              onClick={() => handleNavClick('services')}
              className={`hover:text-amber-400 transition pb-0.5 cursor-pointer ${currentPage === 'services' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-200'}`}
            >
              Services & Help
            </button>
            <button 
              onClick={() => handleNavClick('reviews')}
              className={`hover:text-amber-400 transition pb-0.5 cursor-pointer ${currentPage === 'reviews' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-200'}`}
            >
              Reviews
            </button>
            <button 
              onClick={() => handleNavClick('orders')}
              className={`hover:text-amber-400 transition pb-0.5 cursor-pointer ${currentPage === 'orders' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-200'}`}
            >
              My Orders
            </button>
          </nav>

          {/* RIGHT ACTION ICONS: User, Wishlist, Cart, Hamburger */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Desktop User Greeting */}
            {currentUser ? (
              <div className="hidden md:flex items-center bg-royal-900 border border-amber-500/30 rounded-full pl-2.5 pr-1.5 py-0.5 text-xs text-amber-300">
                <User className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0" />
                <span className="font-semibold max-w-[120px] truncate">
                  {currentUser.fullName || currentUser.email.split('@')[0]}
                </span>
                <button 
                  onClick={onLogoutCustomer}
                  title="Sign out"
                  className="ml-1 p-1 text-gray-400 hover:text-red-400 rounded-full transition cursor-pointer"
                  aria-label="Logout"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenCustomerLogin}
                className="hidden md:inline-flex items-center gap-1 bg-amber-700/80 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1 rounded-full border border-amber-500/40 transition cursor-pointer"
              >
                <User className="w-3 h-3 text-amber-300" />
                <span>Sign In</span>
              </button>
            )}

            {/* Wishlist Button - min 44x44px touch target */}
            <button 
              onClick={() => handleNavClick('wishlist')}
              className={`relative p-2.5 min-w-[44px] min-h-[44px] rounded-xl text-amber-400 hover:bg-royal-900 transition flex items-center justify-center cursor-pointer ${currentPage === 'wishlist' ? 'bg-royal-900 text-amber-300 ring-1 ring-amber-500/40' : ''}`}
              aria-label="Wishlist"
              title="Saved Items"
            >
              <Heart className={`w-5 h-5 text-red-500 ${wishlistCount > 0 ? 'fill-red-500' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-amber-500 text-royal-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button - min 44x44px touch target */}
            <button 
              onClick={() => handleNavClick('cart')}
              className={`relative p-2.5 min-w-[44px] min-h-[44px] rounded-xl text-amber-400 hover:bg-royal-900 transition flex items-center justify-center cursor-pointer ${currentPage === 'cart' ? 'bg-royal-900 text-amber-300 ring-1 ring-amber-500/40' : ''}`}
              aria-label="Shopping Cart"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Menu Toggle - min 44x44px touch target */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] text-amber-400 hover:text-white hover:bg-royal-900 rounded-xl focus:outline-none transition flex items-center justify-center cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER WITH OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Dark Backdrop Overlay */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
            aria-hidden="true"
          />

          {/* Sliding Drawer Container */}
          <div className="fixed top-0 right-0 bottom-0 w-[84vw] max-w-xs bg-[#240303] text-white shadow-2xl border-l border-amber-600/30 flex flex-col z-50 animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-amber-900/60 flex items-center justify-between bg-royal-950">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-amber-50 border border-emerald-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 4.4-3.6 8-8 8z" fill="#059669" fillOpacity="0.2"></path>
                    <path d="M11 20c-3.3 0-6-2.7-6-6 0-3 2.5-5.5 5.5-5.5" stroke="#047857"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-amber-400 leading-tight">KBR MASALE</h3>
                  <p className="text-[8px] text-amber-200/80 uppercase tracking-wider">Global Ventures</p>
                </div>
              </div>

              {/* Close Button - min 44x44px touch target */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 min-w-[44px] min-h-[44px] text-gray-400 hover:text-white rounded-lg flex items-center justify-center transition cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Account Strip in Drawer */}
            <div className="p-3 bg-amber-950/40 border-b border-amber-900/60">
              {currentUser ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 truncate">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-amber-300 truncate">{currentUser.email.split('@')[0]}</p>
                      <p className="text-[10px] text-gray-400 truncate">{currentUser.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onLogoutCustomer();
                      setMobileMenuOpen(false);
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300 font-semibold px-2 py-1 transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCustomerLogin();
                  }}
                  className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Customer Sign In</span>
                </button>
              )}
            </div>

            {/* Nav Links List */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-sm">
              <button 
                onClick={() => handleNavClick('home')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${currentPage === 'home' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-200 hover:bg-royal-900'}`}
              >
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4 text-amber-400" />
                  <span>Home</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button 
                onClick={() => handleNavClick('products')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${currentPage === 'products' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-200 hover:bg-royal-900'}`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Products Range</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button 
                onClick={() => handleNavClick('orders')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${currentPage === 'orders' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-200 hover:bg-royal-900'}`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>My Orders & Tracking</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button 
                onClick={() => handleNavClick('wishlist')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${currentPage === 'wishlist' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-200 hover:bg-royal-900'}`}
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>Saved Spices ({wishlistCount})</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button 
                onClick={() => handleNavClick('services')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${currentPage === 'services' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-200 hover:bg-royal-900'}`}
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>Services & Help</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button 
                onClick={() => handleNavClick('reviews')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${currentPage === 'reviews' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-200 hover:bg-royal-900'}`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquareQuote className="w-4 h-4 text-amber-400" />
                  <span>Customer Reviews</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button 
                onClick={() => handleNavClick('about')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${currentPage === 'about' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-200 hover:bg-royal-900'}`}
              >
                <div className="flex items-center gap-3">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>About Us</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </nav>

            {/* Drawer Footer with Quick Call */}
            <div className="p-3 border-t border-amber-900/60 bg-royal-950 text-xs">
              <a
                href="tel:+918527386834"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 hover:bg-amber-500/30 transition"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Call +91 8527386834</span>
              </a>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                24 Hours Open • Pan-India Delivery
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
