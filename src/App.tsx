import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import LogoGenerator from './components/LogoGenerator';
import { PricingPage } from './pages/PricingPage';
import { SuccessPage } from './pages/SuccessPage';
import { AuthModal } from './components/AuthModal';
import { AccountSettings } from './components/AccountSettings';
import { CreditsPurchaseModal } from './components/CreditsPurchaseModal';
import { supabase } from './services/supabase';
import { apiKeyManager } from './services/apiKeyManager';
import type { User } from '@supabase/supabase-js';

type View = 'home' | 'generator' | 'pricing' | 'success';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showCreditsPurchase, setShowCreditsPurchase] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          await apiKeyManager.initializeForUser(currentUser?.id ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Initialization timeout - forcing app to load');
        setLoading(false);
      }
    }, 5000);

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          await apiKeyManager.initializeForUser(currentUser?.id ?? null);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header
        currentView={currentView === 'home' || currentView === 'pricing' || currentView === 'success' ? 'home' : 'generator'}
        onViewChange={(view) => setCurrentView(view === 'home' ? 'home' : 'generator')}
        currentUser={user}
        onSignOut={handleSignOut}
        onShowAuth={() => setShowAuthModal(true)}
        onPurchaseCredits={() => setShowCreditsPurchase(true)}
        onShowAccountSettings={() => setShowAccountSettings(true)}
      />

      {currentView === 'home' && (
        <HomePage
          onStartGenerating={() => setCurrentView('generator')}
          onViewPlans={() => setCurrentView('pricing')}
        />
      )}

      {currentView === 'generator' && (
        <div className="pt-20">
          <LogoGenerator
            currentUser={user}
            onPurchaseCredits={() => setShowCreditsPurchase(true)}
          />
        </div>
      )}

      {currentView === 'pricing' && (
        <div className="pt-20">
          <PricingPage />
        </div>
      )}

      {currentView === 'success' && (
        <div className="pt-20">
          <SuccessPage />
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(newUser) => {
            setUser(newUser);
            setShowAuthModal(false);
          }}
        />
      )}

      {showAccountSettings && user && (
        <AccountSettings
          user={user}
          onClose={() => setShowAccountSettings(false)}
        />
      )}

      {showCreditsPurchase && user && (
        <CreditsPurchaseModal
          user={user}
          onClose={() => setShowCreditsPurchase(false)}
        />
      )}
    </div>
  );
}

export default App;
