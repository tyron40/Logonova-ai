import React, { useState } from 'react';
import { Wand2, Download, Loader2, Sparkles, RefreshCw, Lightbulb, Eye, X } from 'lucide-react';
import { openaiLogoService } from '../services/openaiApi';
import type { User } from '@supabase/supabase-js';

interface LogoGeneratorProps {
  currentUser: User | null;
  onAuthRequired: () => void;
}

export default function LogoGenerator({ currentUser, onAuthRequired }: LogoGeneratorProps) {
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('modern');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [customColors, setCustomColors] = useState(['#3b82f6']);
  const [logoUrl, setLogoUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Simple options

  const styles = [
    { value: 'modern', label: 'Modern' },
    { value: 'classic', label: 'Classic' },
    { value: 'creative', label: 'Creative' },
    { value: 'minimal', label: 'Minimal' }
  ];

  const colors = [
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'green', label: 'Green', color: '#10b981' },
    { value: 'purple', label: 'Purple', color: '#8b5cf6' },
    { value: 'orange', label: 'Orange', color: '#f59e0b' },
    { value: 'red', label: 'Red', color: '#ef4444' },
    { value: 'black', label: 'Black', color: '#1f2937' },
    { value: 'custom', label: 'Custom', color: '#3b82f6' }
  ];

  const getEffectiveColor = () => {
    return selectedColor === 'custom' ? customColors.join(',') : selectedColor;
  };

  const addCustomColor = () => {
    setCustomColors([...customColors, '#3b82f6']);
  };

  const removeCustomColor = (index: number) => {
    if (customColors.length > 1) {
      setCustomColors(customColors.filter((_, i) => i !== index));
    }
  };

  const updateCustomColor = (index: number, color: string) => {
    const newColors = [...customColors];
    newColors[index] = color;
    setCustomColors(newColors);
  };

  const handleGenerate = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name');
      return;
    }

    if (!currentUser) {
      onAuthRequired();
      return;
    }

    setError('');
    setIsGenerating(true);

    try {
      const logoRequest = {
        companyName: companyName.trim(),
        description: description.trim() || 'Professional business',
        style,
        colorScheme: getEffectiveColor(),
        keywords: [style, selectedColor, 'professional', 'clean'],
        industry: 'Professional Services'
      };

      const logoUrl = await openaiLogoService.generateLogo(logoRequest);
      setLogoUrl(logoUrl);
      setError('');
    } catch (error) {
      console.error('Error generating logo:', error);
      let errorMessage = 'Failed to generate logo. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('logged in') || error.message.includes('sign in')) {
          onAuthRequired();
          return;
        } else if (error.message.includes('Insufficient credits')) {
          errorMessage = 'Insufficient credits. Please purchase more credits to continue generating logos.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to AI service. Please check your internet connection.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'AI service is busy. Please wait a moment and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const enhanceDescription = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name first');
      return;
    }

    if (!currentUser) {
      onAuthRequired();
      return;
    }

    setIsEnhancing(true);
    setError('');

    try {
      const enhanced = await openaiLogoService.generateBusinessKeywords(
        companyName.trim(),
        description.trim() || 'Professional business'
      );

      setDescription(enhanced);
    } catch (error) {
      console.error('Error enhancing description:', error);
      if (error instanceof Error && (error.message.includes('logged in') || error.message.includes('sign in'))) {
        onAuthRequired();
      } else {
        setError(error instanceof Error ? error.message : 'Failed to enhance description');
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleDownload = async () => {
    if (!logoUrl) return;

    try {
      const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_logo.png`;

      // Use proxy endpoint to avoid CORS issues
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
      const proxyUrl = `${apiBaseUrl}/api/download-logo?url=${encodeURIComponent(logoUrl)}`;

      // Fetch through proxy
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error('Failed to download image');
      }

      const blob = await response.blob();

      // Create a blob URL
      const blobUrl = URL.createObjectURL(blob);

      // Create a temporary download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);

    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download logo. Please try again or right-click the image to save it manually.');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* Simple Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Create Your Logo
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Generate a professional logo in seconds with AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Simple Form */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl p-8 border border-gray-700/50">
            <div className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="block text-white font-medium mb-3">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter your business name"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-white font-medium">
                  Describe your business
                  </label>
                  <button
                    onClick={enhanceDescription}
                    disabled={isEnhancing || !companyName.trim()}
                    className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEnhancing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enhancing...</span>
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-4 h-4" />
                        <span>✨ AI Enhance</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does your business do? (or click AI Enhance)"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 resize-none transition-all mobile-input mobile-text"
                />
              </div>


              {/* Style */}
              <div>
                <label className="block text-white font-medium mb-3">
                  Logo Style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {styles.map((styleOption) => (
                    <button
                      key={styleOption.value}
                      onClick={() => setStyle(styleOption.value)}
                      className={`p-4 rounded-xl text-left transition-all mobile-optimized mobile-button ${
                        style === styleOption.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <span className="font-medium">{styleOption.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-white font-medium mb-3">
                  Primary Color
                </label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {colors.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      onClick={() => setSelectedColor(colorOption.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all mobile-optimized mobile-button ${
                        selectedColor === colorOption.value
                          ? 'bg-gray-600 ring-2 ring-blue-400'
                          : 'bg-gray-700/50 hover:bg-gray-700'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white/20"
                        style={{ 
                          backgroundColor: colorOption.value === 'custom' 
                            ? customColors[0] 
                            : colorOption.color 
                        }}
                      />
                      <span className="text-white font-medium">{colorOption.label}</span>
                    </button>
                  ))}
                </div>
                
                {/* Custom Color Picker */}
                {selectedColor === 'custom' && (
                  <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
                    <label className="block text-white font-medium mb-2">
                      Choose Custom Colors
                    </label>
                    <div className="space-y-3">
                      {customColors.map((color, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => updateCustomColor(index, e.target.value)}
                            className="w-12 h-12 rounded-lg border-2 border-gray-600 bg-transparent cursor-pointer mobile-optimized"
                          />
                          <input
                            type="text"
                            value={color}
                            onChange={(e) => updateCustomColor(index, e.target.value)}
                            placeholder="#3b82f6"
                            className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 font-mono text-sm mobile-input"
                          />
                          {customColors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCustomColor(index)}
                              className="w-10 h-10 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors mobile-optimized mobile-button"
                              title="Remove color"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addCustomColor}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors mobile-optimized mobile-button"
                      >
                        <span>+</span>
                        Add Another Color
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      Add multiple colors to create a gradient or palette (e.g., #ff5722, #ffd700)
                   </p>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !companyName.trim()}
               className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 mobile-optimized mobile-button"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Creating Your Logo...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6" />
                    <span>Generate Logo</span>
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Logo Display */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl p-8 border border-gray-700/50">
            {logoUrl ? (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-6">Your Logo</h3>

                <div className="relative group bg-white rounded-2xl p-8 mb-6 inline-block cursor-pointer" onClick={() => setShowPreview(true)}>
                  <img
                    src={logoUrl}
                    alt={`Logo for ${companyName}`}
                    className="w-full max-w-sm mx-auto"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                    <Eye className="w-12 h-12 text-white" />
                  </div>
                </div>

                <div className="flex gap-4 justify-center flex-wrap">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors download-button mobile-optimized mobile-button"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      handleGenerate();
                    }}
                    disabled={isGenerating || !companyName.trim()}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mobile-optimized mobile-button"
                  >
                    <RefreshCw className="w-5 h-5" />
                    {isGenerating ? 'Generating...' : 'New Logo'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Ready to Create?
                </h3>
                <p className="text-gray-400">
                  Fill in your company details and click "Generate Logo" to create your professional logo
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Preview Modal */}
      {showPreview && logoUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="relative bg-gray-800 rounded-2xl max-w-4xl w-full p-8" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-gray-700 hover:bg-gray-600 rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">
                {companyName}
              </h2>
              <p className="text-gray-400 capitalize">{style} Style</p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="bg-white p-12 rounded-xl shadow-2xl max-w-2xl">
                <img
                  src={logoUrl}
                  alt={`Logo for ${companyName}`}
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  handleDownload();
                  setShowPreview(false);
                }}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors download-button mobile-optimized mobile-button"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}