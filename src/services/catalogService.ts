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
  weight: string | number;
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
  category?: SupabaseCategory | SupabaseCategory[] | null;
  categories?: SupabaseCategory | SupabaseCategory[] | null;
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
 * Resolves product image safely:
 * - If imagePath exists: returns the real Supabase Storage image URL (or fully qualified URL).
 * - If imagePath is null / empty / non-string: returns the clean SVG placeholder.
 * - Handles string paths, storage object returns, or data URIs without throwing.
 */
export function resolveProductImage(imagePath?: any): string {
  if (!imagePath) {
    return SVG_PLACEHOLDER_IMAGE;
  }

  let clean = '';
  if (typeof imagePath === 'string') {
    clean = imagePath.trim();
  } else if (typeof imagePath === 'object') {
    clean = (imagePath.publicUrl || imagePath.url || imagePath.path || '').trim();
  }

  if (!clean) {
    return SVG_PLACEHOLDER_IMAGE;
  }

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
  const bucketName = 'product-images';
  if (clean.startsWith(`${bucketName}/`)) {
    return `${cleanBase}/storage/v1/object/public/${clean}`;
  }

  return `${cleanBase}/storage/v1/object/public/${bucketName}/${clean.replace(/^\/+/, '')}`;
}

/**
 * Safely parse weight into grams without throwing if weight is numeric or undefined
 */
export function parseWeightInGrams(weightVal: any): number {
  if (weightVal === null || weightVal === undefined) return 0;
  if (typeof weightVal === 'number') return weightVal;
  
  const weightStr = String(weightVal).toLowerCase().trim();
  if (!weightStr) return 0;

  if (weightStr.endsWith('kg')) {
    return (parseFloat(weightStr) || 0) * 1000;
  }
  return parseFloat(weightStr) || 0;
}

/**
 * Maps Supabase raw database product and variants to frontend Product type.
 * Robust against nulls, array vs object PostgREST relationships, and numeric weights.
 */
export function mapSupabaseProductToProduct(dbProduct: SupabaseProduct): Product {
  // PostgREST relation handling: variants can be in 'variants' or 'product_variants'
  const variantsField = dbProduct.variants || (dbProduct as any).product_variants;
  const rawVariants: any[] = Array.isArray(variantsField)
    ? variantsField
    : variantsField && typeof variantsField === 'object'
    ? [variantsField]
    : [];

  const sortedVariants = [...rawVariants].sort(
    (a, b) => parseWeightInGrams(a?.weight) - parseWeightInGrams(b?.weight)
  );

  const mappedVariants: ProductVariant[] = sortedVariants.map((v) => {
    const normalPrice = Number(v?.price) || 0;
    const salePrice =
      v?.sale_price !== null && v?.sale_price !== undefined ? Number(v.sale_price) : undefined;
    const hasSale = salePrice !== undefined && salePrice > 0 && salePrice < normalPrice;

    // Normalize weight: if raw number e.g. 100, format as '100g'
    let weightStr = '';
    if (v?.weight !== null && v?.weight !== undefined) {
      const rawW = String(v.weight).trim();
      weightStr = /^\d+$/.test(rawW) ? `${rawW}g` : rawW;
    }

    return {
      id: v?.id,
      weight: weightStr,
      price: hasSale ? salePrice : normalPrice,
      originalPrice: hasSale ? normalPrice : undefined,
      salePrice: hasSale ? salePrice : undefined,
    };
  });

  const finalVariants: ProductVariant[] =
    mappedVariants.length > 0 ? mappedVariants : [{ weight: '100g', price: 50 }];

  const inStock = Boolean(
    dbProduct.in_stock !== false &&
      (dbProduct.stock_quantity === undefined ||
        dbProduct.stock_quantity === null ||
        dbProduct.stock_quantity > 0)
  );

  // PostgREST relation handling: category can be an object or an array or undefined
  let resolvedCategoryName = 'Spices';
  const catRelation = dbProduct.category || dbProduct.categories;
  if (Array.isArray(catRelation) && catRelation.length > 0 && catRelation[0]?.name) {
    resolvedCategoryName = catRelation[0].name;
  } else if (catRelation && typeof catRelation === 'object' && !Array.isArray(catRelation) && (catRelation as any).name) {
    resolvedCategoryName = (catRelation as any).name;
  }

  return {
    id: dbProduct.id,
    name: dbProduct.name || 'Authentic Indian Spice',
    category: resolvedCategoryName,
    inStock,
    image: resolveProductImage(dbProduct.image_path),
    variants: finalVariants,
    description: dbProduct.description || undefined,
    shortDescription: dbProduct.short_description || undefined,
    sku: dbProduct.sku || undefined,
    stockQuantity: dbProduct.stock_quantity ?? 0,
    isFeatured: Boolean(dbProduct.is_featured),
    salePrice: finalVariants[0]?.salePrice,
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
      console.error('[CatalogService] Error fetching categories from Supabase:', error.message);
      return ['All Spices'];
    }

    const categoryNames = (data || [])
      .map((c) => c?.name)
      .filter((name): name is string => Boolean(name && typeof name === 'string'));

    return ['All Spices', ...categoryNames.filter((name) => name !== 'All Spices')];
  } catch (err) {
    console.error('[CatalogService] Unexpected error fetching categories:', err);
    return ['All Spices'];
  }
}

/**
 * Fetch all products with their categories and variants from Supabase
 */
export async function fetchProducts(): Promise<Product[]> {
  console.log('[CatalogService] Fetching all products from Supabase...');
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(*),
        product_variants(*)
      `)
      .order('created_at', { ascending: false });

    if (!error && data && Array.isArray(data)) {
      console.log(`[CatalogService] Loaded ${data.length} products with joined relations.`);
      return data.map((item) => mapSupabaseProductToProduct(item as SupabaseProduct));
    }

    // Fallback: query with aliases
    const { data: aliasData, error: aliasErr } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*)
      `)
      .order('created_at', { ascending: false });

    if (!aliasErr && aliasData && Array.isArray(aliasData)) {
      console.log(`[CatalogService] Loaded ${aliasData.length} products with aliased relations.`);
      return aliasData.map((item) => mapSupabaseProductToProduct(item as SupabaseProduct));
    }

    // Fallback: sequential query if joins fail
    console.warn('[CatalogService] Join queries returned error, falling back to sequential fetch...');
    const { data: prods, error: pErr } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (pErr || !prods) {
      console.error('[CatalogService] Failed to load products:', pErr?.message);
      return [];
    }

    const { data: allVariants } = await supabase
      .from('product_variants')
      .select('*');

    const variantMap = new Map<string, any[]>();
    (allVariants || []).forEach((v) => {
      const pid = String(v.product_id);
      if (!variantMap.has(pid)) variantMap.set(pid, []);
      variantMap.get(pid)!.push(v);
    });

    return prods.map((p) =>
      mapSupabaseProductToProduct({
        ...p,
        variants: variantMap.get(String(p.id)) || [],
      })
    );
  } catch (err: any) {
    console.error('[CatalogService] Error loading products from Supabase:', err);
    return [];
  }
}

/**
 * Fetch a single product by ID with its category and variants from Supabase
 */
export async function fetchProductById(id: string | number): Promise<Product | null> {
  const pIdStr = String(id);
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(*),
        product_variants(*)
      `)
      .eq('id', pIdStr)
      .maybeSingle();

    if (!error && data) {
      return mapSupabaseProductToProduct(data as SupabaseProduct);
    }

    const { data: aliasData, error: aliasError } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*)
      `)
      .eq('id', pIdStr)
      .maybeSingle();

    if (!aliasError && aliasData) {
      return mapSupabaseProductToProduct(aliasData as SupabaseProduct);
    }

    // Fallback: fetch product and variants separately
    const { data: simpleData, error: simpleError } = await supabase
      .from('products')
      .select('*')
      .eq('id', pIdStr)
      .maybeSingle();

    if (simpleError || !simpleData) {
      return null;
    }

    const { data: variantData } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', pIdStr);

    return mapSupabaseProductToProduct({
      ...simpleData,
      variants: variantData || [],
    });
  } catch (err) {
    console.error(`[CatalogService] Error fetching product by id (${pIdStr}) from Supabase:`, err);
    return null;
  }
}
