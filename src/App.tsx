import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import LogoGenerator from './components/LogoGenerator';
import { PricingPage } from './pages/PricingPage';
import { AuthModal } from './components/AuthModal';
import { supabase, supabaseService } from './services/supabase';
import { apiKeyManager } from './services/apiKeyManager';
import type { User } from '@supabase/supabase-js';

type View = 'home' | 'generator' | 'pricing';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (!supabase) {
        setIsLoadingAuth(false);
        apiKeyManager.initializeForUser(null);
        return;
      }

      try {
        const user = await supabaseService.getCurrentUser();
        setCurrentUser(user);
        apiKeyManager.initializeForUser(user?.id || null);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    initAuth();

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        (async () => {
          setCurrentUser(session?.user || null);
          apiKeyManager.initializeForUser(session?.user?.id || null);
        })();
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleSignOut = async () => {
    await supabaseService.signOut();
    setCurrentUser(null);
    apiKeyManager.initializeForUser(null);
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header
        currentView={currentView === 'home' || currentView === 'pricing' ? 'home' : 'generator'}
        onViewChange={(view) => setCurrentView(view === 'home' ? 'home' : 'generator')}
        currentUser={currentUser}
        onAuthClick={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
      />

      {currentView === 'home' && (
        <HomePage
          onStartGenerating={() => setCurrentView('generator')}
          onViewPlans={() => setCurrentView('pricing')}
        />
      )}

      {currentView === 'generator' && (
        <div className="pt-20">
          <LogoGenerator currentUser={currentUser} onAuthRequired={() => setShowAuthModal(true)} />
        </div>
      )}

      {currentView === 'pricing' && (
        <div className="pt-20">
          <PricingPage currentUser={currentUser} onAuthRequired={() => setShowAuthModal(true)} />
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
