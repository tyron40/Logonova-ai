import React, { useEffect, useState } from 'react';
import { CheckCircle, Download, ArrowRight, Home } from 'lucide-react';
import { creditService } from '../services/creditService';
import { stripeService } from '../services/stripeService';

interface SuccessPageProps {
  onNavigateHome: () => void;
  onNavigateGenerator: () => void;
  currentUser?: any;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({
  onNavigateHome,
  onNavigateGenerator,
  currentUser
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [creditsAdded, setCreditsAdded] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdParam = urlParams.get('session_id');
    setSessionId(sessionIdParam);
    
    // Verify the payment and add credits only if successful
    if (sessionIdParam && currentUser) {
      verifyAndAddCredits(sessionIdParam);
    }
  }, [currentUser]);

  const verifyAndAddCredits = async (sessionId: string) => {
    try {
      setIsVerifying(true);
      setVerificationError(null);
      
      // Verify the payment session with Stripe
      const verification = await stripeService.verifyPaymentSession(sessionId);
      
      if (verification.success && verification.credits) {
        // Only add credits after successful verification
        const success = creditService.processStripeSuccess(
          sessionId, 
          verification.credits, 
          currentUser.id
        );
        
        if (success) {
          setCreditsAdded(verification.credits);
          console.log(`Successfully added ${verification.credits} credits for session ${sessionId}`);
        } else {
          console.warn(`Credits were already processed for session ${sessionId}`);
          // Check if credits were already added by looking at credit history
          const creditBalance = creditService.getCreditBalance(currentUser.id);
          const creditHistory = creditService.getCreditHistory(currentUser.id);
          
          // Find transaction with this session ID
          const existingTransaction = creditHistory.find(
            transaction => transaction.stripeSessionId === sessionId
          );
          
          if (existingTransaction) {
            setCreditsAdded(existingTransaction.amount);
            console.log(`Credits were already processed: ${existingTransaction.amount} credits`);
          } else {
            setVerificationError('Failed to add credits to your account. Please contact support.');
          }
        }
      } else {
        setVerificationError('Payment verification failed. Please contact support if you were charged.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      
      // Even if verification fails, check if credits were already added locally
      const creditHistory = creditService.getCreditHistory(currentUser.id);
      const existingTransaction = creditHistory.find(
        transaction => transaction.stripeSessionId === sessionId
      );
      
      if (existingTransaction) {
        setCreditsAdded(existingTransaction.amount);
        console.log(`Found existing transaction despite verification error: ${existingTransaction.amount} credits`);
      } else {
        setVerificationError('Unable to verify payment. Please contact support if you were charged.');
      }
    } finally {
      setIsVerifying(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/25">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>

        {/* Success Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          {isVerifying ? 'Verifying Payment...' : 'Payment Successful!'}
        </h1>
        
        {isVerifying ? (
          <p className="text-xl text-gray-300 mb-8 max-w-lg mx-auto">
            Please wait while we verify your payment and add your credits...
          </p>
        ) : verificationError ? (
          <div className="bg-red-500/10 border border-red-400/30 text-red-400 px-6 py-4 rounded-xl mb-8 max-w-lg mx-auto">
            <p className="text-lg font-semibold mb-2">Verification Error</p>
            <p>{verificationError}</p>
          </div>
        ) : (
          <p className="text-xl text-gray-300 mb-8 max-w-lg mx-auto">
            Thank you for your subscription! {creditsAdded > 0 && `${creditsAdded} credits have been`} added to your account and you can start creating amazing logos right away.
          </p>
        )}

        {/* Session Info */}
        {sessionId && (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 mb-8 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-2">Order Details</h3>
            <p className="text-sm text-gray-400">Session ID: {sessionId}</p>
            {creditsAdded > 0 && (
              <p className="text-sm text-green-400 mt-2">Credits Added: {creditsAdded}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center ${isVerifying ? 'opacity-50 pointer-events-none' : ''}`}>
          <button
            onClick={onNavigateGenerator}
            disabled={isVerifying || !!verificationError}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg mobile-optimized mobile-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>Start Creating Logos</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 mobile-optimized mobile-button"
          >
            <Home className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">What's Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold">1</div>
              <p className="text-blue-300">Go to the Logo Generator</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold">2</div>
              <p className="text-blue-300">Enter your company details</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold">3</div>
              <p className="text-blue-300">Generate & download your logo</p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Need help? Contact our support team for assistance with your new subscription.
          </p>
        </div>
      </div>
    </div>
  );
};