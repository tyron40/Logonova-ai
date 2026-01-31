import React, { useState } from 'react';
import { stripeProducts } from '../stripe-config';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

interface CreditPurchaseProps {
  currentCredits: number;
}

export const CreditPurchase: React.FC<CreditPurchaseProps> = ({ currentCredits }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (priceId: string, mode: 'payment' | 'subscription') => {
    setLoading(priceId);

    try {
      if (!supabase) {
        throw new Error('Payment system not available');
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Please sign in to purchase credits');
      }

      const apiBaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${apiBaseUrl}/functions/v1/stripe-checkout`;

      const successUrl = `${window.location.origin}/?payment=success`;
      const cancelUrl = `${window.location.origin}/?payment=cancelled`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: successUrl,
          cancel_url: cancelUrl,
          mode: mode,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
      setLoading(null);
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-700/50 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Purchase Credits</h2>
      </div>

      <div className="mb-6 p-4 glass-card-dark rounded-xl border border-slate-700/50">
        <div className="text-sm text-slate-400">Current Balance</div>
        <div className="text-3xl font-bold text-white">{currentCredits} credits</div>
      </div>

      <div className="grid gap-4">
        {stripeProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-4 glass-card-dark border border-slate-700/50 rounded-xl hover:border-blue-500/50 transition-all"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-white text-lg">{product.name}</h3>
              <p className="text-sm text-slate-400">{product.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xl font-bold text-white">
                  {product.currency_symbol}{product.price_per_unit.toFixed(2)}
                </div>
                <div className="text-xs text-slate-400">
                  {product.currency_symbol}{(product.price_per_unit / product.credits).toFixed(2)} per credit
                </div>
              </div>
              <button
                onClick={() => handlePurchase(product.priceId, product.mode)}
                disabled={loading === product.priceId}
                className="px-6 py-3 gradient-primary text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[120px] flex items-center justify-center shadow-glow"
              >
                {loading === product.priceId ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Buy Now'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <p className="text-sm text-blue-300">
          <strong>Note:</strong> Credits are used for logo generation. Each logo generation uses exactly 1 credit.
        </p>
      </div>
    </div>
  );
};