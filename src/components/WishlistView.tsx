import React from 'react';
import { Product } from '../types';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { ProductCard } from './ProductCard';

interface WishlistViewProps {
  products: Product[];
  wishlistIds: (number | string)[];
  onAddToCart: (product: Product, selectedWeight: string, price: number) => void;
  onToggleWishlist: (productId: number | string) => void;
  onExploreProducts: () => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  products,
  wishlistIds,
  onAddToCart,
  onToggleWishlist,
  onExploreProducts,
}) => {
  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="border-b border-amber-200/80 pb-4 mb-6 sm:mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-royal-950 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <span>Saved Items & Wishlist</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {wishlistedProducts.length} items saved for later purchase.
          </p>
        </div>
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-amber-200 shadow-sm p-6 max-w-xl mx-auto">
          <Heart className="w-12 h-12 text-red-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-royal-950 mb-1">
            Your wishlist is empty
          </h3>
          <p className="text-xs text-gray-500 mb-5">
            Click the heart icon on any spice card to save it here for fast reordering.
          </p>
          <button
            onClick={onExploreProducts}
            className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition inline-flex items-center gap-2"
          >
            <span>Explore Spices Range</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {wishlistedProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              isWishlisted={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
