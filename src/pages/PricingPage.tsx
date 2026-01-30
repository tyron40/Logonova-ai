import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { CreditPurchase } from '../components/CreditPurchase';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const { user } = useAuthStore();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase.rpc('get_user_credits', {
          p_user_id: user.id
        });

        if (error) throw error;
        setCredits(data || 0);
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600">Please sign in to purchase credits.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Credit Package
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Purchase credits to generate professional logos with AI. Each logo generation uses 1-2 credits.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <CreditPurchase currentCredits={credits} />
        </div>
      </div>
    </div>
  );
};