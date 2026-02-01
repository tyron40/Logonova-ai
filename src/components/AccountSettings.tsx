import React, { useState, useEffect } from 'react';
import { X, Key, Trash2, AlertTriangle, Lock, User, Shield, CheckCircle } from 'lucide-react';
import { supabaseService } from '../services/supabase';
import { apiKeyManager } from '../services/apiKeyManager';

interface AccountSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onSignOut: () => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignOut
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isUpdatingApiKey, setIsUpdatingApiKey] = useState(false);
  const [hasOpenaiKey, setHasOpenaiKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasOpenaiKey(apiKeyManager.hasApiKey('openai'));
    }
  }, [isOpen]);

  const handleApiKeyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!openaiApiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    if (!openaiApiKey.startsWith('sk-')) {
      setError('OpenAI API keys should start with "sk-"');
      return;
    }

    setIsUpdatingApiKey(true);
    setError('');
    setSuccess('');

    try {
      await apiKeyManager.setApiKey('openai', openaiApiKey.trim());
      setSuccess('OpenAI API key saved successfully!');
      setHasOpenaiKey(true);
      setOpenaiApiKey('');
    } catch (error: any) {
      console.error('API key update error:', error);
      setError(error.message || 'Failed to save API key');
    } finally {
      setIsUpdatingApiKey(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!supabaseService.isAvailable()) {
      setError('Authentication service not available. Please check your configuration.');
      return;
    }

    setIsChangingPassword(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabaseService.updatePassword(newPassword);
      
      if (updateError) {
        throw updateError;
      }
      
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error);
      setError(error.message || 'Failed to update password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type "DELETE" to confirm account deletion');
      return;
    }

    if (!supabaseService.isAvailable()) {
      setError('Authentication service not available. Please check your configuration.');
      return;
    }

    setIsDeletingAccount(true);
    setError('');

    try {
      const result = await supabaseService.requestAccountDeletion();
      
      if (result.success) {
        alert(result.message);
        onSignOut();
        onClose();
      }
    } catch (error: any) {
      console.error('Account deletion error:', error);
      setError(error.message || 'Failed to delete account. Please try again or contact support.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setDeleteConfirmText('');
    setError('');
    setSuccess('');
    setShowDeleteConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-gray-700 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Account Settings</h3>
                <p className="text-sm text-gray-400">Manage your account security and preferences</p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* User Info */}
          <div className="mb-8 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white">{currentUser?.user_metadata?.username || 'User'}</h4>
                <p className="text-sm text-blue-300">{currentUser?.email}</p>
                <p className="text-xs text-blue-300/70">
                  Member since {new Date(currentUser?.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          {/* API Key Management Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Key className="w-5 h-5 text-purple-400" />
              <h4 className="text-lg font-semibold text-white">OpenAI API Key</h4>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-300 mb-2">
                Add your own OpenAI API key to use AI-powered features like logo generation and business description enhancement.
              </p>
              <p className="text-xs text-purple-300/70">
                Your API key is stored securely and only used for your requests.
              </p>
            </div>

            {hasOpenaiKey && (
              <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-400">OpenAI API key is configured</p>
              </div>
            )}

            <form onSubmit={handleApiKeyUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {hasOpenaiKey ? 'Update OpenAI API Key' : 'OpenAI API Key'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="sk-..."
                    disabled={isUpdatingApiKey}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">platform.openai.com/api-keys</a>
                </p>
              </div>

              <button
                type="submit"
                disabled={isUpdatingApiKey || !openaiApiKey}
                className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {isUpdatingApiKey ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5" />
                    <span>{hasOpenaiKey ? 'Update API Key' : 'Save API Key'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Change Password Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Lock className="w-5 h-5 text-blue-400" />
              <h4 className="text-lg font-semibold text-white">Change Password</h4>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Enter new password"
                    disabled={isChangingPassword}
                    minLength={6}
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Confirm new password"
                    disabled={isChangingPassword}
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {isChangingPassword ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Delete Account Section */}
          <div className="border-t border-gray-700 pt-8">
            <div className="flex items-center space-x-2 mb-4">
              <Trash2 className="w-5 h-5 text-red-400" />
              <h4 className="text-lg font-semibold text-white">Danger Zone</h4>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
              <h5 className="font-medium text-red-300 mb-2">Delete Account</h5>
              <p className="text-sm text-red-300/80 mb-4">
                Once you delete your account, there is no going back. This will permanently delete your:
              </p>
              <ul className="text-sm text-red-300/80 mb-6 space-y-1">
                <li>• Account profile and settings</li>
                <li>• All saved logos and configurations</li>
                <li>• Credit history and transactions</li>
                <li>• Any subscription data</li>
              </ul>

              {!showDeleteConfirmation ? (
                <button
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Account</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-red-300 mb-2">
                      Type "DELETE" to confirm account deletion:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border border-red-500/50 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-red-400/50"
                      placeholder="Type DELETE to confirm"
                      disabled={isDeletingAccount}
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleAccountDeletion}
                      disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
                      className="flex items-center justify-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeletingAccount ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-5 h-5" />
                          <span>Permanently Delete Account</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowDeleteConfirmation(false);
                        setDeleteConfirmText('');
                        setError('');
                      }}
                      disabled={isDeletingAccount}
                      className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};