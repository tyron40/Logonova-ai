import React, { useState } from 'react';
import { stripeProducts } from '../stripe-config';
import { CreditCard, Loader2 } from 'lucide-react';

interface CreditPurchaseProps {
  currentCredits: number;
}

export const CreditPurchase: React.FC<CreditPurchaseProps> = ({ currentCredits }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (priceId: string) => {
    setLoading(priceId);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-semibold text-gray-900">Purchase Credits</h2>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">Current Balance</div>
        <div className="text-2xl font-bold text-gray-900">{currentCredits} credits</div>
      </div>

      <div className="grid gap-4">
        {stripeProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-600">{product.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {product.currency_symbol}{product.price_per_unit.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {product.currency_symbol}{(product.price_per_unit / product.credits).toFixed(3)} per credit
                </div>
              </div>
              <button
                onClick={() => handlePurchase(product.priceId)}
                disabled={loading === product.priceId}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[100px] flex items-center justify-center"
              >
                {loading === product.priceId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Buy Now'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Credits are used for logo generation. Each logo generation typically costs 1-2 credits.
        </p>
      </div>
    </div>
  );
};