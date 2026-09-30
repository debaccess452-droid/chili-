import React, { useState, useEffect } from 'react';
import { CartItem, CustomerQuery, Order, PageId, Product, Review, UserSession } from './types';
import { 
  getStoredProducts, 
  saveStoredProducts, 
  getStoredCart, 
  saveStoredCart, 
  getStoredWishlist, 
  saveStoredWishlist, 
  getStoredOrders, 
  saveStoredOrders, 
  getStoredUsers, 
  saveStoredUsers, 
  getStoredQueries, 
  saveStoredQueries, 
  getStoredReviews, 
  saveStoredReviews, 
  getStoredCurrentUser, 
  saveStoredCurrentUser,
  getAdminAuthSession,
  setAdminAuthSession
} from './utils/storage';
import { SPICE_CATEGORIES } from './data/initialData';

// Components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LowerBanner } from './components/LowerBanner';
import { ProductCard } from './components/ProductCard';
import { CartView } from './components/CartView';
import { CheckoutView } from './components/CheckoutView';
import { OrdersView } from './components/OrdersView';
import { WishlistView } from './components/WishlistView';
import { ServicesView } from './components/ServicesView';
import { ReviewsView } from './components/ReviewsView';
import { StaticViews } from './components/StaticViews';
import { CustomerLoginModal } from './components/CustomerLoginModal';
import { AdminModal } from './components/AdminModal';
import { AdminPanel } from './components/AdminPanel';

import { 
  Truck, 
  ShieldCheck, 
  Award, 
  Headphones, 
  Search, 
  ArrowRight, 
  Sparkles,
  CheckCircle,
  Filter
} from 'lucide-react';

export default function App() {
  // State management
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<(number | string)[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserSession[]>([]);
  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Modals & Admin
  const [isCustomerLoginOpen, setIsCustomerLoginOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Product filtering & search
  const [selectedCategory, setSelectedCategory] = useState<string>('All Spices');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Initialize data on mount
  useEffect(() => {
    setProducts(getStoredProducts());
    setCart(getStoredCart());
    setWishlist(getStoredWishlist());
    setOrders(getStoredOrders());
    setUsers(getStoredUsers());
    setQueries(getStoredQueries());
    setReviews(getStoredReviews());
    setCurrentUser(getStoredCurrentUser());
    setIsAdminAuthenticated(getAdminAuthSession());

    // Check URL hash for dedicated admin route or other page
    const checkHashRoute = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'admin') {
        const authed = getAdminAuthSession();
        if (authed) {
          setCurrentPage('admin');
        } else {
          setIsAdminModalOpen(true);
        }
      } else if (
        ['home', 'products', 'cart', 'checkout', 'orders', 'wishlist', 'services', 'reviews', 'about', 'privacy', 'return'].includes(hash)
      ) {
        setCurrentPage(hash as PageId);
      }
    };

    checkHashRoute();
    window.addEventListener('hashchange', checkHashRoute);

    // Keyboard shortcut for administrator access (Shift + A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        const authed = getAdminAuthSession();
        if (authed) {
          setCurrentPage('admin');
        } else {
          setIsAdminModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkHashRoute);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Update hash when page changes
  const handleSetPage = (page: PageId) => {
    if (page === 'admin') {
      if (!isAdminAuthenticated) {
        setIsAdminModalOpen(true);
        return;
      }
    }
    setCurrentPage(page);
    window.location.hash = page === 'home' ? '' : page;
  };

  // Product Add / Update / Delete handlers (Saves to state and localStorage)
  const handleAddProduct = (newProduct: Product) => {
    const updated = [newProduct, ...products];
    setProducts(updated);
    saveStoredProducts(updated);
    showToast(`"${newProduct.name}" uploaded successfully and is now live!`);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const updated = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    setProducts(updated);
    saveStoredProducts(updated);
    showToast(`Updated "${updatedProduct.name}" details.`);
  };

  const handleDeleteProduct = (productId: number | string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveStoredProducts(updated);
    showToast('Product removed from store.');
  };

  const handleToggleStock = (productId: number | string) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return { ...p, inStock: !p.inStock };
      }
      return p;
    });
    setProducts(updated);
    saveStoredProducts(updated);
  };

  // Cart operations
  const handleAddToCart = (product: Product, selectedWeight: string, price: number) => {
    const cartItemId = `${product.id}-${selectedWeight}`;
    const existingIndex = cart.findIndex((item) => item.cartItemId === cartItemId);

    let updatedCart: CartItem[];
    if (existingIndex > -1) {
      updatedCart = [...cart];
      updatedCart[existingIndex].qty += 1;
    } else {
      updatedCart = [
        ...cart,
        {
          cartItemId,
          id: product.id,
          name: product.name,
          weight: selectedWeight,
          price,
          image: product.image,
          qty: 1,
        },
      ];
    }
    setCart(updatedCart);
    saveStoredCart(updatedCart);
    showToast(`Added ${product.name} (${selectedWeight}) to cart`);
  };

  const handleUpdateQty = (cartItemId: string, delta: number) => {
    let updatedCart = cart.map((item) => {
      if (item.cartItemId === cartItemId) {
        return { ...item, qty: item.qty + delta };
      }
      return item;
    });
    updatedCart = updatedCart.filter((item) => item.qty > 0);
    setCart(updatedCart);
    saveStoredCart(updatedCart);
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    const updatedCart = cart.filter((item) => item.cartItemId !== cartItemId);
    setCart(updatedCart);
    saveStoredCart(updatedCart);
    showToast('Item removed from cart.');
  };

  // Wishlist toggle
  const handleToggleWishlist = (productId: number | string) => {
    let updatedWishlist: (number | string)[];
    if (wishlist.includes(productId)) {
      updatedWishlist = wishlist.filter((id) => id !== productId);
      showToast('Removed from wishlist');
    } else {
      updatedWishlist = [...wishlist, productId];
      showToast('Added to saved items');
    }
    setWishlist(updatedWishlist);
    saveStoredWishlist(updatedWishlist);
  };

  // Orders
  const handlePlaceOrder = (newOrder: Order) => {
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    saveStoredOrders(updatedOrders);
    setCart([]);
    saveStoredCart([]);
    handleSetPage('orders');
    showToast(`Order Placed! ID: #${newOrder.id}`);
  };

  const handleUpdateOrderStatus = (orderIndex: number, newStatus: Order['status']) => {
    const updated = [...orders];
    if (updated[orderIndex]) {
      updated[orderIndex] = { ...updated[orderIndex], status: newStatus };
      setOrders(updated);
      saveStoredOrders(updated);
      showToast(`Order #${updated[orderIndex].id} status changed to ${newStatus}`);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    const updated = orders.filter((o) => o.id !== orderId);
    setOrders(updated);
    saveStoredOrders(updated);
    showToast(`Order #${orderId} deleted.`);
  };

  // Customer Queries
  const handleSubmitQuery = (phone: string, queryText: string) => {
    const newQuery: CustomerQuery = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-IN'),
      phone,
      query: queryText,
    };
    const updated = [newQuery, ...queries];
    setQueries(updated);
    saveStoredQueries(updated);
  };

  const handleDeleteQuery = (queryId: number) => {
    const updated = queries.filter((q) => q.id !== queryId);
    setQueries(updated);
    saveStoredQueries(updated);
  };

  // Customer Reviews
  const handleSubmitReview = (name: string, rating: number, comment: string) => {
    const newRev: Review = {
      id: Date.now(),
      name,
      rating,
      comment,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
    const updated = [newRev, ...reviews];
    setReviews(updated);
    saveStoredReviews(updated);
  };

  const handleDeleteReview = (reviewId: number) => {
    const updated = reviews.filter((r) => r.id !== reviewId);
    setReviews(updated);
    saveStoredReviews(updated);
  };

  // Customer Login Gateway
  const handleCustomerLogin = (user: UserSession) => {
    setCurrentUser(user);
    saveStoredCurrentUser(user);

    // Register user in users directory if not already there
    const exists = users.some((u) => u.phone === user.phone);
    if (!exists) {
      const updatedUsers = [user, ...users];
      setUsers(updatedUsers);
      saveStoredUsers(updatedUsers);
    }
    showToast(`Welcome, ${user.email.split('@')[0]}!`);
  };

  const handleLogoutCustomer = () => {
    setCurrentUser(null);
    saveStoredCurrentUser(null);
    showToast('Signed out of customer account.');
  };

  // Admin Login Gateway
  const handleAdminSuccess = () => {
    setIsAdminAuthenticated(true);
    setAdminAuthSession(true);
    setCurrentPage('admin');
    window.location.hash = 'admin';
    showToast('Super Admin authenticated successfully.');
  };

  const handleExitAdmin = () => {
    setCurrentPage('home');
    window.location.hash = '';
  };

  // Filtered Products for Customer Store
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All Spices' || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredProducts = products.filter((p) => p.isFeatured !== false);

  const totalCartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf8f2] text-gray-800 antialiased selection:bg-amber-200 selection:text-amber-900">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 bg-royal-950 text-amber-300 px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/40 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Responsive Header */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={handleSetPage}
        currentUser={currentUser}
        onOpenCustomerLogin={() => setIsCustomerLoginOpen(true)}
        onLogoutCustomer={handleLogoutCustomer}
        cartCount={totalCartCount}
        wishlistCount={wishlist.length}
      />

      {/* Customer Login Gate Modal */}
      <CustomerLoginModal
        isOpen={isCustomerLoginOpen}
        onClose={() => setIsCustomerLoginOpen(false)}
        onLogin={handleCustomerLogin}
      />

      {/* Admin Authentication Modal (Protected Gateway) */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminSuccess}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow">
        
        {/* ===================== PAGE: HOME ===================== */}
        {currentPage === 'home' && (
          <div className="animate-in fade-in duration-200">
            
            {/* HERO BANNER SECTION (Mobile-First, viewport-friendly, no excessive blank space) */}
            <section className="max-w-7xl mx-auto my-3 sm:my-5 px-3 sm:px-4 lg:px-6">
              <div className="relative h-[320px] sm:h-[380px] md:h-[430px] lg:h-[480px] w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-amber-500/30 group">
                <img
                  src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=80"
                  alt="Traditional Indian Spices Banner"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                />
                
                {/* Optimized gradient overlay for high contrast & zero text clipping */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/20 flex flex-col justify-end p-4 sm:p-6 md:p-10 lg:p-12 text-white">
                  <div className="max-w-2xl">
                    <span className="inline-block bg-amber-500 text-royal-950 font-black text-[10px] sm:text-xs px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full uppercase tracking-wider mb-2 shadow-xs">
                      100% Pure & Authentic Masale
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold leading-tight tracking-tight drop-shadow-md">
                      Authentic Indian Flavors
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-amber-100/90 mt-1.5 sm:mt-2 max-w-lg font-normal leading-relaxed line-clamp-2 sm:line-clamp-3">
                      Finest hand-ground masales, high-curcumin turmeric, stemless chillies, and traditional spice blends crafted with complete hygiene.
                    </p>

                    <div className="mt-3.5 sm:mt-5 flex flex-wrap gap-2 sm:gap-3">
                      <button
                        onClick={() => handleSetPage('products')}
                        className="flex-1 sm:flex-none bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold px-4 sm:px-6 py-2.5 sm:py-3 min-h-[44px] rounded-xl text-xs sm:text-sm shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Explore All Spices</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSetPage('about')}
                        className="flex-1 sm:flex-none bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold px-4 sm:px-5 py-2.5 sm:py-3 min-h-[44px] rounded-xl text-xs sm:text-sm border border-white/30 transition text-center cursor-pointer"
                      >
                        Our Purity Standards
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* COMPACT FEATURE & TRUST CARDS (3 Core Features, No Excessive Vertical Blank Space) */}
            <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 my-4 sm:my-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
                <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-200/90 shadow-xs flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100/90 text-amber-800 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-royal-950 leading-tight">100% Pure & Lab Tested</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Natural aroma & zero synthetic dyes</p>
                  </div>
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-200/90 shadow-xs flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100/90 text-amber-800 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-royal-950 leading-tight">Hygienic Cold Processing</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Preserves vital aromatic essential oils</p>
                  </div>
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-200/90 shadow-xs flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100/90 text-amber-800 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-royal-950 leading-tight">7-Day Freshness Guarantee</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Freshly packed with doorstep exchange</p>
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURED MASALAS SECTION */}
            <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-amber-200/80 pb-3 mb-5">
                <div>
                  <h3 className="text-lg sm:text-2xl font-extrabold text-royal-950">
                    Featured Masalas
                  </h3>
                  <p className="text-xs text-gray-500">
                    Hand-picked kitchen essentials available in customized pack sizes.
                  </p>
                </div>
                <button
                  onClick={() => handleSetPage('products')}
                  className="text-xs sm:text-sm font-bold text-amber-800 hover:text-amber-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Responsive Product Grid: 1 col on mobile, 2 col on tablet, 3-4 col on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
                {featuredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={wishlist.includes(p.id)}
                  />
                ))}
              </div>
            </section>

            {/* COMPANY HERITAGE & QUALITY SECTION (Readable width, comfortable padding, no blank sprawl) */}
            <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 my-6 sm:my-8">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-amber-200 p-5 sm:p-7 md:p-9 shadow-xs">
                <div className="max-w-3xl mx-auto text-center space-y-3">
                  <span className="text-[10px] font-extrabold uppercase px-3 py-1 bg-amber-100 text-amber-800 rounded-full inline-block">
                    KBR Global Ventures Story
                  </span>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-royal-950">
                    Heritage of Purity in Every Pinch
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
                    At <strong>KBR Global Ventures</strong>, we are committed to reviving the unadulterated taste of traditional Indian cooking. Our spices are ethically procured from regional farming belts, sorted by hand, and ground under controlled temperatures to safeguard their natural medicinal benefits and volatile fragrance.
                  </p>
                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={() => handleSetPage('about')}
                      className="text-xs font-bold text-amber-800 hover:text-amber-900 border-b border-amber-800 pb-0.5 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read Our Full Story & Lab Standards</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* ===================== PAGE: PRODUCTS (FULL RANGE) ===================== */}
        {currentPage === 'products' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-10 animate-in fade-in duration-200">
            <div className="border-b border-amber-200 pb-4 mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-royal-950">
                Our Full Spice Collection
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Select pack weight (25g to 1kg) for real-time pricing and express doorstep delivery.
              </p>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="mb-8 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by spice name (Haldi, Mirch, Dhania, Garam Masala)..."
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-amber-200 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {SPICE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-amber-800 text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-amber-200 p-6 max-w-md mx-auto">
                <p className="text-sm font-bold text-gray-600">No spices found matching your search.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Spices');
                  }}
                  className="mt-3 text-xs text-amber-800 underline font-semibold"
                >
                  Clear search and view all
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={wishlist.includes(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== PAGE: CART ===================== */}
        {currentPage === 'cart' && (
          <CartView
            cart={cart}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveFromCart}
            onProceedToCheckout={() => handleSetPage('checkout')}
            onContinueShopping={() => handleSetPage('products')}
          />
        )}

        {/* ===================== PAGE: CHECKOUT ===================== */}
        {currentPage === 'checkout' && (
          <CheckoutView
            cart={cart}
            currentUser={currentUser}
            onPlaceOrder={handlePlaceOrder}
            onBackToCart={() => handleSetPage('cart')}
          />
        )}

        {/* ===================== PAGE: ORDERS ===================== */}
        {currentPage === 'orders' && (
          <OrdersView
            orders={orders}
            onShopMore={() => handleSetPage('products')}
          />
        )}

        {/* ===================== PAGE: WISHLIST ===================== */}
        {currentPage === 'wishlist' && (
          <WishlistView
            products={products}
            wishlistIds={wishlist}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            onExploreProducts={() => handleSetPage('products')}
          />
        )}

        {/* ===================== PAGE: SERVICES / CUSTOMER CARE ===================== */}
        {currentPage === 'services' && (
          <ServicesView onSubmitQuery={handleSubmitQuery} />
        )}

        {/* ===================== PAGE: REVIEWS ===================== */}
        {currentPage === 'reviews' && (
          <ReviewsView reviews={reviews} onSubmitReview={handleSubmitReview} />
        )}

        {/* ===================== PAGES: ABOUT, PRIVACY, RETURN ===================== */}
        {['about', 'privacy', 'return'].includes(currentPage) && (
          <StaticViews
            page={currentPage as 'about' | 'privacy' | 'return'}
            onNavigateHome={() => handleSetPage('home')}
          />
        )}

        {/* ===================== PAGE: SUPER ADMIN DASHBOARD ===================== */}
        {currentPage === 'admin' && (
          <AdminPanel
            products={products}
            orders={orders}
            users={users}
            queries={queries}
            reviews={reviews}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onToggleStock={handleToggleStock}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
            onDeleteQuery={handleDeleteQuery}
            onDeleteReview={handleDeleteReview}
            onExitAdmin={handleExitAdmin}
          />
        )}

      </main>

      {/* Customer-Facing Lower Banner (Kept intact, responsive, with NO visible admin login) */}
      {currentPage !== 'admin' && (
        <LowerBanner onNavigate={handleSetPage} />
      )}

      {/* Main Responsive Footer (WITHOUT customer-visible Admin link) */}
      <Footer
        setCurrentPage={handleSetPage}
        onAdminTrigger={() => {
          if (isAdminAuthenticated) {
            handleSetPage('admin');
          } else {
            setIsAdminModalOpen(true);
          }
        }}
      />

    </div>
  );
}
