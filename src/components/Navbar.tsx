import React, { useState } from 'react';
import { PageId, UserSession } from '../types';
import { 
  Phone, 
  Mail, 
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
  LogOut
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

  const handleNavClick = (page: PageId) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* TOP NOTIFICATION BANNER */}
      <div className="bg-gradient-to-r from-royal-950 via-royal-900 to-royal-950 text-amber-200 text-[11px] sm:text-xs py-2 px-3 sm:px-4 border-b border-amber-600/30">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          {/* Contact Numbers */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
            <a 
              href="tel:+918527386834" 
              className="flex items-center text-amber-300 hover:text-white transition font-medium"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0" />
              <span>Helpline: +91 8527386834</span>
            </a>
            <span className="hidden md:inline-flex items-center text-amber-200/80">
              <Mail className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0" />
              <span>support@kbrglobalventures.com</span>
            </span>
          </div>

          {/* Delivery Note & Secondary Meta */}
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="inline-flex items-center font-medium text-amber-300">
              <Truck className="w-3.5 h-3.5 text-amber-400 mr-1 shrink-0" />
              <span>Express Pan-India Delivery</span>
            </span>
          </div>
        </div>
      </div>

      {/* MAIN STICKY NAVBAR */}
      <header className="bg-royal-950 text-white sticky top-0 z-40 border-b border-amber-600/30 shadow-lg w-full transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          
          {/* BRAND LOGO */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center space-x-2.5 shrink-0 cursor-pointer group select-none"
            role="button"
            tabIndex={0}
            aria-label="KBR Masale Home"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-50 border-2 border-emerald-600 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition transform">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 4.4-3.6 8-8 8z" fill="#059669" fillOpacity="0.2"></path>
                <path d="M11 20c-3.3 0-6-2.7-6-6 0-3 2.5-5.5 5.5-5.5" stroke="#047857"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-sm sm:text-base md:text-lg font-extrabold tracking-wider text-amber-400 leading-tight">
                KBR MASALE
              </h1>
              <p className="text-[9px] sm:text-[10px] text-amber-200/80 font-medium tracking-widest uppercase">
                Global Ventures
              </p>
            </div>
          </div>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs xl:text-sm font-semibold">
            <button 
              onClick={() => handleNavClick('home')}
              className={`hover:text-amber-400 transition pb-0.5 ${currentPage === 'home' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-200'}`}
            >
              Home
            </button>
            <button 
              onClick={() => handleNavClick('products')}
              className={`hover:text-amber-400 transition pb-0.5 ${currentPage === 'products' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-200'}`}
            >
              Products Range
            </button>
            <button 
              onClick={() => handleNavClick('about')}
              className={`hover:text-amber-400 transition pb-0.5 ${currentPage === 'about' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-200'}`}
            >
              About Us
            </button>
            <button 
              onClick={() => handleNavClick('services')}
              className={`hover:text-amber-400 transition pb-0.5 ${currentPage === 'services' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-200'}`}
            >
              Services & Help
            </button>
            <button 
              onClick={() => handleNavClick('reviews')}
              className={`hover:text-amber-400 transition pb-0.5 ${currentPage === 'reviews' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-200'}`}
            >
              Reviews
            </button>
            <button 
              onClick={() => handleNavClick('orders')}
              className={`hover:text-amber-400 transition pb-0.5 ${currentPage === 'orders' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-200'}`}
            >
              My Orders
            </button>
          </nav>

          {/* RIGHT ACTION BUTTONS */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* User Profile Badge / Login trigger */}
            {currentUser ? (
              <div className="flex items-center bg-royal-900/90 border border-amber-500/40 rounded-full pl-2 pr-1 py-1 max-w-[140px] sm:max-w-[170px]">
                <span className="text-[11px] font-bold text-amber-300 truncate mr-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{currentUser.email.split('@')[0]}</span>
                </span>
                <button 
                  onClick={onLogoutCustomer}
                  title="Switch / Sign out"
                  className="p-1 text-gray-400 hover:text-red-400 rounded-full hover:bg-black/30 transition"
                  aria-label="Logout"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenCustomerLogin}
                className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Wishlist Button */}
            <button 
              onClick={() => handleNavClick('wishlist')}
              className={`relative p-2 rounded-xl text-amber-400 hover:bg-royal-900 transition flex items-center justify-center ${currentPage === 'wishlist' ? 'bg-royal-900 ring-1 ring-amber-500/50' : ''}`}
              aria-label="Wishlist"
              title="Saved Spices"
            >
              <Heart className="w-5 h-5 text-red-500 fill-red-500/30 hover:fill-red-500 transition" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-royal-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button 
              onClick={() => handleNavClick('cart')}
              className={`relative p-2 rounded-xl text-amber-400 hover:bg-royal-900 transition flex items-center justify-center ${currentPage === 'cart' ? 'bg-royal-900 ring-1 ring-amber-500/50' : ''}`}
              aria-label="Shopping Cart"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-amber-400 hover:text-white hover:bg-royal-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* MOBILE NAVIGATION DRAWER / DROPDOWN */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-royal-950/98 backdrop-blur-md border-t border-amber-600/30 px-4 py-4 space-y-1.5 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            {!currentUser && (
              <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-300">Welcome to KBR Masale</p>
                  <p className="text-[11px] text-gray-300">Sign in for express checkout</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCustomerLogin();
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow"
                >
                  Sign In
                </button>
              </div>
            )}

            <button 
              onClick={() => handleNavClick('home')}
              className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition ${currentPage === 'home' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-200 hover:bg-royal-900 hover:text-amber-400'}`}
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span>Home</span>
            </button>

            <button 
              onClick={() => handleNavClick('products')}
              className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition ${currentPage === 'products' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-200 hover:bg-royal-900 hover:text-amber-400'}`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Products Range</span>
            </button>

            <button 
              onClick={() => handleNavClick('orders')}
              className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition ${currentPage === 'orders' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-200 hover:bg-royal-900 hover:text-amber-400'}`}
            >
              <Package className="w-4 h-4 text-amber-400" />
              <span>My Orders & Tracking</span>
            </button>

            <button 
              onClick={() => handleNavClick('about')}
              className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition ${currentPage === 'about' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-200 hover:bg-royal-900 hover:text-amber-400'}`}
            >
              <Info className="w-4 h-4 text-amber-400" />
              <span>About Us</span>
            </button>

            <button 
              onClick={() => handleNavClick('services')}
              className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition ${currentPage === 'services' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-200 hover:bg-royal-900 hover:text-amber-400'}`}
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Services & Help</span>
            </button>

            <button 
              onClick={() => handleNavClick('reviews')}
              className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition ${currentPage === 'reviews' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-200 hover:bg-royal-900 hover:text-amber-400'}`}
            >
              <MessageSquareQuote className="w-4 h-4 text-amber-400" />
              <span>Customer Reviews</span>
            </button>

            <div className="pt-3 border-t border-amber-800/40 text-xs text-amber-300/80 flex items-center justify-between px-3">
              <span>Helpline: +91 8527386834</span>
              <span>24/7 Available</span>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
