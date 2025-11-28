import React from 'react';
import { Crown, Plus } from 'lucide-react';
import { stripeProducts } from '../stripe-config';

interface SubscriptionDisplayProps {
  subscription: any;
  onManageClick: () => void;
  isLoading?: boolean;
}

export const SubscriptionDisplay: React.FC<SubscriptionDisplayProps> = ({
  subscription,
  onManageClick,
  isLoading = false
}) => {
  const getSubscriptionInfo = () => {
    if (!subscription || !subscription.price_id) {
      return { name: 'No Plan', credits: 0 };
    }

    const product = stripeProducts.find(p => p.priceId === subscription.price_id);
    return {
      name: product?.name || 'Unknown Plan',
      credits: product?.credits || 0
    };
  };

  const { name, credits } = getSubscriptionInfo();
  const isActive = subscription?.subscription_status === 'active';

  return (
    <div className="flex items-center space-x-4">
      {/* Subscription Display */}
      <div className="flex items-center space-x-2 bg-gray-800/50 backdrop-blur-lg px-4 py-2 rounded-xl border border-gray-700/50">
        <Crown className={`w-5 h-5 ${isActive ? 'text-yellow-400' : 'text-gray-400'}`} />
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm">
            {isLoading ? '...' : name}
          </span>
          {isActive && credits > 0 && (
            <span className="text-gray-400 text-xs">{credits} credits/month</span>
          )}
        </div>
      </div>

      {/* Manage Subscription Button */}
      <button
        onClick={onManageClick}
        className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg mobile-optimized mobile-button"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">
          {isActive ? 'Manage' : 'Subscribe'}
        </span>
        <span className="sm:hidden">
          {isActive ? 'Manage' : 'Subscribe'}
        </span>
      </button>
    </div>
  );
};