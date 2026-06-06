import React, { useState } from 'react';
import { X, Coins, Crown, Zap, Check, Star, Loader2, Building2, CreditCard, Landmark, Link } from 'lucide-react';
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

  const handlePurchase = async (priceId: string, paymentLink?: string) => {
    if (paymentLink) {
      window.open(paymentLink, '_blank', 'noopener,noreferrer');
      return;
    }
    setLoadingPriceId(priceId);
    try {
      await stripeService.redirectToCheckout(priceId, 'payment');
    } catch (error) {
      console.error('Error starting checkout:', error);
      setLoadingPriceId(null);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout. Please try again.';
      alert(`Payment Error:\n\n${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
    }
  };

  const getIcon = (name: string, credits?: number) => {
    if (name === 'Custom') return Building2;
    if ((credits ?? 0) >= 150) return Zap;
    if ((credits ?? 0) >= 55) return Crown;
    return Coins;
  };

  const getGradient = (name: string, credits?: number, popular?: boolean) => {
    if (name === 'Custom') return 'from-slate-600 to-slate-700';
    if (popular) return 'from-blue-500 to-blue-600';
    if ((credits ?? 0) >= 150) return 'from-orange-500 to-red-500';
    if ((credits ?? 0) >= 55) return 'from-blue-500 to-blue-600';
    if ((credits ?? 0) >= 25) return 'from-green-500 to-green-600';
    return 'from-blue-400 to-blue-500';
  };

  const standardProducts = stripeProducts.filter(p => p.name !== 'Custom');
  const customProduct = stripeProducts.find(p => p.name === 'Custom');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative bg-gray-800 rounded-2xl shadow-xl max-w-5xl w-full p-6 border border-gray-700">
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
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {userEmail && (
            <div className="bg-gray-700/30 rounded-xl p-3 mb-6 border border-gray-600/50 text-center text-sm text-gray-400">
              {userEmail}
            </div>
          )}

          {/* Standard products — 4-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {standardProducts.map((product) => {
              const Icon = getIcon(product.name, product.credits);
              const gradient = getGradient(product.name, product.credits, product.popular);
              const isLoading = loadingPriceId === product.priceId;

              return (
                <div
                  key={product.id}
                  className={`relative p-5 bg-gray-900 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                    product.popular
                      ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {product.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>Most Popular</span>
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1">{product.name}</h4>
                    <div className="text-2xl font-bold text-white">${product.price}</div>
                    <div className="text-sm text-gray-400">{product.credits} credits</div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-xs">{product.credits} logo generations</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-xs">High-quality downloads</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-xs">Cloud sync & storage</span>
                    </div>
                    {(product.credits ?? 0) >= 55 && (
                      <div className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300 text-xs">Priority support</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handlePurchase(product.priceId, product.paymentLink)}
                    disabled={isLoading}
                    className={`w-full flex items-center justify-center space-x-2 bg-gradient-to-r ${gradient} text-white px-4 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Processing...</span></>
                    ) : (
                      <span>Purchase</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Custom / Enterprise product — full width */}
          {customProduct && (() => {
            const isLoading = loadingPriceId === customProduct.priceId;
            return (
              <div className="p-5 bg-gray-900 rounded-2xl border-2 border-slate-600 hover:border-slate-500 transition-all duration-300 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-lg font-bold text-white">Custom / Enterprise</h4>
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">Enterprise</span>
                      </div>
                      <p className="text-sm text-gray-400">Custom package for high-volume or enterprise needs</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-xs text-gray-300">{customProduct.credits} credits</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-xs text-gray-300">Priority support</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-xs text-gray-300">Commercial license</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 sm:flex-shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">${customProduct.price.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">one-time</div>
                    </div>
                    <button
                      onClick={() => handlePurchase(customProduct.priceId, customProduct.paymentLink)}
                      disabled={isLoading}
                      className="flex items-center space-x-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span>Processing...</span></>
                      ) : (
                        <span>Purchase</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Payment methods */}
          <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
            <h4 className="font-medium text-white mb-3 text-sm">Accepted Payment Methods</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-2">
                <CreditCard className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-sm text-gray-300">Credit / Debit Card</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-2">
                <Landmark className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-sm text-gray-300">ACH Bank Transfer</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-2">
                <Link className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="text-sm text-gray-300">Link (Stripe)</span>
              </div>
            </div>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Credits added instantly after payment confirmation</li>
              <li>• No recurring charges — one-time purchase</li>
              <li>• SSL encrypted and PCI compliant via Stripe</li>
            </ul>
          </div>

          <div className="flex justify-center mt-4">
            <button onClick={onClose} className="px-6 py-2 text-gray-400 hover:text-white transition-colors text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
