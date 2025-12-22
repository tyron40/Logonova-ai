import React, { useState } from 'react';
import { X, Coins, Crown, Zap, Check, Star, Loader2 } from 'lucide-react';
import { stripeService } from '../services/stripeService';
import { stripeProducts } from '../stripe-config';

interface CreditsPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const CreditsPurchaseModal: React.FC<CreditsPurchaseModalProps> = ({
  isOpen,
  onClose,
  userEmail
}) => {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async (priceId: string) => {
    setLoadingPriceId(priceId);

    try {
      await stripeService.redirectToCheckout(priceId, 'payment');
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
    return Coins;
  };

  const getGradient = (credits: number, popular: boolean) => {
    if (popular) return 'from-purple-500 to-purple-600';
    if (credits >= 150) return 'from-orange-500 to-red-500';
    if (credits >= 55) return 'from-purple-500 to-purple-600';
    if (credits >= 25) return 'from-green-500 to-green-600';
    return 'from-blue-500 to-blue-600';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full p-6 border border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Purchase Credits</h3>
                <p className="text-gray-400">Choose a credit package</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* User Info */}
          {userEmail && (
            <div className="bg-gray-700/30 rounded-xl p-4 mb-6 border border-gray-600/50">
              <div className="text-center">
                <div className="text-sm text-gray-400">
                  📧 {userEmail}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                  <h4 className="text-xl font-bold text-white mb-2">{product.name}</h4>
                  <div className="text-3xl font-bold text-white mb-1">
                    ${product.price}
                  </div>
                  <div className="text-gray-400">{product.credits} credits</div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{product.credits} logo generations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">High-quality downloads</span>
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
                </div>

                <button
                  onClick={() => handlePurchase(product.priceId)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center space-x-2 bg-gradient-to-r ${gradient} text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mobile-optimized mobile-button`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Purchase Now</span>
                  )}
                </button>
              </div>
            );
            })}
          </div>

          {/* Payment Info */}
          <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Secure Payment with Stripe</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Secure one-time payment processing</li>
                  <li>• Credits added instantly after payment</li>
                  <li>• No recurring charges or subscriptions</li>
                  <li>• SSL encrypted and PCI compliant</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};