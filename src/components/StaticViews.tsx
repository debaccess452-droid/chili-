import React from 'react';
import { PageId } from '../types';
import { ShieldCheck, RefreshCw, Award, HeartHandshake, Sparkles, Truck, Phone } from 'lucide-react';

interface StaticViewsProps {
  page: 'about' | 'privacy' | 'return';
  onNavigateHome: () => void;
}

export const StaticViews: React.FC<StaticViewsProps> = ({ page, onNavigateHome }) => {
  if (page === 'about') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-amber-200 shadow-lg space-y-6">
          <div className="border-b border-amber-100 pb-5">
            <span className="text-[10px] font-extrabold uppercase px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
              Heritage of Purity
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-royal-950 mt-2">
              About KBR Global Ventures
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Pure Indian Masale & Spices, Ground with Care & Clean Tradition
            </p>
          </div>

          <div className="prose text-xs sm:text-sm text-gray-700 leading-relaxed space-y-4">
            <p>
              At <strong>KBR Global Ventures</strong>, we are dedicated to reviving the lost culinary authenticity of traditional Indian households. Founded on the principle that spices should never be adulterated with synthetic colorants, starch fillers, or industrial preservatives, our mission is to deliver pure, uncompromised masalas straight from indigenous agricultural centers to your family table.
            </p>
            <p>
              Every batch of our <strong>Haldi, Lal Mirch, Dhania, and signature Royal Garam Masala</strong> undergoes rigorous cleaning, sun-drying, and precision low-temperature pulverization. This preserves delicate essential spice oils—the source of authentic aroma, therapeutic curcuminoids, and deep therapeutic qualities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-amber-100">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <Award className="w-6 h-6 text-amber-800 mb-2" />
              <h4 className="text-xs font-bold text-royal-950">Ethically Sourced</h4>
              <p className="text-[11px] text-gray-600 mt-1">Direct contracts with regional spice farmers ensuring peak crop harvest.</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <ShieldCheck className="w-6 h-6 text-amber-800 mb-2" />
              <h4 className="text-xs font-bold text-royal-950">Cold Processing</h4>
              <p className="text-[11px] text-gray-600 mt-1">Slow grinding prevents heat degradation and seals volatile flavor aromas.</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <HeartHandshake className="w-6 h-6 text-amber-800 mb-2" />
              <h4 className="text-xs font-bold text-royal-950">Zero Adulteration</h4>
              <p className="text-[11px] text-gray-600 mt-1">100% natural color, lab-certified safety, and moisture-barrier packaging.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'privacy') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-amber-200 shadow-lg space-y-6">
          <div className="border-b border-amber-100 pb-5">
            <span className="text-[10px] font-extrabold uppercase px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
              Trust & Data Security
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-royal-950 mt-2">
              Privacy & Data Protection Policy
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: September 2026 • KBR Global Ventures
            </p>
          </div>

          <div className="text-xs sm:text-sm text-gray-700 leading-relaxed space-y-4">
            <p>
              KBR Global Ventures values your privacy. This policy outlines how we handle customer data collected through our store:
            </p>
            <h4 className="font-bold text-royal-950 text-sm">1. Information We Collect</h4>
            <p>
              When you browse or place an order on our store, we collect contact credentials including your name, 10-digit mobile number, email address, and shipping address solely for dispatching spice parcels and communicating order updates.
            </p>
            <h4 className="font-bold text-royal-950 text-sm">2. Data Security & Storage</h4>
            <p>
              Your contact details are stored securely. We do not sell, rent, or trade your personal telephone numbers or emails to third-party marketing entities.
            </p>
            <h4 className="font-bold text-royal-950 text-sm">3. Payment Integrity</h4>
            <p>
              For online UPI payments, transactions occur directly through your banking or UPI application using official bank gateways. We never store credit card pins or sensitive banking passwords.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-amber-200 shadow-lg space-y-6">
        <div className="border-b border-amber-100 pb-5">
          <span className="text-[10px] font-extrabold uppercase px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
            Customer Guarantee
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-royal-950 mt-2">
            7-Day Return and Replacement Policy
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Fair and transparent replacements for your complete satisfaction.
          </p>
        </div>

        <div className="text-xs sm:text-sm text-gray-700 leading-relaxed space-y-4">
          <p>
            We take supreme pride in the purity of our spices. If you receive a damaged package, broken seal, or incorrect weight variant, we provide a replacement or refund under our 7-Day Guarantee:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Eligible Claims:</strong> Physical damage in transit, broken packaging seal, or incorrect item dispatch.
            </li>
            <li>
              <strong>Window:</strong> Report issues within 7 days of package delivery to Helpline (+91 8527386834) or support@kbrglobalventures.com.
            </li>
            <li>
              <strong>Processing:</strong> Replacement packages are dispatched within 24 hours of claim verification at zero additional courier cost to the customer.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
