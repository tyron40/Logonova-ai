import React, { useState } from 'react';
import { X, Key, ExternalLink, AlertCircle, Zap, CheckCircle, Settings, Upload } from 'lucide-react';
import { apiKeyManager } from '../services/apiKeyManager';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySet: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onApiKeySet }) => {
  const [activeTab, setActiveTab] = useState<'replicate' | 'gemini' | 'huggingface'>('replicate');
  const [apiKeys, setApiKeys] = useState({
    openai: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load existing API keys when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const existingKey = import.meta.env.VITE_OPENAI_API_KEY || '';
      setApiKeys({
        openai: existingKey
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentKey = apiKeys.openai;
    if (!currentKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    // Validate API key format
    if (!currentKey.startsWith('sk-')) {
      setError('OpenAI API keys should start with "sk-"');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Test the OpenAI API key
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${currentKey}`,
        },
      });
      if (!response.ok) throw new Error('Invalid OpenAI API key');

      setSuccess('OpenAI API key validated successfully! Please add it to your .env file as VITE_OPENAI_API_KEY');
      onApiKeySet(currentKey);
    } catch (error) {
      setError('Invalid API key. Please check your key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const serviceInfo = {
    title: 'OpenAI DALL-E 3 Logo Generation',
    description: 'Required for AI-powered logo generation and enhancement',
    features: ['DALL-E 3 image generation', 'GPT-powered prompt enhancement', 'Contextual business analysis', 'Professional vector output'],
    pricing: '~$0.04 per logo generation',
    getKeyUrl: 'https://platform.openai.com/api-keys'
  };

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
                <h3 className="text-xl font-bold text-white">OpenAI API Configuration</h3>
                <p className="text-sm text-gray-400">Configure your OpenAI API key for logo generation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Environment Variable Notice */}
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg">
            <h4 className="font-semibold text-yellow-300 mb-2">🔑 Environment Configuration</h4>
            <p className="text-sm text-yellow-300/80 mb-3">Add your OpenAI API key to the .env file for seamless integration.</p>
            <div className="bg-gray-900 p-3 rounded-lg text-sm text-gray-300 font-mono">
              VITE_OPENAI_API_KEY=sk-your-api-key-here
            </div>
            <ul className="space-y-1 text-sm text-yellow-300/70 mt-3">
              <li>• Secure local environment storage</li>
              <li>• No data sent to external services</li>
            </ul>
          </div>

          {/* Service Info */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="font-semibold text-blue-300 mb-2">{serviceInfo.title}</h4>
            <p className="text-sm text-blue-300/80 mb-3">{serviceInfo.description}</p>
            <ul className="space-y-1 text-sm text-blue-300/70 mb-3">
              {serviceInfo.features.map((feature, index) => (
                <li key={index}>• {feature}</li>
              ))}
            </ul>
            <p className="text-xs text-blue-400 font-medium">Pricing: {serviceInfo.pricing}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={apiKeys.openai}
                onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                placeholder="Enter your OpenAI API key (sk-...)"
                disabled={isLoading}
              />
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

            <div className="flex items-center justify-between pt-4">
              <a
                href={serviceInfo.getKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>Get OpenAI API Key</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !apiKeys.openai.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Validating...' : 'Validate API Key'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};