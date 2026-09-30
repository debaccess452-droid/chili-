import React from 'react';
import { CartItem, PageId } from '../types';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

interface CartViewProps {
  cart: CartItem[];
  onUpdateQty: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
}

export const CartView: React.FC<CartViewProps> = ({
  cart,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout,
  onContinueShopping,
}) => {
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = subtotal >= 500 || subtotal === 0 ? 0 : 40;
  const total = subtotal + shipping;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-6 sm:mb-8 border-b border-amber-200/80 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-900">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-royal-950">
            Your Shopping Cart
          </h2>
          <p className="text-xs text-gray-500">
            {cart.length} {cart.length === 1 ? 'variety' : 'varieties'} selected
          </p>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-16 sm:py-24 bg-white rounded-3xl border border-amber-200 shadow-sm max-w-2xl mx-auto p-6">
          <div className="w-16 h-16 rounded-full bg-amber-100/70 text-amber-800 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="text-xl font-bold text-royal-950 mb-2">
            Your shopping cart is empty!
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
            Explore our curated selection of hand-processed Indian masalas and whole spices.
          </p>
          <button
            onClick={onContinueShopping}
            className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-lg inline-flex items-center gap-2"
          >
            <span>Explore Spices Collection</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.cartItemId}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-amber-300 transition"
              >
                <div className="flex items-center space-x-3.5 sm:space-x-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-amber-200 shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-royal-950 leading-snug">
                      {item.name}
                    </h4>
                    <span className="text-[11px] text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded-md inline-block my-1">
                      Net Wt: {item.weight}
                    </span>
                    <p className="text-xs text-gray-500">
                      ₹{item.price} each • Subtotal: <span className="font-bold text-royal-950">₹{item.price * item.qty}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="flex items-center space-x-2 bg-amber-50/80 p-1 rounded-xl border border-amber-200">
                    <button
                      onClick={() => onUpdateQty(item.cartItemId, -1)}
                      className="w-7 h-7 bg-white rounded-lg font-bold text-amber-900 hover:bg-amber-100 flex items-center justify-center transition shadow-xs"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs sm:text-sm font-extrabold px-2 text-royal-950 min-w-[20px] text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.cartItemId, 1)}
                      className="w-7 h-7 bg-white rounded-lg font-bold text-amber-900 hover:bg-amber-100 flex items-center justify-center transition shadow-xs"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.cartItemId)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Delivery threshold tip */}
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {subtotal >= 500
                  ? '🎉 Congratulations! You have unlocked FREE Express Pan-India Delivery!'
                  : `Add ₹${500 - subtotal} more to qualify for FREE Shipping (Orders ₹500+).`}
              </span>
            </div>
          </div>

          {/* Cart Summary Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-amber-200 shadow-md space-y-4 sticky top-20">
            <h3 className="font-extrabold text-lg text-royal-950 border-b border-amber-100 pb-3">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Pan-India Shipping</span>
                <span className="font-semibold text-gray-900">
                  {shipping === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Packaging & Hygiene Quality</span>
                <span className="text-emerald-700 font-bold">Complimentary</span>
              </div>
            </div>

            <div className="border-t border-amber-100 pt-3 flex justify-between font-extrabold text-base sm:text-lg text-royal-950">
              <span>Total Payable</span>
              <span className="text-red-900">₹{total}</span>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full bg-gradient-to-r from-amber-800 to-royal-900 hover:from-amber-900 hover:to-royal-950 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-lg transition transform active:scale-98 flex items-center justify-center gap-2 mt-4"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onContinueShopping}
              className="w-full text-center text-xs text-amber-900 hover:underline font-semibold pt-1"
            >
              Continue shopping more spices
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
