import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const SuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');

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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>

          <p className="text-gray-600 mb-6">
            Your credits have been added to your account. You can now start generating amazing logos!
          </p>

          {!loading && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-1">
                <CreditCard className="w-4 h-4" />
                Current Balance
              </div>
              <div className="text-2xl font-bold text-gray-900">{credits} credits</div>
            </div>
          )}

          {sessionId && (
            <div className="text-xs text-gray-500 mb-6 p-3 bg-gray-50 rounded">
              Session ID: {sessionId}
            </div>
          )}

          <div className="space-y-3">
            <Link
              to="/generate"
              className="w-full bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              Start Creating Logos
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/dashboard"
              className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};