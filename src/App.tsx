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
      // Set a maximum timeout for initialization (5 seconds)
      const initTimeout = setTimeout(() => {
        console.warn('Initialization timeout - forcing app to load');
        setIsLoading(false);
      }, 5000);

      try {
        let user = null;

        // Check if Supabase is properly configured
        if (supabase) {
          try {
            // Only check current user if Supabase is available
            user = await supabaseService.getCurrentUser();
            setCurrentUser(user);
          } catch (userError) {
            console.warn('Could not fetch user, continuing without auth:', userError);
          }
        }

        // Initialize API key manager
        try {
          await apiKeyManager.initializeForUser(user?.id || null);
          const hasOpenAIKey = apiKeyManager.hasApiKey('openai');
          setHasApiKey(hasOpenAIKey);
        } catch (apiKeyError) {
          console.warn('API key initialization failed, continuing:', apiKeyError);
          setHasApiKey(false);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        // Don't block the app from loading, just log the error
        setHasApiKey(false);
      } finally {
        // Clear the timeout and always set loading to false
        clearTimeout(initTimeout);
        setIsLoading(false);
      }
    };

    initializeApp();

    // Listen for auth changes
    let subscription: any = null;

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user || null;

        // Only sign out on explicit SIGNED_OUT event
        // Don't sign out on other events where user might be null temporarily
        if (event === 'SIGNED_OUT') {
          await supabaseService.signOut();
        }

        setCurrentUser(user);

        // Reinitialize API key manager on meaningful auth state changes
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          try {
            await apiKeyManager.initializeForUser(user?.id || null);
            setHasApiKey(apiKeyManager.hasApiKey('openai'));
          } catch (error) {
            setHasApiKey(apiKeyManager.hasApiKey('openai'));
          }
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