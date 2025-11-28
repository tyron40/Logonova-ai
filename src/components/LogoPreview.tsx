import React from 'react';
import { LogoConfig, GeneratedLogo } from '../types';
import { RefreshCw, Download, Heart, Check } from 'lucide-react';

interface LogoPreviewProps {
  logoConfig: LogoConfig;
  onSelectLogo: (logo: GeneratedLogo) => void;
  isGenerating: boolean;
  generationStep: string;
}

export const LogoPreview: React.FC<LogoPreviewProps> = ({
  logoConfig,
  onSelectLogo,
  isGenerating,
  generationStep
}) => {
  if (isGenerating) {
    return (
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="w-8 h-8 text-white animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Creating Your Logos
          </h3>
          <p className="text-gray-300 mb-6">{generationStep}</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!logoConfig.companyName.trim()) {
    return (
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎨</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Ready to Create Your Logo?
          </h3>
          <p className="text-gray-300">
            Fill in your company details and click "Generate Logos" to see AI-created designs
          </p>
        </div>
      </div>
    );
  }

  if (logoConfig.generatedLogos.length === 0) {
    return (
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Generate Your First Logo
          </h3>
          <p className="text-gray-300">
            Click "Generate Logos" to create unique designs for {logoConfig.companyName}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected Logo Preview */}
      {logoConfig.selectedLogo && (
        <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">Selected Logo</h3>
            <p className="text-gray-300">Your chosen design for {logoConfig.companyName}</p>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="bg-gray-900 rounded-xl p-8 border-2 border-dashed border-gray-600">
              <img
                src={logoConfig.selectedLogo.imageUrl}
                alt={`Logo for ${logoConfig.companyName}`}
                className="max-w-xs max-h-48 object-contain"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-medium text-white">Style</div>
              <div className="text-gray-400 capitalize">{logoConfig.selectedLogo.style}</div>
            </div>
            <div>
              <div className="font-medium text-white">Industry</div>
              <div className="text-gray-400">{logoConfig.selectedLogo.industry}</div>
            </div>
            <div>
              <div className="font-medium text-white">Colors</div>
              <div className="flex justify-center space-x-1 mt-1">
                {logoConfig.selectedLogo.colors.slice(0, 3).map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-gray-600"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium text-white">Created</div>
              <div className="text-gray-400">
                {new Date(logoConfig.selectedLogo.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logo Variations */}
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Generated Variations ({logoConfig.generatedLogos.length})
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {logoConfig.generatedLogos.map((logo) => (
            <button
              key={logo.id}
              onClick={() => onSelectLogo(logo)}
              className={`relative group p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                logoConfig.selectedLogo?.id === logo.id
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-900'
              }`}
            >
              <div className="aspect-square bg-gray-900 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                <img
                  src={logo.imageUrl}
                  alt={`Logo variation for ${logo.companyName}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              <div className="text-xs text-gray-400 capitalize mb-2">
                {logo.style} Style
              </div>
              
              {logoConfig.selectedLogo?.id === logo.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-medium">Select</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};