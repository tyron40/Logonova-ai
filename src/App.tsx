import { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import LogoGenerator from './components/LogoGenerator';
import { supabase } from './services/supabase';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Coins, Zap } from 'lucide-react';
import { Credits } from './pages/Credits';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { CreditBalance } from './components/CreditBalance';

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

  return (
    <Router>
      <AppContent user={user} />
    </Router>
  );
}

function AppContent({ user }: { user: any }) {
  const navigate = useNavigate();

  return (
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
                    to="/generate"
                    className="text-gray-700 hover:text-indigo-600 font-medium"
                  >
                    Generate
                  </Link>
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
        <Route
          path="/"
          element={
            <HomePage
              onStartGenerating={() => navigate(user ? '/generate' : '/credits')}
              onViewPlans={() => navigate('/credits')}
            />
          }
        />
        <Route
          path="/generate"
          element={
            <LogoGenerator
              currentUser={user}
              onAuthRequired={() => {
                supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: window.location.origin + '/generate'
                  }
                });
              }}
            />
          }
        />
        <Route path="/credits" element={<Credits />} />
        <Route path="/success" element={<PaymentSuccess />} />
      </Routes>
    </div>
  );
}

export default App;
