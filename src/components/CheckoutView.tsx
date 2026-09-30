import React, { useState } from 'react';
import { CartItem, Order, UserSession } from '../types';
import { QrCode, Banknote, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface CheckoutViewProps {
  cart: CartItem[];
  currentUser: UserSession | null;
  onPlaceOrder: (order: Order) => void;
  onBackToCart: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cart,
  currentUser,
  onPlaceOrder,
  onBackToCart,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = subtotal >= 500 ? 0 : 40;
  const total = subtotal + shipping;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitting(true);

    const newOrder: Order = {
      id: 'KBR-' + Math.floor(100000 + Math.random() * 900000),
      customerName: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      items: [...cart],
      paymentMethod,
      totalAmount: total,
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      status: 'Pending',
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onPlaceOrder(newOrder);
    }, 600);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <button
        onClick={onBackToCart}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-700 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Shopping Cart</span>
      </button>

      <div className="bg-white p-5 sm:p-8 md:p-10 rounded-3xl shadow-xl border border-amber-200">
        <div className="border-b border-amber-100 pb-4 mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-royal-950">
            Checkout & Shipping
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Enter your delivery details for express spice dispatch.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Full Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Gmail / Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@gmail.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              House No. & Street / Landmark *
            </label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Flat / House No., Apartment, Street name, Landmark"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                City *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter City"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                State *
              </label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Enter State"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Pincode *
              </label>
              <input
                type="text"
                required
                pattern="[0-9]{6}"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit Pincode"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Payment Selection */}
          <div className="pt-4 border-t border-amber-100">
            <label className="block text-sm font-extrabold text-royal-950 mb-3">
              Select Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`border-2 p-4 rounded-2xl flex items-center space-x-3 cursor-pointer transition ${
                  paymentMethod === 'COD'
                    ? 'border-amber-600 bg-amber-50/80 shadow-xs'
                    : 'border-gray-200 bg-gray-50/40 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="w-4 h-4 text-amber-700 focus:ring-amber-500"
                />
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-800" />
                  <span className="text-xs font-bold text-royal-950">Cash On Delivery</span>
                </div>
              </label>

              <label
                className={`border-2 p-4 rounded-2xl flex items-center space-x-3 cursor-pointer transition ${
                  paymentMethod === 'ONLINE'
                    ? 'border-amber-600 bg-amber-50/80 shadow-xs'
                    : 'border-gray-200 bg-gray-50/40 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ONLINE"
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                  className="w-4 h-4 text-amber-700 focus:ring-amber-500"
                />
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-800" />
                  <span className="text-xs font-bold text-royal-950">UPI / QR Code</span>
                </div>
              </label>
            </div>

            {/* Online UPI QR View */}
            {paymentMethod === 'ONLINE' && (
              <div className="mt-4 p-5 sm:p-6 border-2 border-dashed border-amber-400 bg-amber-50/70 text-center rounded-2xl animate-in fade-in">
                <p className="text-xs font-bold text-royal-950 mb-1">
                  Scan UPI QR Code to Complete Payment
                </p>
                <p className="text-[11px] text-gray-500 mb-3">
                  Google Pay, PhonePe, Paytm, BHIM UPI Accepted
                </p>
                <div className="bg-white p-3 rounded-2xl shadow-sm inline-block border border-amber-200">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=UPI://PAY/KBRGLOBALVENTURES@UPI"
                    alt="UPI Payment QR Code"
                    className="w-36 h-36 mx-auto rounded-xl"
                  />
                </div>
                <p className="text-xs font-semibold text-amber-900 mt-2">
                  UPI ID: <span className="font-mono font-bold">KBRGLOBALVENTURES@UPI</span>
                </p>
              </div>
            )}
          </div>

          {/* Order Summary & Submit */}
          <div className="pt-4 border-t border-amber-100 flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-600">Total Payable ({cart.length} items):</span>
            <span className="text-xl font-extrabold text-red-900">₹{total}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-4 rounded-xl text-base shadow-xl transition transform active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{isSubmitting ? 'Placing Order...' : 'Confirm & Place Order'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
