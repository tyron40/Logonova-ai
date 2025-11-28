import React, { useState, useEffect } from 'react';
import { LogoConfig } from './types';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import LogoGenerator from './components/LogoGenerator';
import { Gallery } from './components/Gallery';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AuthModal } from './components/AuthModal';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { SuccessPage } from './components/SuccessPage';
import { CreditsPurchaseModal } from './components/CreditsPurchaseModal';
import { stripeService } from './services/stripeService';
import { apiKeyManager } from './services/apiKeyManager';
import { supabaseService, supabase } from './services/supabase';
import { creditService } from './services/creditService';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'generator' | 'gallery' | 'plans' | 'success'>('home');
  const [savedLogos, setSavedLogos] = useState<LogoConfig[]>([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
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
        console.log('Starting app initialization...');
        
       // Initialize user variable
       let user = null;
       
        // Check if Supabase is properly configured
        if (!supabase) {
          console.warn('⚠️ Supabase not configured - running in local-only mode');
          setCurrentUser(null);
          setInitError(null);
        } else {
          // Only check current user if Supabase is available
          console.log('🔍 Checking current user...');
         user = await supabaseService.getCurrentUser();
          console.log('Current user:', user?.id || 'none');
          setCurrentUser(user);
        }

        // Initialize API key manager
        console.log('Initializing API key manager...');
        await apiKeyManager.initializeForUser(user?.id || null);

        // Check if we have API keys
        const hasOpenAIKey = apiKeyManager.hasApiKey('openai');
        console.log('Has OpenAI API key from .env:', hasOpenAIKey);
        setHasApiKey(hasOpenAIKey);

        // Load saved logos
        if (user) {
          console.log('Loading user logos...');
          // Load from localStorage with user prefix
          loadLocalLogos(user.id);
        } else {
          console.log('Loading local logos...');
          loadLocalLogos();
        }
        
        console.log('App initialization complete');
      } catch (error) {
        console.error('Error initializing app:', error);
        setInitError('Failed to initialize app. Please refresh the page.');
        
        // Fallback initialization
        try {
          await apiKeyManager.initializeForUser(null);
          setHasApiKey(apiKeyManager.hasApiKey('openai'));
          loadLocalLogos();
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
        console.log('Auth state changed:', event, session?.user?.id);
        const user = session?.user || null;
        setCurrentUser(user);
        
        // Reinitialize API key manager
        try {
          await apiKeyManager.initializeForUser(user?.id || null);
          
          if (user && event === 'SIGNED_IN') {
            loadLocalLogos(user.id);
          } else if (event === 'SIGNED_OUT') {
            loadLocalLogos();
          }
          
          setHasApiKey(apiKeyManager.hasApiKey('openai'));
        } catch (error) {
          console.error('Error handling auth change:', error);
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

  const loadLocalLogos = (userId?: string) => {
    try {
      console.log('Loading local logos...');
      const storageKey = userId ? `logoai-saved-logos-${userId}` : 'logoai-saved-logos';
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedLogos = JSON.parse(saved).map((logo: any) => ({
          ...logo,
          createdAt: new Date(logo.createdAt),
          companyName: logo.companyName || '',
          generatedLogos: logo.generatedLogos || [],
          selectedLogo: logo.selectedLogo || null,
          keywords: logo.keywords || [],
          description: logo.description || '',
          industry: logo.industry || 'Technology & Software',
          colorScheme: logo.colorScheme || 'royal-blue'
        }));
        setSavedLogos(parsedLogos);
        console.log('Loaded local logos:', parsedLogos.length);
      } else {
        console.log('No local logos found');
        setSavedLogos([]);
      }
    } catch (error) {
      console.error('Error loading saved logos:', error);
      setSavedLogos([]);
    }
  };

  const handleSaveLogo = async (logo: LogoConfig) => {
    try {
      // Always save locally
      const storageKey = currentUser ? `logoai-saved-logos-${currentUser.id}` : 'logoai-saved-logos';
      setSavedLogos(prev => {
        const existing = prev.find(l => l.id === logo.id);
        const updated = existing ? 
          prev.map(l => l.id === logo.id ? logo : l) : 
          [logo, ...prev];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
      
      alert('Logo configuration saved successfully!');
    } catch (error) {
      console.error('Error saving logo:', error);
      alert('Failed to save logo. Please try again.');
    }
  };

  const handleDeleteLogo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this logo configuration?')) {
      return;
    }

    try {
      // Always delete locally
      const storageKey = currentUser ? `logoai-saved-logos-${currentUser.id}` : 'logoai-saved-logos';
      setSavedLogos(prev => {
        const updated = prev.filter(logo => logo.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error deleting logo:', error);
      alert('Failed to delete logo. Please try again.');
    }
  };

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
    
    // Load user-specific data
    loadLocalLogos(user.id);
    setHasApiKey(apiKeyManager.hasApiKey('openai'));
  };

  const handleSignOut = async () => {
    try {
      await supabaseService.signOut();
      setCurrentUser(null);
      loadLocalLogos();
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
            onSaveLogo={handleSaveLogo}
            currentUser={currentUser}
            onPurchaseCredits={handlePurchaseCredits}
          />
        );
      case 'gallery':
        return <Gallery savedLogos={savedLogos} onDeleteLogo={handleDeleteLogo} />;
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
    </div>
  );
}

export default App;