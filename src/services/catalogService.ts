import { supabase, SUPABASE_URL } from '../lib/supabase';
import { Product, ProductVariant } from '../types';

export interface SupabaseCategory {
  id: string;
  name: string;
  slug?: string;
  sort_order?: number;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseVariant {
  id: string;
  product_id: string;
  weight: string;
  price: number;
  sale_price?: number | null;
  created_at?: string;
}

export interface SupabaseProduct {
  id: string;
  name: string;
  category_id?: string;
  sku?: string;
  description?: string | null;
  short_description?: string | null;
  image_path?: string | null;
  stock_quantity?: number | null;
  in_stock?: boolean | null;
  is_featured?: boolean | null;
  created_at?: string;
  updated_at?: string;
  category?: SupabaseCategory | null;
  variants?: SupabaseVariant[] | null;
}

/**
 * Clean SVG placeholder when image_path is null or missing.
 * Zero external network dependencies, no fake or invented images.
 */
export const SVG_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300" fill="none">
  <rect width="400" height="300" fill="#fef3c7"/>
  <rect x="20" y="20" width="360" height="260" rx="16" fill="#fffbeb" stroke="#fde68a" stroke-width="2"/>
  <g transform="translate(160, 75)">
    <circle cx="40" cy="40" r="34" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
    <path d="M28 48 C28 32, 40 24, 52 24 C52 40, 40 48, 28 48 Z" fill="#b45309"/>
    <path d="M40 24 C40 38, 48 44, 56 46" stroke="#92400e" stroke-width="2" stroke-linecap="round"/>
    <circle cx="34" cy="52" r="2.5" fill="#d97706"/>
    <circle cx="46" cy="52" r="2.5" fill="#d97706"/>
    <circle cx="40" cy="58" r="2" fill="#d97706"/>
  </g>
  <text x="200" y="185" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#78350f" letter-spacing="1">KBR GLOBAL VENTURES</text>
  <text x="200" y="208" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#b45309">No Image Available</text>
</svg>
`)}`;

/**
 * Resolves product image:
 * - If image_path exists: returns the real Supabase Storage image URL (or fully qualified URL).
 * - If image_path is null / empty: returns the clean SVG placeholder.
 * - Never invents or maps fake images.
 */
export function resolveProductImage(imagePath?: string | null): string {
  if (!imagePath || !imagePath.trim()) {
    return SVG_PLACEHOLDER_IMAGE;
  }

  const clean = imagePath.trim();

  // If already a complete URL or data URI, return as-is
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image/')) {
    return clean;
  }

  const cleanBase = SUPABASE_URL.replace(/\/+$/, '');

  // If path contains public storage prefix
  if (clean.includes('/storage/v1/object/public/')) {
    return `${cleanBase}${clean.startsWith('/') ? '' : '/'}${clean}`;
  }

  // Prepend Supabase Storage public bucket URL
  const bucketName = 'products';
  if (clean.startsWith(`${bucketName}/`)) {
    return `${cleanBase}/storage/v1/object/public/${clean}`;
  }

  return `${cleanBase}/storage/v1/object/public/${bucketName}/${clean.replace(/^\/+/, '')}`;
}

function parseWeightInGrams(weightStr: string): number {
  if (!weightStr) return 0;
  const lower = weightStr.toLowerCase().trim();
  if (lower.endsWith('kg')) {
    return (parseFloat(lower) || 0) * 1000;
  }
  return parseFloat(lower) || 0;
}

/**
 * Maps Supabase raw database product and variants to frontend Product type
 */
export function mapSupabaseProductToProduct(dbProduct: SupabaseProduct): Product {
  const rawVariants = dbProduct.variants || [];
  const sortedVariants = [...rawVariants].sort(
    (a, b) => parseWeightInGrams(a.weight) - parseWeightInGrams(b.weight)
  );

  const mappedVariants: ProductVariant[] = sortedVariants.map((v) => {
    const normalPrice = Number(v.price) || 0;
    const salePrice =
      v.sale_price !== null && v.sale_price !== undefined ? Number(v.sale_price) : undefined;
    const hasSale = salePrice !== undefined && salePrice > 0 && salePrice < normalPrice;
    return {
      id: v.id,
      weight: v.weight,
      price: hasSale ? salePrice : normalPrice,
      originalPrice: hasSale ? normalPrice : undefined,
      salePrice: hasSale ? salePrice : undefined,
    };
  });

  const inStock = Boolean(
    dbProduct.in_stock !== false &&
      (dbProduct.stock_quantity === undefined ||
        dbProduct.stock_quantity === null ||
        dbProduct.stock_quantity > 0)
  );

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    category: dbProduct.category?.name || 'Spices',
    inStock,
    image: resolveProductImage(dbProduct.image_path),
    variants: mappedVariants,
    description: dbProduct.description || undefined,
    shortDescription: dbProduct.short_description || undefined,
    sku: dbProduct.sku || undefined,
    stockQuantity: dbProduct.stock_quantity ?? 0,
    isFeatured: Boolean(dbProduct.is_featured),
    salePrice: mappedVariants[0]?.salePrice,
  };
}

/**
 * Fetch all active categories from Supabase, sorted by sort_order
 */
export async function fetchCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('name, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories from Supabase:', error.message);
      return ['All Spices'];
    }

    const categoryNames = (data || []).map((c) => c.name);
    return ['All Spices', ...categoryNames.filter((name) => name !== 'All Spices')];
  } catch (err) {
    console.error('Unexpected error fetching categories:', err);
    return ['All Spices'];
  }
}

/**
 * Fetch all products with their categories and variants from Supabase
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products from Supabase:', error.message);
      throw new Error('Unable to load spice collection from Supabase.');
    }

    if (!data) {
      return [];
    }

    return (data as SupabaseProduct[]).map(mapSupabaseProductToProduct);
  } catch (err: any) {
    console.error('Error loading products from Supabase:', err);
    throw new Error(err.message || 'Unable to load spice collection from Supabase.');
  }
}

/**
 * Fetch a single product by ID with its category and variants from Supabase
 */
export async function fetchProductById(id: string | number): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapSupabaseProductToProduct(data as SupabaseProduct);
  } catch (err) {
    console.error('Error fetching product by id from Supabase:', err);
    return null;
  }
}
