import React, { useEffect, useState } from 'react';
import { CreditPurchase } from '../components/CreditPurchase';
import { supabase } from '../services/supabase';
import { Loader2, LogIn } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface PricingPageProps {
  currentUser: User | null;
  onAuthRequired: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ currentUser, onAuthRequired }) => {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_api_keys')
          .select('credit_balance')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (error) throw error;
        setCredits(data?.credit_balance || 0);
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-card p-12 rounded-2xl max-w-md mx-auto">
          <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-slate-300 mb-8">
            Please sign in to purchase credits and start generating professional logos.
          </p>
          <button
            onClick={onAuthRequired}
            className="px-6 py-3 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity mobile-optimized mobile-button"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Credit Package
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Purchase credits to generate professional logos with AI. Each logo generation uses 1 credit.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <CreditPurchase currentCredits={credits} />
        </div>
      </div>
    </div>
  );
};
