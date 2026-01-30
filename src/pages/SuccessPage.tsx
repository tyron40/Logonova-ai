import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, CreditCard } from 'lucide-react';
import { supabase } from '../services/supabase';

export const SuccessPage: React.FC = () => {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_api_keys')
          .select('credit_balance')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setCredits(data?.credit_balance || 0);
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="max-w-md w-full">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-700/50 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Payment Successful!
          </h1>

          <p className="text-slate-300 mb-6">
            Your credits have been added to your account. You can now start generating amazing logos!
          </p>

          {!loading && (
            <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-1">
                <CreditCard className="w-4 h-4" />
                Current Balance
              </div>
              <div className="text-2xl font-bold text-white">{credits} credits</div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
            >
              Start Creating Logos
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-700/50 text-slate-300 font-medium py-3 px-4 rounded-lg hover:bg-gray-600/50 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
