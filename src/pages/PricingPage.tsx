import React, { useEffect, useState } from 'react';
import { CreditPurchase } from '../components/CreditPurchase';
import { supabase } from '../services/supabase';
import { Loader2 } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
          setLoading(false);
          return;
        }

        setUser(currentUser);

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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-slate-300">Please sign in to purchase credits.</p>
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
