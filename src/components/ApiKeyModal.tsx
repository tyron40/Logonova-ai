import React, { useState } from 'react';
import { X, Key, ExternalLink, AlertCircle, Zap, CheckCircle, Settings, Upload } from 'lucide-react';
import { apiKeyManager } from '../services/apiKeyManager';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySet: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onApiKeySet }) => {

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

          {/* Security Notice */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="font-semibold text-blue-300 mb-2">🔑 API Configuration</h4>
            <p className="text-sm text-blue-300/80 mb-3">Add your OpenAI API key to your .env file to enable logo generation.</p>
            <ul className="space-y-1 text-sm text-blue-300/70 mt-3">
              <li>• Add VITE_OPENAI_API_KEY=your_key_here to .env</li>
              <li>• Get API key from OpenAI platform</li>
              <li>• Restart development server after adding</li>
            </ul>
          </div>

          {/* Features */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg">
            <h4 className="font-semibold text-green-300 mb-2">✨ OpenAI Integration</h4>
            <p className="text-sm text-green-300/80 mb-3">Direct integration with OpenAI's DALL-E 3 and GPT models</p>
            <ul className="space-y-1 text-sm text-blue-300/70 mb-3">
              <li>• DALL-E 3 image generation</li>
              <li>• GPT-powered prompt enhancement</li>
              <li>• Contextual business analysis</li>
              <li>• Professional vector output</li>
            </ul>

            <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-400/30 rounded">
              <p className="text-xs text-yellow-400">
                💡 Need an OpenAI API key? Visit <a href="https://platform.openai.com/api-keys" target="_blank" className="underline">platform.openai.com</a>
              </p>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};