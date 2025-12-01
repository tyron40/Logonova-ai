import React, { useState } from 'react';
import { X, Key, ExternalLink, AlertCircle, Zap, CheckCircle, Settings, Upload, Loader2 } from 'lucide-react';
import { apiKeyManager } from '../services/apiKeyManager';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySet: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const serviceInfo = {
    pricing: 'Pay-per-use with OpenAI API'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      setError('OpenAI API keys should start with "sk-"');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await apiKeyManager.setApiKey('openai', apiKey.trim());
      setSuccess('API key saved successfully!');
      onApiKeySet(apiKey.trim());
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error setting API key:', error);
      setError(error instanceof Error ? error.message : 'Failed to save API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">API Configuration</h3>
                <p className="text-sm text-gray-400">API keys are now managed securely by the backend</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* API Key Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                OpenAI API Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="sk-..."
                  disabled={isSubmitting}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Your API key is stored locally and used for direct OpenAI API calls
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-400">{success}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !apiKey.trim()}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Save API Key</span>
                </>
              )}
            </button>
          </form>

          {/* Features */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="font-semibold text-blue-300 mb-2">AI Logo Generation</h4>
            <p className="text-sm text-blue-300/80 mb-3">Secure AI-powered logo generation and enhancement</p>
            <ul className="space-y-1 text-sm text-blue-300/70 mb-3">
              <li>• DALL-E 3 image generation</li>
              <li>• GPT-powered prompt enhancement</li>
              <li>• Contextual business analysis</li>
              <li>• Professional vector output</li>
            </ul>
            <p className="text-xs text-blue-400 font-medium">Pricing: {serviceInfo.pricing}</p>
          </div>

          {/* Information */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="font-semibold text-blue-300 mb-2">🔑 OpenAI API Key Required</h4>
            <p className="text-sm text-blue-300/80 mb-3">Add your OpenAI API key to generate logos with DALL-E 3</p>
            <ul className="space-y-1 text-sm text-blue-300/70 mb-3">
              <li>• Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">OpenAI Platform</a></li>
              <li>• Keys are stored locally in your browser</li>
              <li>• Used for direct API calls to OpenAI</li>
            </ul>
            {!isSubmitting && (
              <div>
                <p className="text-sm text-green-300/80 mb-3">You can also add API keys to your .env file:</p>
                <ul className="space-y-1 text-sm text-blue-300/70">
                  <li>• Add <code className="bg-gray-700 px-1 rounded">VITE_OPENAI_API_KEY=your_key_here</code></li>
                  <li>• Restart the development server</li>
                </ul>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
          >
            {success ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};