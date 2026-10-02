import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { CartItem, CustomerQuery, Order, PageId, Product, Review, UserSession } from './types';
import { 
  getStoredCart, 
  saveStoredCart, 
  getStoredWishlist, 
  saveStoredWishlist, 
  getStoredOrders, 
  saveStoredOrders, 
  getStoredQueries, 
  saveStoredQueries, 
  getStoredReviews, 
  saveStoredReviews
} from './utils/storage';
import { supabase } from './lib/supabase';
import { 
  signOutUser, 
  checkIsAdmin, 
  fetchUserProfile, 
  fetchAllCustomerProfiles,
  buildUserSession 
} from './services/authService';
import { fetchProducts, fetchCategories } from './services/catalogService';
import { 
  fetchCart, 
  addToCart, 
  updateCartItemQuantity, 
  removeCartItem, 
  clearCart, 
  mergeGuestCart 
} from './services/cartService';

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
import { ResetPasswordModal } from './components/ResetPasswordModal';
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
  Filter,
  Lock,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const HERO_BANNER_BG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600" width="1600" height="600">
  <defs>
    <radialGradient id="spicesGlow" cx="65%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#92400e" stop-opacity="0.9"/>
      <stop offset="45%" stop-color="#451a03" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#1c0a00" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="warmLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.75"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="600" fill="url(#spicesGlow)"/>
  <rect width="1600" height="600" fill="url(#warmLight)"/>
  <g opacity="0.2" transform="translate(1050, 100)">
    <circle cx="200" cy="180" r="160" fill="#92400e" stroke="#fbbf24" stroke-width="4"/>
    <circle cx="200" cy="180" r="140" fill="#d97706"/>
    <circle cx="420" cy="220" r="120" fill="#78350f" stroke="#fbbf24" stroke-width="3"/>
    <circle cx="420" cy="220" r="105" fill="#b91c1c"/>
    <circle cx="300" cy="380" r="110" fill="#451a03" stroke="#f59e0b" stroke-width="3"/>
    <circle cx="300" cy="380" r="95" fill="#f59e0b"/>
  </g>
</svg>
`)}`;

export default function App() {
  // State management
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All Spices']);
  const [isCatalogLoading, setIsCatalogLoading] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<(number | string)[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserSession[]>([]);
  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Modals & Real Supabase Admin Role
  const [isCustomerLoginOpen, setIsCustomerLoginOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
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

  // Helper to synchronize Supabase user & role with frontend state
  const syncUserFromSession = useCallback(async (user: User | null) => {
    if (!user) {
      setCurrentUser(null);
      setIsAdminAuthenticated(false);
      setUsers([]);
      // Unauthenticated / logged out: restore guest cart from localStorage
      setCart(getStoredCart());
      if (window.location.hash.replace('#', '').toLowerCase() === 'admin') {
        setCurrentPage('home');
        window.location.hash = '';
      }
      return;
    }

    try {
      const profile = await fetchUserProfile(user.id);
      const isAdmin = await checkIsAdmin(user.id);
      const sessionUser = buildUserSession(user, profile, isAdmin ? 'admin' : 'customer');
      setCurrentUser(sessionUser);
      setIsAdminAuthenticated(isAdmin);

      // Authenticated customer: Supabase cart is the source of truth
      try {
        const guestItems = getStoredCart();
        if (guestItems.length > 0) {
          const mergedCart = await mergeGuestCart(user.id, guestItems);
          setCart(mergedCart);
          saveStoredCart([]); // Clear guest localStorage cart after safe merge
        } else {
          const customerCart = await fetchCart(user.id);
          setCart(customerCart);
        }
      } catch (cartErr) {
        console.error('Failed to sync customer cart from Supabase:', cartErr);
      }

      if (isAdmin) {
        const customerProfiles = await fetchAllCustomerProfiles();
        setUsers(customerProfiles);
      } else {
        setUsers([]);
        if (window.location.hash.replace('#', '').toLowerCase() === 'admin') {
          setCurrentPage('home');
          window.location.hash = '';
        }
      }
    } catch (err) {
      console.error('Error synchronizing profile data:', err);
    }
  }, []);

  // Centralized Admin Access Verification against Supabase RBAC
  const requestAdminAccess = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsAdminModalOpen(true);
        if (window.location.hash.replace('#', '').toLowerCase() === 'admin') {
          setCurrentPage('home');
          window.location.hash = '';
        }
        return;
      }

      const isAdmin = await checkIsAdmin(session.user.id);
      if (isAdmin) {
        setIsAdminAuthenticated(true);
        setCurrentPage('admin');
        window.location.hash = 'admin';
        const customerProfiles = await fetchAllCustomerProfiles();
        setUsers(customerProfiles);
      } else {
        setIsAdminAuthenticated(false);
        showToast('Access Denied: Your account does not have administrator authorization.');
        setCurrentPage('home');
        window.location.hash = '';
      }
    } catch (err) {
      console.error('Error verifying admin authorization:', err);
      showToast('Unable to connect to the authentication service.');
    }
  }, []);

  // Helper to detect if the current URL has Supabase Auth redirect parameters in hash or search
  const hasAuthRedirectInUrl = (): boolean => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    return (
      hash.includes('access_token=') ||
      hash.includes('refresh_token=') ||
      hash.includes('type=signup') ||
      hash.includes('type=recovery') ||
      hash.includes('type=email_change') ||
      hash.includes('reset-password') ||
      hash.includes('error=') ||
      hash.includes('error_description=') ||
      search.includes('access_token=') ||
      search.includes('type=signup') ||
      search.includes('type=recovery')
    );
  };

  // Clean auth redirect tokens safely using the History API without losing pathname/search
  const cleanAuthUrl = (): void => {
    try {
      if (hasAuthRedirectInUrl()) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search
        );
      }
    } catch (err) {
      console.error('Error cleaning auth URL hash:', err);
    }
  };

  // Load products and categories from Supabase database
  const loadCatalog = useCallback(async () => {
    setIsCatalogLoading(true);
    setCatalogError(null);
    try {
      const [fetchedProductsResult, fetchedCategoriesResult] = await Promise.allSettled([
        fetchProducts(),
        fetchCategories(),
      ]);

      if (fetchedCategoriesResult.status === 'fulfilled') {
        setCategories(fetchedCategoriesResult.value);
      }

      if (fetchedProductsResult.status === 'fulfilled') {
        setProducts(fetchedProductsResult.value);
      } else {
        console.error('Failed to load products from Supabase:', fetchedProductsResult.reason);
        setCatalogError('Unable to load our spice collection. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to load catalog from Supabase:', err);
      setCatalogError('Unable to load our spice collection. Please try again.');
    } finally {
      setIsCatalogLoading(false);
    }
  }, []);

  // Initialize data and Supabase session on mount
  useEffect(() => {
    // 1. Load non-auth persistent state
    setCart(getStoredCart());
    setWishlist(getStoredWishlist());
    setOrders(getStoredOrders());
    setQueries(getStoredQueries());
    setReviews(getStoredReviews());

    // 2. Load live catalog from Supabase
    loadCatalog();

    const isAuthRedirect = hasAuthRedirectInUrl();

    // Check for error_description in URL hash (e.g. expired confirmation link)
    if (window.location.hash.includes('error_description=')) {
      try {
        const params = new URLSearchParams(window.location.hash.replace('#', '?'));
        const errorDesc = params.get('error_description');
        if (errorDesc) {
          showToast(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
        }
      } catch {
        showToast('Authentication error. Please sign in again.');
      }
      cleanAuthUrl();
    }

    // 3. Initial Supabase session retrieval on app startup
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Error restoring Supabase session:', error.message);
      }
      if (session?.user) {
        const isRecovery = window.location.hash.includes('type=recovery') || window.location.hash.includes('reset-password');
        if (isRecovery) {
          setIsResetPasswordOpen(true);
          setIsCustomerLoginOpen(false);
          cleanAuthUrl();
        } else {
          await syncUserFromSession(session.user);
          if (isAuthRedirect) {
            cleanAuthUrl();
            setIsCustomerLoginOpen(false);
            setCurrentPage('home');
            showToast('Email confirmed successfully! Welcome to KBR Masale.');
          }
        }
      } else if (!isAuthRedirect) {
        // Only set unauthenticated if not in the middle of processing an auth hash
        await syncUserFromSession(null);
      }
    }).catch((err) => {
      console.error('Failed to get initial Supabase session:', err);
    });

    // 4. Register ONE auth state listener handling INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      switch (event) {
        case 'PASSWORD_RECOVERY':
          setIsResetPasswordOpen(true);
          setIsCustomerLoginOpen(false);
          cleanAuthUrl();
          break;

        case 'INITIAL_SESSION':
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            const isRecovery = window.location.hash.includes('type=recovery') || window.location.hash.includes('reset-password');
            if (isRecovery) {
              setIsResetPasswordOpen(true);
              setIsCustomerLoginOpen(false);
              cleanAuthUrl();
            } else {
              await syncUserFromSession(session.user);
              if (hasAuthRedirectInUrl()) {
                cleanAuthUrl();
                setIsCustomerLoginOpen(false);
                setCurrentPage('home');
                showToast('Email confirmed successfully! Welcome to KBR Masale.');
              }
            }
          }
          break;

        case 'SIGNED_OUT':
          await syncUserFromSession(null);
          cleanAuthUrl();
          break;

        default:
          if (session?.user) {
            await syncUserFromSession(session.user);
          } else {
            await syncUserFromSession(null);
          }
          break;
      }
    });

    // 5. Hash route navigation with real role verification
    const checkHashRoute = async () => {
      const rawHash = window.location.hash;
      // Do not treat auth redirect hashes as page routes
      if (hasAuthRedirectInUrl()) {
        return;
      }

      const hash = rawHash.replace('#', '').toLowerCase();
      if (hash === 'admin') {
        await requestAdminAccess();
      } else if (
        ['home', 'products', 'cart', 'checkout', 'orders', 'wishlist', 'services', 'reviews', 'about', 'privacy', 'return'].includes(hash)
      ) {
        setCurrentPage(hash as PageId);
      }
    };

    checkHashRoute();
    window.addEventListener('hashchange', checkHashRoute);

    // 6. Keyboard shortcut for administrator access (Shift + A)
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        await requestAdminAccess();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', checkHashRoute);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [syncUserFromSession, requestAdminAccess, loadCatalog]);

  // Update hash when page changes with real admin protection
  const handleSetPage = async (page: PageId) => {
    if (page === 'admin') {
      await requestAdminAccess();
      return;
    }
    setCurrentPage(page);
    window.location.hash = page === 'home' ? '' : page;
  };

  // Product Add / Update / Delete handlers (React state updates)
  const handleAddProduct = (newProduct: Product) => {
    const updated = [newProduct, ...products];
    setProducts(updated);
    showToast(`"${newProduct.name}" uploaded successfully and is now live!`);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const updated = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    setProducts(updated);
    showToast(`Updated "${updatedProduct.name}" details.`);
  };

  const handleDeleteProduct = (productId: number | string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
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
  };

  // Cart operations
  const handleAddToCart = async (product: Product, selectedWeight: string, price: number) => {
    if (currentUser?.id) {
      try {
        const variant = (product.variants || []).find((v) => v?.weight === selectedWeight);
        let variantId = variant?.id;

        if (!variantId && typeof product.id === 'string') {
          const { data: vData } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', product.id)
            .eq('weight', selectedWeight)
            .maybeSingle();
          if (vData?.id) {
            variantId = vData.id;
          }
        }

        if (!variantId) {
          showToast('Unable to add this item: variant not found.');
          return;
        }

        const updatedCart = await addToCart(currentUser.id, String(product.id), variantId, 1);
        setCart(updatedCart);
        showToast(`Added ${product.name} (${selectedWeight}) to cart`);
      } catch (err: any) {
        console.error('Failed to add to cart:', err);
        showToast(err.message || 'Unable to add this item to your cart. Please try again.');
      }
      return;
    }

    // Guest Cart
    const cartItemId = `${product.id}-${selectedWeight}`;
    const existingIndex = cart.findIndex((item) => item.cartItemId === cartItemId);
    const variant = (product.variants || []).find((v) => v?.weight === selectedWeight);

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
          variantId: variant?.id,
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

  const handleUpdateQty = async (cartItemId: string, delta: number) => {
    const item = cart.find((i) => i.cartItemId === cartItemId);
    if (!item) return;

    const newQty = item.qty + delta;

    if (currentUser?.id) {
      try {
        const updatedCart = await updateCartItemQuantity(currentUser.id, cartItemId, newQty);
        setCart(updatedCart);
      } catch (err: any) {
        console.error('Failed to update cart quantity:', err);
        showToast(err.message || 'Unable to update your cart. Please try again.');
      }
      return;
    }

    // Guest Cart
    let updatedCart = cart.map((i) => {
      if (i.cartItemId === cartItemId) {
        return { ...i, qty: i.qty + delta };
      }
      return i;
    });
    updatedCart = updatedCart.filter((i) => i.qty > 0);
    setCart(updatedCart);
    saveStoredCart(updatedCart);
  };

  const handleRemoveFromCart = async (cartItemId: string) => {
    if (currentUser?.id) {
      try {
        const updatedCart = await removeCartItem(currentUser.id, cartItemId);
        setCart(updatedCart);
        showToast('Item removed from cart.');
      } catch (err: any) {
        console.error('Failed to remove item from cart:', err);
        showToast(err.message || 'Unable to remove this item. Please try again.');
      }
      return;
    }

    // Guest Cart
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
  const handlePlaceOrder = async (newOrder: Order) => {
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    saveStoredOrders(updatedOrders);

    if (currentUser?.id) {
      try {
        await clearCart(currentUser.id);
      } catch (err) {
        console.error('Failed to clear Supabase cart after order:', err);
      }
    }
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
  const handleCustomerLogin = async (user: UserSession) => {
    setCurrentUser(user);
    if (user.id) {
      try {
        const guestItems = getStoredCart();
        if (guestItems.length > 0) {
          const mergedCart = await mergeGuestCart(user.id, guestItems);
          setCart(mergedCart);
          saveStoredCart([]);
        } else {
          const userCart = await fetchCart(user.id);
          setCart(userCart);
        }
      } catch (err) {
        console.error('Failed to load cart on login:', err);
      }
    }
    showToast(`Welcome, ${user.fullName || user.email.split('@')[0]}!`);
  };

  const handleLogoutCustomer = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    setCurrentUser(null);
    setIsAdminAuthenticated(false);
    setUsers([]);
    setCart([]);
    saveStoredCart([]);
    if (currentPage === 'admin' || window.location.hash.replace('#', '').toLowerCase() === 'admin') {
      setCurrentPage('home');
      window.location.hash = '';
    }
    showToast('Signed out successfully.');
  };

  // Admin Login Gateway
  const handleAdminSuccess = async (adminSession: UserSession) => {
    setIsAdminAuthenticated(true);
    setCurrentUser(adminSession);
    setCurrentPage('admin');
    window.location.hash = 'admin';
    const customerProfiles = await fetchAllCustomerProfiles();
    setUsers(customerProfiles);
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
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
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
        onLoginSuccess={handleCustomerLogin}
      />

      {/* Password Reset Modal (Supabase PASSWORD_RECOVERY flow) */}
      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        onSuccess={() => {
          setIsResetPasswordOpen(false);
          setIsCustomerLoginOpen(true);
          showToast('Password updated! Please sign in with your new password.');
        }}
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
                  src={HERO_BANNER_BG}
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
              {isCatalogLoading ? (
                <div className="py-12 text-center bg-white/70 rounded-2xl border border-amber-200/70 p-6">
                  <div className="inline-flex p-3 rounded-full bg-amber-100 text-amber-800 mb-2.5 animate-spin">
                    <Loader2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gray-700">Loading featured masalas...</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Fetching live inventory from Supabase</p>
                </div>
              ) : catalogError ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-red-200 p-6 max-w-md mx-auto">
                  <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-bold text-gray-800">{catalogError}</p>
                  <button
                    onClick={loadCatalog}
                    className="mt-3 px-4 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                </div>
              ) : featuredProducts.length === 0 ? (
                <div className="text-center py-8 bg-white/70 rounded-2xl border border-amber-200/70 p-6">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">No featured spices available at this time.</p>
                </div>
              ) : (
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
              )}
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
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
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

            {/* Grid & States */}
            {isCatalogLoading ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-amber-200 p-8 max-w-md mx-auto">
                <div className="inline-flex p-3 rounded-full bg-amber-100 text-amber-800 mb-3 animate-spin">
                  <Loader2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-royal-950">
                  Loading our spice collection...
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Connecting to live inventory
                </p>
              </div>
            ) : catalogError ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-red-200 p-8 max-w-md mx-auto shadow-xs">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mb-1">
                  {catalogError}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Please check your connection and try again.
                </p>
                <button
                  onClick={loadCatalog}
                  className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold shadow-md transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Loading Spices</span>
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-amber-200 p-8 max-w-md mx-auto">
                <p className="text-sm font-bold text-gray-700">Our spice collection is currently being refreshed.</p>
                <p className="text-xs text-gray-500 mt-1">Please check back in a few moments.</p>
                <button
                  onClick={loadCatalog}
                  className="mt-4 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Again</span>
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-amber-200 p-6 max-w-md mx-auto">
                <p className="text-sm font-bold text-gray-600">No spices found matching your search.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Spices');
                  }}
                  className="mt-3 text-xs text-amber-800 underline font-semibold cursor-pointer"
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
            categories={categories}
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
            onLogout={handleLogoutCustomer}
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
        onAdminTrigger={requestAdminAccess}
      />

    </div>
  );
}
