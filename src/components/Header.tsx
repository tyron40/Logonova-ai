import React from 'react';
import { Sparkles, Menu, X, User, LogOut, LogIn, Settings } from 'lucide-react';
import { CreditDisplay } from './CreditDisplay';
import type { User as UserType } from '../types';

interface HeaderProps {
  currentView: 'home' | 'generator';
  onViewChange: (view: 'home' | 'generator') => void;
  currentUser: UserType | null;
  onSignOut: () => void;
  onShowAuth: () => void;
  onPurchaseCredits?: () => void;
  onShowAccountSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  currentUser,
  onSignOut,
  onShowAuth,
  onPurchaseCredits,
  onShowAccountSettings
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const navItems = [
    { id: 'home' as const, label: 'Home' },
    { id: 'generator' as const, label: 'Generator' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card-dark border-b border-slate-700/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer mobile-optimized mobile-button hover-scale" onClick={() => onViewChange('home')}>
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              LogoAI
            </span>
          </div>

          {/* Desktop Navigation */}
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

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser && onPurchaseCredits && (
              <CreditDisplay 
                currentUser={currentUser}
                onPurchaseClick={onPurchaseCredits}
                compact={true}
              />
            )}
            
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 glass-card hover:bg-slate-700/50 px-4 py-2 rounded-xl transition-colors mobile-optimized mobile-button"
                >
                  <div className="w-6 h-6 gradient-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-slate-300">{currentUser.user_metadata?.username || currentUser.email}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 glass-card-dark rounded-xl shadow-2xl border border-slate-600/50 py-2">
                    <div className="px-4 py-2 border-b border-slate-600/50">
                      <p className="text-sm font-medium text-white">Signed in as</p>
                      <p className="text-xs text-slate-400 truncate">{currentUser.user_metadata?.username || currentUser.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        onShowAccountSettings?.();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-600/50 hover:text-white transition-colors mobile-optimized mobile-button"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        onSignOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-600/50 hover:text-white transition-colors mobile-optimized mobile-button"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onShowAuth}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors mobile-optimized mobile-button"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-slate-700/50 transition-colors text-slate-300 mobile-optimized mobile-button"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
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
              
              {/* Mobile Auth */}
              <div className="pt-4 border-t border-slate-600/50">
                {currentUser && (
                  <div className="mb-4">
                    <div className="text-sm text-slate-300 px-4 py-2">
                      Welcome, {currentUser.user_metadata?.username || currentUser.email}
                    </div>
                  </div>
                )}
                
                {currentUser ? (
                  <div className="space-y-2">
                    <div className="px-4 py-2">
                      <p className="text-sm text-slate-400">Signed in as</p>
                      <p className="text-sm text-white truncate">{currentUser.user_metadata?.username || currentUser.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        onShowAccountSettings?.();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors mobile-optimized mobile-button"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        onSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors mobile-optimized mobile-button"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onShowAuth();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium mobile-optimized mobile-button"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};