import { supabase } from '../lib/supabase';
import { CartItem } from '../types';
import { resolveProductImage } from './catalogService';

interface SupabaseCartRecord {
  id: string;
  user_id: string;
}

interface SupabaseCartItemJoin {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
  product?: {
    id: string;
    name: string;
    image_path?: string | null;
    in_stock?: boolean | null;
    stock_quantity?: number | null;
  } | null;
  variant?: {
    id: string;
    weight: string;
    price: number;
    sale_price?: number | null;
  } | null;
}

/**
 * Retrieve the customer's cart or create a new row if one does not exist.
 * Safely handles unique(user_id) constraint concurrency.
 */
export async function getOrCreateCart(userId: string): Promise<string> {
  if (!userId) {
    throw new Error('Authentication required to access cart.');
  }

  // 1. Check existing cart
  const { data: existingCart, error: fetchError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching customer cart:', fetchError.message);
  }

  if (existingCart?.id) {
    return existingCart.id;
  }

  // 2. Create new cart
  const { data: newCart, error: insertError } = await supabase
    .from('carts')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (insertError) {
    // In case of conflict (e.g., duplicate request), re-fetch existing
    const { data: retryCart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (retryCart?.id) {
      return retryCart.id;
    }

    console.error('Error creating customer cart:', insertError.message);
    throw new Error('Unable to initialize your cart. Please try again.');
  }

  return newCart.id;
}

/**
 * Fetch all items in the customer's Supabase cart with joined product & variant data
 */
export async function fetchCart(userId: string): Promise<CartItem[]> {
  try {
    const cartId = await getOrCreateCart(userId);

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        cart_id,
        product_id,
        variant_id,
        quantity,
        created_at,
        updated_at,
        product:products (
          id,
          name,
          image_path,
          in_stock,
          stock_quantity
        ),
        variant:product_variants (
          id,
          weight,
          price,
          sale_price
        )
      `)
      .eq('cart_id', cartId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching cart items:', error.message);
      throw new Error('Unable to load your cart. Please try again.');
    }

    if (!data) return [];

    return (data as unknown as SupabaseCartItemJoin[]).map((item) => {
      const normalPrice = Number(item.variant?.price) || 0;
      const salePrice =
        item.variant?.sale_price !== null && item.variant?.sale_price !== undefined
          ? Number(item.variant.sale_price)
          : undefined;
      const hasSale = salePrice !== undefined && salePrice > 0 && salePrice < normalPrice;
      const activePrice = hasSale ? salePrice : normalPrice;
      const originalPrice = hasSale ? normalPrice : undefined;

      return {
        cartItemId: item.id,
        id: item.product_id,
        variantId: item.variant_id,
        name: item.product?.name || 'Spice Product',
        weight: item.variant?.weight || '100g',
        price: activePrice,
        originalPrice,
        image: resolveProductImage(item.product?.image_path, item.product?.name),
        qty: Math.max(1, item.quantity || 1),
      };
    });
  } catch (err: any) {
    console.error('Error loading customer cart from Supabase:', err);
    throw new Error(err.message || 'Unable to load your cart. Please try again.');
  }
}

/**
 * Add a product variant to the customer's Supabase cart.
 * If already in cart, increases quantity. Validates product stock first.
 */
export async function addToCart(
  userId: string,
  productId: string,
  variantId: string,
  quantity = 1
): Promise<CartItem[]> {
  try {
    const safeQty = Math.max(1, Math.floor(quantity));

    // 1. Verify stock from Supabase
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('id, name, in_stock, stock_quantity')
      .eq('id', productId)
      .single();

    if (prodErr || !product) {
      throw new Error('Unable to add this item to your cart. Product not found.');
    }

    if (
      product.in_stock === false ||
      (product.stock_quantity !== null && product.stock_quantity <= 0)
    ) {
      throw new Error(`"${product.name}" is currently out of stock.`);
    }

    // 2. Get customer cart
    const cartId = await getOrCreateCart(userId);

    // 3. Check if this exact variant is already in cart
    const { data: existingItem, error: existErr } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('variant_id', variantId)
      .maybeSingle();

    if (existErr) {
      console.error('Error checking existing cart item:', existErr.message);
    }

    if (existingItem) {
      // Increment quantity
      const newQty = existingItem.quantity + safeQty;
      const { error: updateErr } = await supabase
        .from('cart_items')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', existingItem.id);

      if (updateErr) {
        console.error('Error updating cart item quantity:', updateErr.message);
        throw new Error('Unable to update your cart. Please try again.');
      }
    } else {
      // Insert new row
      const { error: insertErr } = await supabase.from('cart_items').insert({
        cart_id: cartId,
        product_id: productId,
        variant_id: variantId,
        quantity: safeQty,
      });

      if (insertErr) {
        console.error('Error adding item to cart:', insertErr.message);
        throw new Error('Unable to add this item to your cart. Please try again.');
      }
    }

    return await fetchCart(userId);
  } catch (err: any) {
    console.error('Error in addToCart:', err);
    throw new Error(err.message || 'Unable to add this item to your cart. Please try again.');
  }
}

/**
 * Update the quantity of a specific cart item.
 * If quantity reaches 0, removes the item.
 */
export async function updateCartItemQuantity(
  userId: string,
  cartItemId: string,
  quantity: number
): Promise<CartItem[]> {
  try {
    if (quantity <= 0) {
      return await removeCartItem(userId, cartItemId);
    }

    const safeQty = Math.max(1, Math.floor(quantity));
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: safeQty, updated_at: new Date().toISOString() })
      .eq('id', cartItemId);

    if (error) {
      console.error('Error updating cart item quantity:', error.message);
      throw new Error('Unable to update your cart. Please try again.');
    }

    return await fetchCart(userId);
  } catch (err: any) {
    console.error('Error in updateCartItemQuantity:', err);
    throw new Error(err.message || 'Unable to update your cart. Please try again.');
  }
}

/**
 * Remove an item from the customer's Supabase cart.
 */
export async function removeCartItem(userId: string, cartItemId: string): Promise<CartItem[]> {
  try {
    const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);

    if (error) {
      console.error('Error removing item from cart:', error.message);
      throw new Error('Unable to remove this item. Please try again.');
    }

    return await fetchCart(userId);
  } catch (err: any) {
    console.error('Error in removeCartItem:', err);
    throw new Error(err.message || 'Unable to remove this item. Please try again.');
  }
}

/**
 * Clear all items from the customer's Supabase cart without deleting the cart itself.
 */
export async function clearCart(userId: string): Promise<void> {
  try {
    const cartId = await getOrCreateCart(userId);
    const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId);

    if (error) {
      console.error('Error clearing cart:', error.message);
      throw new Error('Unable to clear your cart. Please try again.');
    }
  } catch (err: any) {
    console.error('Error in clearCart:', err);
    throw new Error(err.message || 'Unable to clear your cart. Please try again.');
  }
}

/**
 * Safely merge guest items into the customer's Supabase cart upon login
 */
export async function mergeGuestCart(userId: string, guestItems: CartItem[]): Promise<CartItem[]> {
  if (!guestItems || guestItems.length === 0) {
    return await fetchCart(userId);
  }

  for (const item of guestItems) {
    try {
      let variantId = item.variantId;
      // If variantId is not present, resolve it from product_variants
      if (!variantId && typeof item.id === 'string') {
        const { data: vData } = await supabase
          .from('product_variants')
          .select('id')
          .eq('product_id', item.id)
          .eq('weight', item.weight)
          .maybeSingle();

        if (vData?.id) {
          variantId = vData.id;
        }
      }

      if (variantId && typeof item.id === 'string') {
        await addToCart(userId, item.id, variantId, item.qty || 1);
      }
    } catch (err) {
      console.warn('Could not merge guest cart item into Supabase cart:', item.name, err);
    }
  }

  return await fetchCart(userId);
}
