import React, { useState } from 'react';
import { stripeProducts, formatPrice, type StripeProduct } from '../stripe-config';
import { CreditCard, Loader2 } from 'lucide-react';

interface CreditPurchaseProps {
  onPurchaseStart?: () => void;
  onPurchaseComplete?: () => void;
}

export function CreditPurchase({ onPurchaseStart, onPurchaseComplete }: CreditPurchaseProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (product: StripeProduct) => {
    try {
      setLoading(product.priceId);
      onPurchaseStart?.();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: product.priceId,
          mode: product.mode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stripeProducts.map((product) => (
        <div
          key={product.priceId}
          className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {product.name}
            </h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(product.price, product.currency)}
              </span>
            </div>
            <p className="text-gray-600 mb-6">{product.description}</p>
            <button
              onClick={() => handlePurchase(product)}
              disabled={loading === product.priceId}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === product.priceId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              {loading === product.priceId ? 'Processing...' : 'Purchase'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}