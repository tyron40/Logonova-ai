import React, { useEffect, useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { supabase } from '../services/supabase';
import type { User } from '@supabase/supabase-js';

interface CreditDisplayProps {
  currentUser: User | null;
  onPurchaseClick?: () => void;
  compact?: boolean;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({
  currentUser,
  onPurchaseClick,
  compact = false
}) => {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!currentUser) {
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

    fetchCredits();

    const subscription = supabase
      .channel(`user_credits_${currentUser?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_api_keys',
          filter: `user_id=eq.${currentUser?.id}`,
        },
        () => {
          fetchCredits();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser]);

  if (!currentUser || loading) {
    return null;
  }

  const isLowCredits = credits < 5;

  if (compact) {
    return (
      <div className="flex items-center gap-2 glass-card px-3 py-2 rounded-xl">
        <CreditCard className={`w-4 h-4 ${isLowCredits ? 'text-red-400' : 'text-slate-300'}`} />
        <span className={`font-medium text-sm ${isLowCredits ? 'text-red-400' : 'text-white'}`}>
          {credits}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-2 glass-card rounded-xl border border-slate-700/50">
        <CreditCard className={`w-4 h-4 ${isLowCredits ? 'text-red-400' : 'text-slate-300'}`} />
        <span className={`font-medium ${isLowCredits ? 'text-red-400' : 'text-white'}`}>
          {credits} credits
        </span>
      </div>

      {isLowCredits && onPurchaseClick && (
        <button
          onClick={onPurchaseClick}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium mobile-optimized mobile-button"
        >
          <Plus className="w-4 h-4" />
          Buy Credits
        </button>
      )}
    </div>
  );
};
