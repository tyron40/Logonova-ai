import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { supabaseService } from '../services/supabase';
import type { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔐 Authentication attempt:', { isSignUp, email });
    
    if (!email.trim() || !password.trim() || (isSignUp && !username.trim())) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (isSignUp && username.trim().length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    // Check if Supabase is available
    if (!supabaseService.isAvailable()) {
      setError('Authentication service not available. Please check your configuration.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      let result;

      if (isSignUp) {
        result = await supabaseService.signUp(email, password, username.trim());
        if (result.error) {
          throw result.error;
        }

        // Check if email confirmation is disabled
        if (result.data.user && !result.data.user.email_confirmed_at) {
          setSuccess('Account created successfully! You can now sign in.');
        } else {
          setSuccess('Account created successfully! Please check your email to verify your account.');
        }
      } else {
        result = await supabaseService.signIn(email, password);
        if (result.error) {
          throw result.error;
        }

        if (result.data.user && result.data.session) {
          // Wait a moment to ensure session is persisted to storage
          await new Promise(resolve => setTimeout(resolve, 100));
          onAuthSuccess(result.data.user);
          onClose();
        } else if (!result.data.session) {
          throw new Error('Sign in succeeded but session was not created. Please try again or clear your browser cache.');
        } else {
          throw new Error('Sign in succeeded but user data is missing. Please try again.');
        }
      }
    } catch (error: any) {
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'An error occurred';
      
      if (errorMessage.includes('Cannot connect to Supabase')) {
        errorMessage = 'Cannot connect to authentication service. Please check your internet connection and try again.';
      } else if (errorMessage.includes('Supabase not configured')) {
        errorMessage = 'Authentication service not configured. Please check the application setup.';
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      } else if (errorMessage.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Try signing in instead.';
      } else if (errorMessage.includes('signup_disabled')) {
        errorMessage = 'New signups are currently disabled. Please contact support.';
      } else if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Network error: Cannot reach authentication service. Please check your connection.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        <div className="relative bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 border border-gray-700 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                {isSignUp ? <UserPlus className="w-5 h-5 text-white" /> : <LogIn className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </h3>
                <p className="text-sm text-gray-400">
                  {isSignUp ? 'Join LogoAI today' : 'Welcome back to LogoAI'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Benefits */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-2">🚀 Account Benefits</p>
              <ul className="space-y-1 text-blue-300/80">
                <li>• Save and manage your logos</li>
                <li>• Access logo history</li>
                <li>• Personalized experience</li>
                <li>• Purchase credits as needed</li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 mobile-input"
                    placeholder="Choose a username"
                    disabled={isLoading}
                    autoComplete="username"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Username must be at least 2 characters
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 mobile-input"
                  placeholder="your@email.com"
                  disabled={isLoading}
                  autoComplete="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 mobile-input"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
              </div>
              {isSignUp && (
                <p className="mt-1 text-xs text-gray-400">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mobile-button touch-manipulation"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={toggleMode}
                className="ml-1 text-blue-400 hover:text-blue-300 font-medium transition-colors touch-manipulation"
                disabled={isLoading}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          {/* Guest Mode */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-300 transition-colors mobile-button touch-manipulation"
              disabled={isLoading}
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};