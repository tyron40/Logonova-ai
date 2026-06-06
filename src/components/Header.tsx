import React, { useState } from 'react';
import { LogOut, User, Settings, Wand2, Home, ChevronDown, Sparkles } from 'lucide-react';
import { CreditDisplay } from './CreditDisplay';

interface HeaderProps {
  currentView: 'home' | 'generator' | 'plans' | 'success';
  onViewChange: (view: 'home' | 'generator' | 'plans' | 'success') => void;
  currentUser: any | null;
  onSignOut: () => void;
  onShowAuth: () => void;
  onPurchaseCredits: () => void;
  onShowAccountSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  currentUser,
  onSignOut,
  onShowAuth,
  onPurchaseCredits,
  onShowAccountSettings,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems: { view: 'home' | 'generator'; label: string; icon: React.ReactNode }[] = [
    { view: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { view: 'generator', label: 'Generate', icon: <Wand2 className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onViewChange('home')}
            className="flex items-center space-x-2 group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">LogoAI</span>
          </button>

          {/* Nav */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(({ view, label, icon }) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === view
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <>
                <CreditDisplay
                  currentUser={currentUser}
                  onPurchaseClick={onPurchaseCredits}
                  compact
                />

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="hidden sm:block text-sm text-gray-300 max-w-[120px] truncate">
                      {currentUser.email}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl border border-gray-700 shadow-xl z-20 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-700">
                          <p className="text-xs text-gray-400">Signed in as</p>
                          <p className="text-sm text-white font-medium truncate">{currentUser.email}</p>
                        </div>
                        <button
                          onClick={() => { onShowAccountSettings(); setShowUserMenu(false); }}
                          className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Account Settings</span>
                        </button>
                        <button
                          onClick={() => { onSignOut(); setShowUserMenu(false); }}
                          className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onShowAuth}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={onShowAuth}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
