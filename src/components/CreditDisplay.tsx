import React, { useEffect, useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export const CreditDisplay: React.FC = () => {
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

    // Set up real-time subscription for credit changes
    const subscription = supabase
      .channel('user_credits')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_api_keys',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchCredits();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  if (!user || loading) {
    return null;
  }

  const isLowCredits = credits < 5;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
        <CreditCard className={`w-4 h-4 ${isLowCredits ? 'text-red-500' : 'text-gray-500'}`} />
        <span className={`font-medium ${isLowCredits ? 'text-red-600' : 'text-gray-700'}`}>
          {credits} credits
        </span>
      </div>
      
      {isLowCredits && (
        <Link
          to="/pricing"
          className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Buy Credits
        </Link>
      )}
    </div>
  );
};