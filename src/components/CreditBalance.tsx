import React, { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CreditBalanceProps {
  userId?: string;
  className?: string;
}

export function CreditBalance({ userId, className = '' }: CreditBalanceProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_credits', {
          p_user_id: userId
        });

        if (error) {
          console.error('Error fetching credits:', error);
          setCredits(0);
        } else {
          setCredits(data || 0);
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
        setCredits(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [userId]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Coins className="w-5 h-5 text-gray-400" />
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!userId || credits === null) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Coins className="w-5 h-5 text-indigo-600" />
      <span className="font-semibold text-gray-900">{credits} credits</span>
    </div>
  );
}