import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Coins, ArrowLeft } from 'lucide-react';
import { CreditBalance } from '../components/CreditBalance';
import { supabase } from '../lib/supabase';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user && sessionId) {
        await fetchOrderDetails(sessionId);
      }
      setLoading(false);
    };

    getUser();
  }, [sessionId]);

  const fetchOrderDetails = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('stripe_orders')
        .select('*')
        .eq('checkout_session_id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching order details:', error);
      } else {
        setOrderDetails(data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your credits have been added to your account.
            </p>
          </div>

          {orderDetails && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-sm">#{orderDetails.order_id}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold">
                  ${(orderDetails.amount_total / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-semibold capitalize">
                  {orderDetails.payment_status}
                </span>
              </div>
            </div>
          )}

          {user && (
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="w-5 h-5 text-indigo-600" />
                <span className="text-gray-600">Current Balance:</span>
              </div>
              <CreditBalance userId={user.id} className="justify-center text-lg" />
            </div>
          )}

          <div className="space-y-3">
            <Link
              to="/logos"
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Coins className="w-4 h-4" />
              Start Creating Logos
            </Link>
            
            <Link
              to="/credits"
              className="w-full bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Credits
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}