export interface ProductVariant {
  id?: string;
  weight: string;
  price: number;
  originalPrice?: number;
  salePrice?: number;
}

export interface Product {
  id: number | string;
  name: string;
  category?: string;
  inStock: boolean;
  image: string;
  additionalImages?: string[];
  variants: ProductVariant[];
  description?: string;
  shortDescription?: string;
  sku?: string;
  stockQuantity?: number;
  isFeatured?: boolean;
  salePrice?: number;
}

export interface CartItem {
  cartItemId: string;
  id: number | string;
  name: string;
  weight: string;
  price: number;
  image: string;
  qty: number;
  variantId?: string;
  originalPrice?: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: CartItem[];
  paymentMethod: 'COD' | 'ONLINE';
  totalAmount: number;
  date: string;
  status: 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';
}

export interface UserProfile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type AppRole = 'customer' | 'admin';

export interface UserSession {
  id?: string;
  phone: string;
  email: string;
  fullName?: string;
  role?: AppRole;
  time?: string;
}

export interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  date?: string;
}

export interface CustomerQuery {
  id: number;
  date: string;
  phone: string;
  query: string;
}

export type PageId =
  | 'home'
  | 'products'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'wishlist'
  | 'services'
  | 'reviews'
  | 'about'
  | 'privacy'
  | 'return'
  | 'admin';
