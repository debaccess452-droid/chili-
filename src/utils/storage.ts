import { CartItem, CustomerQuery, Order, Product, Review, UserSession } from '../types';
import { INITIAL_PRODUCTS, INITIAL_REVIEWS } from '../data/initialData';

const KEYS = {
  PRODUCTS: 'kbr_products_v2',
  CART: 'kbr_cart_v2',
  WISHLIST: 'kbr_wishlist_v2',
  ORDERS: 'kbr_orders_v2',
  USERS: 'kbr_users_v2',
  QUERIES: 'customerQueries', // Same key used in original code
  REVIEWS: 'kbr_reviews_v2',
  CURRENT_USER: 'kbr_current_user_v2',
  ADMIN_AUTH: 'kbr_admin_auth_v2',
};

export const getStoredProducts = (): Product[] => {
  try {
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
  } catch (err) {
    console.error('Error loading products from storage', err);
    return INITIAL_PRODUCTS;
  }
};

export const saveStoredProducts = (products: Product[]): void => {
  try {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.error('Error saving products to storage', err);
  }
};

export const getStoredCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(KEYS.CART);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredCart = (cart: CartItem[]): void => {
  try {
    localStorage.setItem(KEYS.CART, JSON.stringify(cart));
  } catch (err) {
    console.error('Error saving cart', err);
  }
};

export const getStoredWishlist = (): (number | string)[] => {
  try {
    const raw = localStorage.getItem(KEYS.WISHLIST);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredWishlist = (wishlist: (number | string)[]): void => {
  try {
    localStorage.setItem(KEYS.WISHLIST, JSON.stringify(wishlist));
  } catch (err) {
    console.error('Error saving wishlist', err);
  }
};

export const getStoredOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(KEYS.ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredOrders = (orders: Order[]): void => {
  try {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  } catch (err) {
    console.error('Error saving orders', err);
  }
};

export const getStoredUsers = (): UserSession[] => {
  try {
    const raw = localStorage.getItem(KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredUsers = (users: UserSession[]): void => {
  try {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users', err);
  }
};

export const getStoredQueries = (): CustomerQuery[] => {
  try {
    const raw = localStorage.getItem(KEYS.QUERIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredQueries = (queries: CustomerQuery[]): void => {
  try {
    localStorage.setItem(KEYS.QUERIES, JSON.stringify(queries));
  } catch (err) {
    console.error('Error saving queries', err);
  }
};

export const getStoredReviews = (): Review[] => {
  try {
    const raw = localStorage.getItem(KEYS.REVIEWS);
    if (!raw) {
      localStorage.setItem(KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
      return INITIAL_REVIEWS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REVIEWS;
  }
};

export const saveStoredReviews = (reviews: Review[]): void => {
  try {
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));
  } catch (err) {
    console.error('Error saving reviews', err);
  }
};

export const getStoredCurrentUser = (): UserSession | null => {
  try {
    const raw = localStorage.getItem(KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveStoredCurrentUser = (user: UserSession | null): void => {
  try {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  } catch (err) {
    console.error('Error saving current user', err);
  }
};

export const getAdminAuthSession = (): boolean => {
  try {
    return localStorage.getItem(KEYS.ADMIN_AUTH) === 'true';
  } catch {
    return false;
  }
};

export const setAdminAuthSession = (isAuthenticated: boolean): void => {
  try {
    if (isAuthenticated) {
      localStorage.setItem(KEYS.ADMIN_AUTH, 'true');
    } else {
      localStorage.removeItem(KEYS.ADMIN_AUTH);
    }
  } catch (err) {
    console.error('Error setting admin session', err);
  }
};
