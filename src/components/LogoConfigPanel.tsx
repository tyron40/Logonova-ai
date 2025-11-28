import React, { useState, useEffect } from 'react';
import { LogoConfig } from '../types';
import { logoStyles, industries, colorSchemes } from '../data/logoStyles';
import { openaiLogoService } from '../services/openaiApi';
import { apiKeyManager } from '../services/apiKeyManager';
import { Settings, Sparkles, RefreshCw, Plus, X, Palette, Briefcase, Type, Lightbulb, Wand2 } from 'lucide-react';

interface LogoConfigPanelProps {
  logoConfig: LogoConfig;
  onConfigChange: (config: LogoConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generationStep: string;
}

export const LogoConfigPanel: React.FC<LogoConfigPanelProps> = ({
  logoConfig,
  onConfigChange,
  onGenerate,
  isGenerating,
  generationStep
}) => {
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isGeneratingEnhanced, setIsGeneratingEnhanced] = useState(false);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [enhancedKeywords, setEnhancedKeywords] = useState<string[]>([]);

  const updateConfig = (updates: Partial<LogoConfig>) => {
    onConfigChange({ ...logoConfig, ...updates });
  };

  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !logoConfig.keywords.includes(keyword.trim())) {
      updateConfig({
        keywords: [...logoConfig.keywords, keyword.trim()]
      });
    }
  };

  const removeKeyword = (index: number) => {
    updateConfig({
      keywords: logoConfig.keywords.filter((_, i) => i !== index)
    });
  };

  const handleKeywordInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const input = e.target as HTMLInputElement;
      addKeyword(input.value);
      input.value = '';
    }
  };

  const generateBrandingIdeas = async () => {
    if (!logoConfig.companyName.trim()) {
      alert('Please enter a company name first');
      return;
    }

    if (!apiKeyManager.hasApiKey('openai')) {
      alert('OpenAI API key is required for AI branding ideas. Please check your .env file.');
      return;
    }

    setIsGeneratingIdeas(true);
    setSuggestedKeywords([]);
    try {
      const brandingIdeas = await openaiLogoService.generateBrandingIdeas(
        logoConfig.companyName,
        logoConfig.industry
      );
      setSuggestedKeywords(brandingIdeas);
      
      if (brandingIdeas.length === 0) {
        alert('No keywords generated. Please try again.');
      }
    } catch (error) {
      console.error('Error generating branding ideas:', error);
      alert('Failed to generate branding ideas. Please try again.');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const generateEnhancedKeywords = async () => {
    if (!logoConfig.companyName.trim()) {
      alert('Please enter a company name first');
      return;
    }

    if (!apiKeyManager.hasApiKey('openai')) {
      alert('OpenAI API key is required for AI keyword enhancement. Please check your .env file.');
      return;
    }

    setIsGeneratingEnhanced(true);
    setEnhancedKeywords([]);
    try {
      const enhancedIdeas = await openaiLogoService.generateEnhancedKeywords(
        logoConfig.companyName,
        logoConfig.industry,
        logoConfig.description || 'Professional business'
      );
      setEnhancedKeywords(enhancedIdeas);
      
      if (enhancedIdeas.length === 0) {
        alert('No enhanced keywords generated. Please try again.');
      }
    } catch (error) {
      console.error('Error generating enhanced keywords:', error);
      alert('Failed to generate enhanced keywords. Please try again.');
    } finally {
      setIsGeneratingEnhanced(false);
    }
  };

  const selectedColorScheme = colorSchemes.find(scheme => scheme.id === logoConfig.colorScheme);

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6 h-fit">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">Logo Configuration</h3>
      </div>

      <div className="space-y-6">
        {/* Company Name */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-3">
            <Type className="w-4 h-4" />
            <span>Company Name *</span>
          </label>
          <input
            type="text"
            value={logoConfig.companyName}
            onChange={(e) => updateConfig({ companyName: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
            placeholder="Enter your company name"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-3">
            <Briefcase className="w-4 h-4" />
            <span>Industry</span>
          </label>
          <select
            value={logoConfig.industry}
            onChange={(e) => updateConfig({ industry: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white transition-all"
          >
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        {/* Style */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Logo Style</span>
          </label>
          <div className="grid grid-cols-1 gap-3">
            {logoStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => updateConfig({ style: style.id })}
                className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                  logoConfig.style === style.id
                    ? 'border-blue-500 bg-blue-500/20 shadow-blue-500/20'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-900 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-sm text-white">{style.name}</div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    logoConfig.style === style.id ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {style.preview}
                  </div>
                </div>
                <div className="text-xs text-gray-400 leading-relaxed">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Scheme */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-3">
            <Palette className="w-4 h-4" />
            <span>Color Scheme</span>
          </label>
          <div className="grid grid-cols-1 gap-3">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.id}
                onClick={() => updateConfig({ colorScheme: scheme.id })}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  logoConfig.colorScheme === scheme.id
                    ? 'border-blue-500 bg-blue-500/20 shadow-blue-500/20'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-900 hover:bg-gray-800'
                }`}
              >
                <div className="flex space-x-1">
                  {scheme.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-5 h-5 rounded-full border border-gray-600"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-white">{scheme.name}</div>
                  <div className="text-xs text-gray-400">{scheme.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Brand Description
          </label>
          <textarea
            value={logoConfig.description}
            onChange={(e) => updateConfig({ description: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all resize-none"
            placeholder="Describe your brand personality, values, or what makes you unique..."
            rows={3}
          />
        </div>

        {/* Keywords */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Brand Keywords
            </label>
            <div className="flex items-center space-x-2">
              {apiKeyManager.hasApiKey('openai') && (
                <>
                  <button
                    onClick={generateBrandingIdeas}
                    disabled={isGeneratingIdeas || !logoConfig.companyName.trim()}
                    className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingIdeas ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Lightbulb className="w-3 h-3" />
                    )}
                    <span>AI Ideas</span>
                  </button>
                  <button
                    onClick={generateEnhancedKeywords}
                    disabled={isGeneratingEnhanced || !logoConfig.companyName.trim()}
                    className="flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingEnhanced ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wand2 className="w-3 h-3" />
                    )}
                    <span>AI Enhance</span>
                  </button>
                </>
              )}
            </div>
          </div>
          
          <input
            type="text"
            onKeyPress={handleKeywordInput}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
            placeholder="Press Enter to add keywords (e.g., innovative, reliable, modern)"
          />
          
          {/* AI Generated Keywords */}
          {suggestedKeywords.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-blue-400 mb-2 flex items-center space-x-1">
                <Lightbulb className="w-3 h-3" />
                <span>AI Basic Suggestions:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedKeywords.map((keyword, index) => (
                  <button
                    key={index}
                    onClick={() => addKeyword(keyword)}
                    className="inline-flex items-center space-x-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{keyword}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Enhanced AI Keywords */}
          {enhancedKeywords.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-purple-400 mb-2 flex items-center space-x-1">
                <Wand2 className="w-3 h-3" />
                <span>✨ AI Enhanced Keywords (Perfect Spelling):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {enhancedKeywords.map((keyword, index) => (
                  <button
                    key={index}
                    onClick={() => addKeyword(keyword)}
                    className="inline-flex items-center space-x-1 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs border border-purple-500/30 hover:bg-purple-500/30 transition-colors font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{keyword}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* User Keywords */}
          {logoConfig.keywords.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-gray-400 mb-2">Your Keywords:</div>
              <div className="flex flex-wrap gap-2">
                {logoConfig.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-sm border border-emerald-500/30"
                  >
                    <span>{keyword}</span>
                    <button
                      onClick={() => removeKeyword(index)}
                      className="hover:bg-emerald-500/40 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating || !logoConfig.companyName.trim() || !apiKeyManager.hasApiKey('openai')}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{generationStep || 'Creating Amazing Logos...'}</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>Generate Beautiful Logos</span>
            </>
          )}
        </button>

        {/* Generation Info */}
        {!isGenerating && (
          <div className="text-xs text-center space-y-1">
            {apiKeyManager.hasApiKey('openai') ? (
              <>
                <div className="text-green-400">✅ OpenAI API Ready - Will create 4 unique logo variations</div>
                <div className="text-blue-400">✨ Enhanced with DALL-E 3 + GPT contextual analysis</div>
                <div className="text-purple-400">🎯 Perfect spelling & real words guaranteed</div>
              </>
            ) : (
              <div className="text-red-400">⚠️ OpenAI API key required in environment variables</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};