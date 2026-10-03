import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, ProductVariant } from '../types';
import { fetchProductById, mapSupabaseProductToProduct } from './catalogService';

export interface CreateProductInput {
  name: string;
  category?: string;
  sku?: string;
  description?: string;
  shortDescription?: string;
  image?: string;
  stockQuantity?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  variants: ProductVariant[];
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  sku?: string;
  description?: string;
  shortDescription?: string;
  image?: string;
  stockQuantity?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  variants?: ProductVariant[];
}

/**
 * Standard RFC4122 v4 UUID generator supporting all browser, node, and test environments
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Resolves a category name or ID to a valid category_id UUID from the Supabase categories table.
 * Falls back to an existing category ID if the requested category is not found,
 * preventing foreign-key constraint violations on products.category_id.
 */
export async function resolveCategoryId(categoryNameOrId?: string): Promise<string | null> {
  const trimmed = (categoryNameOrId || '').trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(trimmed)) {
    return trimmed;
  }

  try {
    if (trimmed && trimmed.toLowerCase() !== 'all spices') {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', trimmed)
        .maybeSingle();

      if (!error && data?.id) {
        return data.id;
      }
    }

    // Fallback: If categoryName is empty or not matched,
    // find the first available category to avoid violating foreign-key constraint
    const { data: fallback, error: fallbackError } = await supabase
      .from('categories')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!fallbackError && fallback?.id) {
      return fallback.id;
    }
  } catch (err) {
    console.warn('[ProductService] Warning resolving category_id:', err);
  }

  return null;
}

/**
 * Upload a product image file to Supabase Storage bucket 'product-images'
 * Generates a unique path: products/{productId}/{timestamp}-{safeFileName}
 */
export async function uploadProductImage(
  file: File,
  productId?: string
): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const pId = productId || generateUUID();
  const timestamp = Date.now();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const rawBase = file.name.substring(0, file.name.lastIndexOf('.')) || 'image';
  const cleanBaseName = rawBase.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const safeFileName = `${cleanBaseName}.${ext}`;
  const filePath = `products/${pId}/${timestamp}-${safeFileName}`;

  console.log(`[ProductService] Uploading image to storage bucket "product-images" at "${filePath}"...`);

  // Omit upsert: true to avoid requiring storage UPDATE permission in RLS
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      contentType: file.type || 'image/png',
    });

  if (error) {
    console.error('[ProductService] Storage upload error:', error);
    throw new Error(`Failed to upload product image: ${error.message}`);
  }

  const storagePath = data?.path || filePath;
  console.log(`[ProductService] Successfully uploaded image to "${storagePath}".`);
  return storagePath;
}

/**
 * Create variants for a given product in the product_variants table
 */
export async function createProductVariants(
  productId: string,
  variants: ProductVariant[]
): Promise<void> {
  if (!variants || variants.length === 0) return;

  const rows = variants.map((v) => {
    let weightStr = String(v.weight || '').trim();
    if (!weightStr) weightStr = '100g';
    return {
      product_id: productId,
      weight: weightStr,
      price: Number(v.price) || 0,
      sale_price: v.salePrice !== undefined && v.salePrice !== null ? Number(v.salePrice) : null,
    };
  });

  console.log(`[ProductService] Inserting ${rows.length} variants for product ${productId}...`);
  const { data, error } = await supabase.from('product_variants').insert(rows).select('*');
  if (error) {
    console.error('[ProductService] Error inserting product variants:', error);
    throw new Error(`Failed to save product variants: ${error.message}`);
  }
  console.log(`[ProductService] Successfully inserted ${data?.length || rows.length} variants.`);
}

/**
 * Update existing product variants in the product_variants table safely
 */
export async function updateProductVariants(
  productId: string,
  variants: ProductVariant[]
): Promise<void> {
  if (!variants || variants.length === 0) return;

  console.log(`[ProductService] Updating variants for product ${productId}...`);

  // Retrieve existing variants for this product to match by ID or weight
  const { data: existingVariants, error: fetchErr } = await supabase
    .from('product_variants')
    .select('id, weight, price, sale_price')
    .eq('product_id', productId);

  if (fetchErr) {
    console.warn('[ProductService] Warning fetching existing variants:', fetchErr.message);
  }

  const existingList = existingVariants || [];

  for (const v of variants) {
    const cleanWeight = String(v.weight || '').trim();
    const price = Number(v.price) || 0;
    const salePrice = v.salePrice !== undefined && v.salePrice !== null ? Number(v.salePrice) : null;

    // Match by ID, exact weight, or normalized numeric weight
    let matchedId = v.id;
    if (!matchedId) {
      const match = existingList.find((ex) => {
        const exW = String(ex.weight).trim().toLowerCase();
        const curW = cleanWeight.toLowerCase();
        if (exW === curW) return true;
        const exNum = exW.replace(/[^0-9.]/g, '');
        const curNum = curW.replace(/[^0-9.]/g, '');
        return exNum && curNum && exNum === curNum;
      });
      if (match) matchedId = match.id;
    }

    if (matchedId) {
      const { error: updErr } = await supabase
        .from('product_variants')
        .update({
          weight: cleanWeight,
          price,
          sale_price: salePrice,
        })
        .eq('id', matchedId);

      if (updErr) {
        console.warn(`[ProductService] Warning updating variant ${matchedId}:`, updErr.message);
      }
    } else {
      const { error: insErr } = await supabase
        .from('product_variants')
        .insert({
          product_id: productId,
          weight: cleanWeight,
          price,
          sale_price: salePrice,
        });

      if (insErr) {
        console.warn(`[ProductService] Warning inserting variant:`, insErr.message);
      }
    }
  }
}

/**
 * Create a new product and its variants in Supabase
 */
export async function createProduct(
  input: CreateProductInput,
  file?: File | null
): Promise<Product> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  if (!input.name || !input.name.trim()) {
    throw new Error('Product name is required.');
  }

  console.log(`[ProductService] Creating product "${input.name.trim()}"...`);

  const clientUUID = generateUUID();

  let imagePath: string | null = null;
  if (file) {
    imagePath = await uploadProductImage(file, clientUUID);
  } else if (input.image && !input.image.startsWith('data:image/')) {
    imagePath = input.image.trim();
  }

  const categoryId = await resolveCategoryId(input.category);

  const payload: any = {
    name: input.name.trim(),
    category_id: categoryId,
    sku: input.sku?.trim() || `KBR-${input.name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    description: input.description?.trim() || null,
    short_description: input.shortDescription?.trim() || null,
    image_path: imagePath,
    stock_quantity: Number(input.stockQuantity) ?? 50,
    in_stock: input.inStock !== false,
    is_featured: Boolean(input.isFeatured),
  };

  payload.id = clientUUID;

  let { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select('*')
    .single();

  if (error && (error.message.includes('identity') || error.message.includes('cannot insert into column "id"'))) {
    console.warn('[ProductService] Retrying insert without explicit id...');
    delete payload.id;
    const retry = await supabase
      .from('products')
      .insert(payload)
      .select('*')
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    console.error('[ProductService] Failed to insert product in Supabase:', error);
    throw new Error(`Failed to create product: ${error?.message || 'Database error'}`);
  }

  const createdId = data.id;
  console.log(`[ProductService] Product record created with ID "${createdId}".`);

  if (input.variants && input.variants.length > 0) {
    await createProductVariants(createdId, input.variants);
  }

  let freshProduct = await fetchProductById(createdId);
  if (!freshProduct) {
    console.warn('[ProductService] fetchProductById returned null, assembling product object from database record...');
    freshProduct = mapSupabaseProductToProduct({
      ...data,
      variants: input.variants.map((v, i) => ({
        id: (v as any).id || `v-${i}-${Date.now()}`,
        product_id: createdId,
        weight: v.weight,
        price: v.price,
        sale_price: v.salePrice,
      })),
    });
  }

  console.log(`[ProductService] Successfully created product "${freshProduct.name}" (${freshProduct.id}).`);
  return freshProduct;
}

/**
 * Update an existing product and its variants in Supabase
 */
export async function updateProduct(
  productId: string | number,
  updates: UpdateProductInput,
  file?: File | null
): Promise<Product> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const pIdStr = String(productId);
  console.log(`[ProductService] Updating product ${pIdStr}...`);

  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) {
    payload.name = updates.name.trim();
  }
  if (updates.sku !== undefined) {
    payload.sku = updates.sku.trim();
  }
  if (updates.description !== undefined) {
    payload.description = updates.description.trim() || null;
  }
  if (updates.shortDescription !== undefined) {
    payload.short_description = updates.shortDescription.trim() || null;
  }
  if (updates.stockQuantity !== undefined) {
    payload.stock_quantity = Number(updates.stockQuantity);
  }
  if (updates.inStock !== undefined) {
    payload.in_stock = updates.inStock;
  }
  if (updates.isFeatured !== undefined) {
    payload.is_featured = updates.isFeatured;
  }

  if (file) {
    payload.image_path = await uploadProductImage(file, pIdStr);
  } else if (updates.image !== undefined && !updates.image.startsWith('data:image/')) {
    payload.image_path = updates.image.trim() || null;
  }

  if (updates.category !== undefined) {
    payload.category_id = await resolveCategoryId(updates.category);
  }

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', pIdStr)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('[ProductService] Failed to update product in Supabase:', error);
    throw new Error(`Failed to update product: ${error.message}`);
  }

  if (updates.variants && updates.variants.length > 0) {
    await updateProductVariants(pIdStr, updates.variants);
  }

  let freshProduct = await fetchProductById(pIdStr);
  if (!freshProduct) {
    console.warn('[ProductService] fetchProductById returned null, assembling product object from updated record...');
    freshProduct = mapSupabaseProductToProduct({
      ...(data || payload),
      id: pIdStr,
      variants: updates.variants?.map((v, i) => ({
        id: v.id || `v-${i}-${Date.now()}`,
        product_id: pIdStr,
        weight: v.weight,
        price: v.price,
        sale_price: v.salePrice,
      })),
    });
  }

  console.log(`[ProductService] Successfully updated product ${pIdStr}.`);
  return freshProduct;
}

/**
 * Toggle the in_stock status of a product in Supabase
 */
export async function toggleProductStock(
  productId: string | number,
  currentStockStatus: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const pIdStr = String(productId);
  const nextStatus = !currentStockStatus;
  console.log(`[ProductService] Toggling stock for ${pIdStr} from ${currentStockStatus} to ${nextStatus}...`);

  const { error } = await supabase
    .from('products')
    .update({
      in_stock: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pIdStr);

  if (error) {
    console.error('[ProductService] Error toggling product stock:', error);
    throw new Error(`Failed to update stock status: ${error.message}`);
  }

  console.log(`[ProductService] Successfully toggled stock for ${pIdStr} to ${nextStatus}.`);
  return nextStatus;
}

/**
 * Safely delete a product.
 * If the product is referenced by historical cart_items or order_items,
 * it safely deactivates the product (marks in_stock = false, stock_quantity = 0)
 * rather than destroying historical order integrity.
 */
export async function deleteProduct(
  productId: string | number
): Promise<{ deleted: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const pIdStr = String(productId);
  console.log(`[ProductService] Attempting to delete product ${pIdStr}...`);

  try {
    // 1. Try to delete product_variants first
    const { error: variantError } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', pIdStr);

    if (variantError) {
      console.warn(`[ProductService] Variants linked to foreign key records. Safely deactivating product...`);
      await supabase
        .from('products')
        .update({
          in_stock: false,
          stock_quantity: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pIdStr);

      return {
        deleted: false,
        message: 'Product is linked to customer orders. It has been safely marked out of stock to preserve order history.',
      };
    }

    // 2. Try to delete product from products table
    const { error: prodError } = await supabase
      .from('products')
      .delete()
      .eq('id', pIdStr);

    if (prodError) {
      console.warn(`[ProductService] Product linked to cart/order records (${prodError.message}). Safely deactivating...`);
      await supabase
        .from('products')
        .update({
          in_stock: false,
          stock_quantity: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pIdStr);

      return {
        deleted: false,
        message: 'Product is linked to store records. It has been safely marked out of stock.',
      };
    }

    console.log(`[ProductService] Product ${pIdStr} deleted successfully.`);
    return {
      deleted: true,
      message: 'Product successfully removed from catalog.',
    };
  } catch (err: any) {
    console.error('[ProductService] Error during product deletion:', err);
    try {
      await supabase
        .from('products')
        .update({
          in_stock: false,
          stock_quantity: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pIdStr);
    } catch {}

    return {
      deleted: false,
      message: 'Product was marked out of stock to preserve store integrity.',
    };
  }
}
