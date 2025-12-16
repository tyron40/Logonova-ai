import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import LogoGenerator from './components/LogoGenerator';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AuthModal } from './components/AuthModal';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { SuccessPage } from './components/SuccessPage';
import { CreditsPurchaseModal } from './components/CreditsPurchaseModal';
import { AccountSettings } from './components/AccountSettings';
import { stripeService } from './services/stripeService';
import { apiKeyManager } from './services/apiKeyManager';
import { supabaseService, supabase } from './services/supabase';
import { creditService } from './services/creditService';
function App() {
  const [currentView, setCurrentView] = useState<'home' | 'generator' | 'plans' | 'success'>('home');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);

  // Check for success page on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    if (sessionId) {
      setCurrentView('success');
      // Credit processing now handled in SuccessPage component after verification
    }
  }, [currentUser]);

  // Initialize app and check authentication
  useEffect(() => {
    const initializeApp = async () => {
      try {
        let user = null;

        // Check if Supabase is properly configured
        if (!supabase) {
          setCurrentUser(null);
          setInitError(null);
        } else {
          // Only check current user if Supabase is available
          user = await supabaseService.getCurrentUser();
          setCurrentUser(user);
        }

        // Initialize API key manager
        await apiKeyManager.initializeForUser(user?.id || null);

        // Check if we have API keys
        const hasOpenAIKey = apiKeyManager.hasApiKey('openai');
        setHasApiKey(hasOpenAIKey);
      } catch (error) {
        console.error('Error initializing app:', error);
        setInitError('Failed to initialize app. Please refresh the page.');

        // Fallback initialization
        try {
          await apiKeyManager.initializeForUser(null);
          setHasApiKey(apiKeyManager.hasApiKey('openai'));
        } catch (fallbackError) {
          console.error('Fallback initialization failed:', fallbackError);
          setInitError('App initialization failed. Please refresh the page.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    // Listen for auth changes
    let subscription: any = null;

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user || null;

        // Clear stale session if no user found to prevent refresh token errors
        if (!user) {
          await supabaseService.signOut();
        }

        setCurrentUser(user);

        // Reinitialize API key manager
        try {
          await apiKeyManager.initializeForUser(user?.id || null);
          setHasApiKey(apiKeyManager.hasApiKey('openai'));
        } catch (error) {
          setHasApiKey(apiKeyManager.hasApiKey('openai'));
        }
      });

      subscription = data.subscription;
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleStartGenerating = () => {
    setCurrentView('generator');
  };

  const handleApiKeySet = async (apiKey: string) => {
    try {
      await apiKeyManager.setApiKey('openai', apiKey);
      setHasApiKey(apiKeyManager.hasApiKey('openai'));
      setShowApiKeyModal(false);
    } catch (error) {
      console.error('Error setting API key:', error);
    }
  };

  const handleOpenApiKeyModal = () => {
    setShowApiKeyModal(true);
  };

  const handleAuthSuccess = async (user: any) => {
    setCurrentUser(user);
    setShowAuthModal(false);

    // Migrate guest credits to user account if any exist
    creditService.migrateUserCredits('guest', user.id);

    // Give new user credits only if this is their first time
    creditService.giveNewUserCredits(user.id);

    setHasApiKey(apiKeyManager.hasApiKey('openai'));
  };

  const handleSignOut = async () => {
    try {
      await supabaseService.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handlePurchaseCredits = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setShowCreditModal(true);
  };
  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage onStartGenerating={handleStartGenerating} />;
      case 'generator':
        return (
          <LogoGenerator
            currentUser={currentUser}
            onPurchaseCredits={handlePurchaseCredits}
          />
        );
      case 'success':
        return (
          <SuccessPage
            onNavigateHome={() => setCurrentView('home')}
            onNavigateGenerator={() => setCurrentView('generator')}
            currentUser={currentUser}
          />
        );
      default:
        return <HomePage onStartGenerating={handleStartGenerating} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading LogoAI</h3>
          <p className="text-gray-400">Initializing your creative workspace...</p>
          {initError && (
            <p className="text-red-400 text-sm mt-2">{initError}</p>
          )}
        </div>
      </div>
    );
  }

  if (initError && !apiKeyManager.isInitialized()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Initialization Failed</h3>
          <p className="text-gray-400 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onShowAuth={() => setShowAuthModal(true)}
        onPurchaseCredits={handlePurchaseCredits}
        onShowAccountSettings={() => setShowAccountSettings(true)}
      />
      {renderCurrentView()}
      
      {/* API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onApiKeySet={handleApiKeySet}
          onClose={() => setShowApiKeyModal(false)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* Credits Purchase Modal */}
      {showCreditModal && (
        <CreditsPurchaseModal
          isOpen={showCreditModal}
          onClose={() => setShowCreditModal(false)}
          userEmail={currentUser?.email}
        />
      )}

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <AccountSettings
          isOpen={showAccountSettings}
          onClose={() => setShowAccountSettings(false)}
          currentUser={currentUser}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}

export default App;