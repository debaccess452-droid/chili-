import { supabase } from '../lib/supabase';
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

const DEFAULT_SPICE_IMAGE =
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80';

const SPICE_IMAGE_MAP: Record<string, string> = {
  haldi: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
  turmeric: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
  'lal mirch': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  chilli: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  chili: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  dhania: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=600&q=80',
  coriander: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=600&q=80',
  garam: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
  sabzi: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
  meat: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  chicken: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
  kitchen: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  pav: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80',
  bhaji: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80',
  chaat: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  sambhar: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
};

export function resolveProductImage(imagePath?: string | null, productName?: string): string {
  if (imagePath && imagePath.trim().length > 0) {
    return imagePath.trim();
  }
  if (productName) {
    const lowerName = productName.toLowerCase();
    for (const [key, url] of Object.entries(SPICE_IMAGE_MAP)) {
      if (lowerName.includes(key)) {
        return url;
      }
    }
  }
  return DEFAULT_SPICE_IMAGE;
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

  const mappedVariants: ProductVariant[] =
    sortedVariants.length > 0
      ? sortedVariants.map((v) => {
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
        })
      : [{ weight: '100g', price: 50 }];

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
    image: resolveProductImage(dbProduct.image_path, dbProduct.name),
    variants: mappedVariants,
    description: dbProduct.description || undefined,
    shortDescription: dbProduct.short_description || undefined,
    sku: dbProduct.sku || undefined,
    stockQuantity: dbProduct.stock_quantity ?? 100,
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
      return ['All Spices', 'Masala', 'Spices'];
    }

    const categoryNames = (data || []).map((c) => c.name);
    return ['All Spices', ...categoryNames.filter((name) => name !== 'All Spices')];
  } catch (err) {
    console.error('Unexpected error fetching categories:', err);
    return ['All Spices', 'Masala', 'Spices'];
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
      throw new Error('Unable to load our spice collection. Please try again.');
    }

    if (!data) {
      return [];
    }

    return (data as SupabaseProduct[]).map(mapSupabaseProductToProduct);
  } catch (err: any) {
    console.error('Error loading products from Supabase:', err);
    throw new Error(err.message || 'Unable to load our spice collection. Please try again.');
  }
}

/**
 * Fetch a single product by ID with its category and variants
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
