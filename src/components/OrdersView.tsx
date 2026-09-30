import React from 'react';
import { Order } from '../types';
import { Package, Clock, CheckCircle2, Truck, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  onShopMore: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ orders, onShopMore }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="border-b border-amber-200/80 pb-4 mb-6 sm:mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-royal-950">
            My Orders & Tracking
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time status updates for your authentic spice shipments.
          </p>
        </div>
        <button
          onClick={onShopMore}
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-700"
        >
          <span>Explore Spices</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-amber-200 shadow-sm p-6 max-w-xl mx-auto">
          <Package className="w-12 h-12 text-amber-700/60 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-royal-950 mb-1">
            No orders placed yet
          </h3>
          <p className="text-xs text-gray-500 mb-5">
            Your placed orders and parcel tracking history will show up here.
          </p>
          <button
            onClick={onShopMore}
            className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition"
          >
            Start Shopping Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-amber-200 shadow-xs hover:border-amber-300 transition"
            >
              <div className="flex flex-wrap justify-between items-center border-b border-amber-100 pb-3 mb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-royal-950 text-base">
                    Order #{o.id}
                  </span>
                  <span className="text-xs text-gray-400">• {o.date}</span>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                    o.status === 'Confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : o.status === 'Delivered'
                      ? 'bg-blue-100 text-blue-800'
                      : o.status === 'Cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {o.status}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-4">
                {o.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-gray-800">
                      {item.name} <span className="text-amber-800 font-bold">({item.weight})</span> x {item.qty}
                    </span>
                    <span className="font-bold text-gray-900">
                      ₹{item.price * item.qty}
                    </span>
                  </div>
                ))}
              </div>

              {/* Address & Meta */}
              <div className="pt-3 border-t border-amber-100 text-xs text-gray-500 space-y-1">
                <p>
                  <span className="font-semibold text-gray-700">Delivery Address:</span> {o.address}, {o.city}, {o.state} - {o.pincode}
                </p>
                <div className="flex flex-wrap justify-between items-center pt-1 text-royal-950 font-bold">
                  <span>Payment Mode: {o.paymentMethod === 'COD' ? 'Cash On Delivery' : 'Online UPI'}</span>
                  <span className="text-sm font-extrabold text-red-900">Total Paid: ₹{o.totalAmount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
