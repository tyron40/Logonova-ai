import React, { useState } from 'react';
import { Check, Crown, Zap, Star, Loader2 } from 'lucide-react';
import { stripeService } from '../services/stripeService';
import { stripeProducts } from '../stripe-config';

interface SubscriptionPlansProps {
  currentUser?: any;
  onAuthRequired?: () => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  currentUser,
  onAuthRequired
}) => {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    if (!currentUser) {
      onAuthRequired?.();
      return;
    }

    setLoadingPriceId(priceId);
    
    try {
      await stripeService.redirectToCheckout(priceId, 'subscription');
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoadingPriceId(null);
    }
  };

  const getIcon = (credits: number) => {
    if (credits >= 150) return Zap;
    if (credits >= 55) return Crown;
    return Star;
  };

  const getGradient = (credits: number, popular: boolean) => {
    if (popular) return 'from-purple-500 to-purple-600';
    if (credits >= 150) return 'from-orange-500 to-red-500';
    if (credits >= 55) return 'from-purple-500 to-purple-600';
    if (credits >= 25) return 'from-green-500 to-green-600';
    return 'from-blue-500 to-blue-600';
  };

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Choose Your Plan
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Subscribe to get credits for generating professional logos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {stripeProducts.map((product) => {
          const Icon = getIcon(product.credits);
          const gradient = getGradient(product.credits, product.popular || false);
          const isLoading = loadingPriceId === product.priceId;

          return (
            <div
              key={product.id}
              className={`relative p-6 bg-gray-900 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                product.popular
                  ? 'border-purple-500 shadow-lg shadow-purple-500/25'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {product.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  ${product.price}
                  <span className="text-sm text-gray-400 font-normal">/month</span>
                </div>
                <div className="text-gray-400">{product.credits} credits per month</div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{product.credits} logo generations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">High-quality PNG downloads</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Cloud sync & storage</span>
                </div>
                {product.credits >= 55 && (
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">Priority support</span>
                  </div>
                )}
                {product.credits >= 150 && (
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">Commercial license</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSubscribe(product.priceId)}
                disabled={isLoading}
                className={`w-full flex items-center justify-center space-x-2 bg-gradient-to-r ${gradient} text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mobile-optimized mobile-button`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Subscribe Now</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <div className="bg-gray-800/50 rounded-xl p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-3">All plans include:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>AI-powered logo generation</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>Multiple style options</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>Instant downloads</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};