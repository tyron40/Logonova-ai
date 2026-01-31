import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import LogoGenerator from './components/LogoGenerator';
import { PricingPage } from './pages/PricingPage';
import { apiKeyManager } from './services/apiKeyManager';

type View = 'home' | 'generator' | 'pricing';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  useEffect(() => {
    apiKeyManager.initializeForUser(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header
        currentView={currentView === 'home' || currentView === 'pricing' ? 'home' : 'generator'}
        onViewChange={(view) => setCurrentView(view === 'home' ? 'home' : 'generator')}
      />

      {currentView === 'home' && (
        <HomePage
          onStartGenerating={() => setCurrentView('generator')}
          onViewPlans={() => setCurrentView('pricing')}
        />
      )}

      {currentView === 'generator' && (
        <div className="pt-20">
          <LogoGenerator />
        </div>
      )}

      {currentView === 'pricing' && (
        <div className="pt-20">
          <PricingPage />
        </div>
      )}
    </div>
  );
}

export default App;
