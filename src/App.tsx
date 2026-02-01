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
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Coins, Zap } from 'lucide-react';
import { Credits } from './pages/Credits';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { CreditBalance } from './components/CreditBalance';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center gap-2">
                  <Zap className="w-8 h-8 text-indigo-600" />
                  <span className="text-xl font-bold text-gray-900">LogoNova</span>
                </Link>
              </div>
              
              <div className="flex items-center gap-6">
                {user ? (
                  <>
                    <CreditBalance userId={user.id} />
                    <Link
                      to="/credits"
                      className="text-gray-700 hover:text-indigo-600 font-medium flex items-center gap-1"
                    >
                      <Coins className="w-4 h-4" />
                      Buy Credits
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={async () => {
                      await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo: window.location.origin
                        }
                      });
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage user={user} />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/success" element={<PaymentSuccess />} />
        </Routes>
      </div>
    </Router>
  );
}

function HomePage({ user }: { user: any }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Create Amazing Logos with AI
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Generate professional logos in seconds using our AI-powered platform. 
          Purchase credits and start creating today.
        </p>
        
        {user ? (
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/credits"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-lg font-semibold"
            >
              Buy Credits
            </Link>
          </div>
        ) : (
          <button
            onClick={async () => {
              await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: window.location.origin
                }
              });
            }}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-lg font-semibold"
          >
            Get Started
          </button>
        )}
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Generation</h3>
          <p className="text-gray-600">Create professional logos in seconds with our AI technology.</p>
        </div>
        
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Coins className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Flexible Pricing</h3>
          <p className="text-gray-600">Pay only for what you use with our credit-based system.</p>
        </div>
        
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">High Quality</h3>
          <p className="text-gray-600">Get professional-grade logos ready for commercial use.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
