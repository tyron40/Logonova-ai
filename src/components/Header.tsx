import React from 'react';
import { Sparkles, Menu, X } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'generator';
  onViewChange: (view: 'home' | 'generator') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'home' as const, label: 'Home' },
    { id: 'generator' as const, label: 'Generator' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card-dark border-b border-slate-700/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3 cursor-pointer mobile-optimized mobile-button hover-scale" onClick={() => onViewChange('home')}>
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              LogoAI
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 mobile-optimized mobile-button ${
                  currentView === item.id
                    ? 'gradient-primary text-white shadow-glow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-slate-700/50 transition-colors text-slate-300 mobile-optimized mobile-button"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700/50">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`px-4 py-3 text-left rounded-lg font-medium transition-all duration-200 mobile-optimized mobile-button ${
                    currentView === item.id
                      ? 'gradient-primary text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};