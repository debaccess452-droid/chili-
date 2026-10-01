import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingCart, Heart, Check, AlertCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedWeight: string, price: number) => void;
  onToggleWishlist: (productId: number | string) => void;
  isWishlisted: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
}) => {
  // Default to 100g or first variant
  const variants = product.variants && product.variants.length > 0 ? product.variants : [{ weight: '100g', price: 50 }];
  const defaultVariantIndex = variants.findIndex((v) => v.weight === '100g');
  const initialIndex = defaultVariantIndex !== -1 ? defaultVariantIndex : 0;
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(initialIndex);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const currentVariant = variants[selectedVariantIndex] || variants[0];

  const handleAddToCart = () => {
    if (!product.inStock) return;
    onAddToCart(product, currentVariant.weight, currentVariant.price);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs hover:shadow-lg border border-amber-200/90 overflow-hidden flex flex-col justify-between transition-all duration-300 group">
      
      {/* Product Image & Badges */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-amber-50/50">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
          onError={(e) => {
            // Fallback image if custom URL fails
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Stock status badge */}
        <span
          className={`absolute top-2.5 left-2.5 text-[9px] sm:text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs ${
            product.inStock
              ? 'bg-amber-500 text-royal-950 font-black'
              : 'bg-red-600 text-white'
          }`}
        >
          {product.inStock ? 'In Stock' : 'Out of Stock'}
        </span>

        {/* Wishlist quick toggle with minimum 44px touch area */}
        <button
          onClick={() => onToggleWishlist(product.id)}
          className={`absolute top-2 right-2 p-2.5 min-w-[40px] min-h-[40px] rounded-full shadow-sm transition transform active:scale-90 flex items-center justify-center cursor-pointer ${
            isWishlisted
              ? 'bg-red-50 text-red-600 ring-2 ring-red-400'
              : 'bg-white/90 text-gray-400 hover:text-red-500'
          }`}
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label="Wishlist toggle"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} />
        </button>

        {product.category && (
          <span className="absolute bottom-2 left-2.5 bg-black/65 backdrop-blur-xs text-amber-200 text-[10px] font-medium px-2 py-0.5 rounded-md">
            {product.category}
          </span>
        )}
      </div>

      {/* Card Content & Details */}
      <div className="p-3.5 sm:p-4 flex-grow flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-royal-950 text-sm sm:text-base leading-snug line-clamp-1 mb-1">
            {product.name}
          </h4>

          {product.shortDescription && (
            <p className="text-[11px] text-gray-500 line-clamp-1 mb-2">
              {product.shortDescription}
            </p>
          )}

          {/* Weight Variant Selector */}
          <div className="mt-2">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Select Net Weight:
            </label>
            <div className="relative">
              <select
                value={selectedVariantIndex}
                onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
                className="w-full bg-amber-50/60 border border-amber-300 text-xs font-semibold py-2 px-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition appearance-none cursor-pointer"
              >
                {product.variants.map((v, idx) => (
                  <option key={`${v.weight}-${idx}`} value={idx}>
                    {v.weight} — ₹{v.price}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-amber-800">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Dynamic Price Display */}
          <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
            <span className="text-lg sm:text-xl font-extrabold text-red-900 tracking-tight">
              ₹{currentVariant.price}
            </span>
            {currentVariant.originalPrice && currentVariant.originalPrice > currentVariant.price && (
              <span className="text-xs text-gray-400 line-through">
                ₹{currentVariant.originalPrice}
              </span>
            )}
            <span className="text-[11px] text-gray-500 font-medium">
              for {currentVariant.weight}
            </span>
            {product.sku && (
              <span className="ml-auto text-[9px] sm:text-[10px] text-gray-400 font-mono">
                {product.sku}
              </span>
            )}
          </div>
        </div>

        {/* Action Button - min 44px touch height */}
        <div className="mt-3 pt-2.5 border-t border-amber-100">
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`w-full py-2.5 px-3 min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition transform active:scale-98 shadow-xs cursor-pointer ${
              !product.inStock
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
                : addedAnimation
                ? 'bg-emerald-700 text-white'
                : 'bg-amber-800 hover:bg-amber-900 text-white shadow-amber-900/20'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Cart!</span>
              </>
            ) : product.inStock ? (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>Out of Stock</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
