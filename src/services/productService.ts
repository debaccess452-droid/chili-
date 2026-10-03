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
 * Resolves a category name or ID to a valid category_id UUID from the Supabase categories table.
 * Falls back to an existing category ID if the requested category is not found,
 * preventing foreign-key constraint violations on products.category_id.
 */
export async function resolveCategoryId(categoryNameOrId?: string): Promise<string> {
  assertConfigured();
  const name = (categoryNameOrId || '').trim();
  if (!name || name.toLowerCase() === 'all spices') throw new Error('A valid product category is required.');

  const { data, error } = await supabase.from('categories').select('id, name, slug').eq('active', true);
  if (error) throw new Error(`Failed to resolve product category: ${error.message}`);

  const normalized = name.toLocaleLowerCase();
  const match = (data || []).find((category) =>
    String(category.name || '').trim().toLocaleLowerCase() === normalized ||
    String(category.slug || '').trim().toLocaleLowerCase() === normalized
  );
  if (!match?.id) throw new Error(`Category "${name}" was not found in the categories table.`);
  return match.id;
}

/**
 * Upload a product image file to Supabase Storage bucket 'product-images'
 * Generates a unique path: products/{productId}/{timestamp}-{safeFileName}
 */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  if (!file.type.startsWith('image/')) throw new Error('Please select a valid image file.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image file size must be less than 5MB.');

  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const base = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'image';
  const safeFileName = `${base}.${ext}`;
  const filePath = `products/${productId}/${Date.now()}-${safeFileName}`;

  const { data, error } = await supabase.storage.from('product-images').upload(filePath, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Failed to upload product image: ${error.message}`);
  return data?.path || filePath;
}

export async function deleteProductImage(imagePath: string | null | undefined, productId: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const path = (imagePath || '').trim();
  if (!path || !path.startsWith(`products/${productId}/`)) return;
  const { error } = await supabase.storage.from('product-images').remove([path]);
  if (error) throw new Error(`Failed to delete product image: ${error.message}`);
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
export async function createProduct(input: CreateProductInput, file?: File | null): Promise<Product> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  if (!input.name?.trim()) throw new Error('Product name is required.');
  if (input.image?.trim().startsWith('data:image/')) throw new Error('Data URI images cannot be persisted. Upload the image file instead.');

  const categoryId = await resolveCategoryId(input.category);
  const payload: any = {
    name: input.name.trim(),
    category_id: categoryId,
    sku: input.sku?.trim() || null,
    description: input.description?.trim() || null,
    short_description: input.shortDescription?.trim() || null,
    image_path: null,
    stock_quantity: Number(input.stockQuantity ?? 0),
    in_stock: input.inStock !== false,
    is_featured: Boolean(input.isFeatured),
  };

  const { data: created, error } = await supabase.from('products').insert(payload).select('*').single();
  if (error || !created) throw new Error(`Failed to create product: ${error?.message || 'Database error'}`);

  const productId = String(created.id);
  let imagePath: string | null = null;
  try {
    if (file) {
      imagePath = await uploadProductImage(file, productId);
      const { error: imageError } = await supabase.from('products').update({ image_path: imagePath }).eq('id', productId);
      if (imageError) throw new Error(`Failed to save product image path: ${imageError.message}`);
    } else if (input.image?.trim()) {
      imagePath = input.image.trim();
      const { error: imageError } = await supabase.from('products').update({ image_path: imagePath }).eq('id', productId);
      if (imageError) throw new Error(`Failed to save product image path: ${imageError.message}`);
    }

    if (input.variants?.length) await createProductVariants(productId, input.variants);
  } catch (err) {
    if (imagePath && imagePath.startsWith(`products/${productId}/`)) {
      try { await deleteProductImage(imagePath, productId); } catch (cleanupError) { console.error(cleanupError); }
    }
    try { await supabase.from('products').delete().eq('id', productId); } catch (cleanupError) { console.error(cleanupError); }
    throw err;
  }

  const persisted = await fetchProductById(productId);
  if (!persisted) throw new Error('Product was created but could not be reloaded from Supabase.');
  return persisted;
}

/**
 * Update an existing product and its variants in Supabase
 */
export async function updateProduct(productId: string | number, updates: UpdateProductInput, file?: File | null): Promise<Product> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const id = String(productId).trim();
  if (!id) throw new Error('Product ID is required.');
  if (updates.image?.trim().startsWith('data:image/')) throw new Error('Data URI images cannot be persisted. Upload the image file instead.');

  const categoryId = updates.category !== undefined ? await resolveCategoryId(updates.category) : undefined;
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (categoryId !== undefined) payload.category_id = categoryId;
  if (updates.sku !== undefined) payload.sku = updates.sku.trim() || null;
  if (updates.description !== undefined) payload.description = updates.description.trim() || null;
  if (updates.shortDescription !== undefined) payload.short_description = updates.shortDescription.trim() || null;
  if (updates.stockQuantity !== undefined) payload.stock_quantity = Number(updates.stockQuantity);
  if (updates.inStock !== undefined) payload.in_stock = updates.inStock;
  if (updates.isFeatured !== undefined) payload.is_featured = updates.isFeatured;

  const { data: current, error: currentError } = await supabase.from('products').select('id, image_path').eq('id', id).maybeSingle();
  if (currentError) throw new Error(`Failed to load product before update: ${currentError.message}`);
  if (!current) throw new Error(`Product ${id} was not found.`);

  let newImagePath: string | null = null;
  if (file) {
    newImagePath = await uploadProductImage(file, id);
    payload.image_path = newImagePath;
  } else if (updates.image !== undefined) {
    payload.image_path = updates.image.trim() || null;
  }

  try {
    if (Object.keys(payload).length) {
      const { error } = await supabase.from('products').update(payload).eq('id', id);
      if (error) throw new Error(`Failed to update product: ${error.message}`);
    }
    if (updates.variants !== undefined) {
      for (const variant of updates.variants) {
        const values = {
          weight: String(variant.weight || '').trim(),
          price: Number(variant.price),
          sale_price: variant.salePrice == null ? null : Number(variant.salePrice),
        };
        if (!values.weight || !Number.isFinite(values.price) || values.price < 0) {
          throw new Error('Invalid product variant data.');
        }
        if (variant.id) {
          const { data, error } = await supabase.from('product_variants')
            .update(values).eq('id', variant.id).eq('product_id', id).select('*').maybeSingle();
          if (error) throw new Error(`Failed to update variant ${variant.id}: ${error.message}`);
          if (!data) throw new Error(`Variant ${variant.id} was not found for product ${id}.`);
        } else {
          const { error } = await supabase.from('product_variants').insert({ product_id: id, ...values });
          if (error) throw new Error(`Failed to create product variant: ${error.message}`);
        }
      }
    }
  } catch (err) {
    if (newImagePath) {
      try { await deleteProductImage(newImagePath, id); } catch (cleanupError) { console.error(cleanupError); }
    }
    throw err;
  }

  if (newImagePath && current.image_path && current.image_path !== newImagePath && String(current.image_path).startsWith(`products/${id}/`)) {
    try { await deleteProductImage(current.image_path, id); } catch (cleanupError) { console.warn(cleanupError); }
  }

  const persisted = await fetchProductById(id);
  if (!persisted) throw new Error(`Product ${id} was updated but could not be reloaded from Supabase.`);
  return persisted;
}

/**
 * Toggle the in_stock status of a product in Supabase
 */
export async function toggleProductStock(productId: string | number, inStock: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const id = String(productId).trim();
  const { data, error } = await supabase.from('products').update({ in_stock: Boolean(inStock) }).eq('id', id).select('in_stock').maybeSingle();
  if (error) throw new Error(`Failed to update stock status: ${error.message}`);
  if (!data) throw new Error(`Product ${id} was not found or the update was not authorized.`);
  return Boolean(data.in_stock);
}

/**
 * Safely delete a product.
 * If the product is referenced by historical cart_items or order_items,
 * it safely deactivates the product (marks in_stock = false, stock_quantity = 0)
 * rather than destroying historical order integrity.
 */
export async function deleteProduct(productId: string | number): Promise<{ deleted: boolean; storageImageDeleted: boolean; message: string }> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const id = String(productId).trim();
  const { data: current, error: currentError } = await supabase.from('products').select('id, image_path').eq('id', id).maybeSingle();
  if (currentError) throw new Error(`Failed to load product before deletion: ${currentError.message}`);
  if (!current) throw new Error(`Product ${id} was not found.`);

  const { error: deleteError } = await supabase.from('products').delete().eq('id', id);
  if (deleteError) throw new Error(`Product could not be deleted: ${deleteError.message}`);

  let storageImageDeleted = true;
  let message = 'Product successfully removed from catalog.';
  if (current.image_path && String(current.image_path).startsWith(`products/${id}/`)) {
    try { await deleteProductImage(current.image_path, id); }
    catch (error: any) {
      storageImageDeleted = false;
      message = `Product was deleted, but its storage image could not be removed: ${error.message}`;
    }
  }
  return { deleted: true, storageImageDeleted, message };
}