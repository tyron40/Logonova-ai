import React, { useState } from 'react';
import { Wand2, Download, Loader2, Sparkles, Save, RefreshCw, Lightbulb } from 'lucide-react';
import { trpcLogoService } from '../services/trpc';
import { SubscriptionPlans } from './SubscriptionPlans';
import { CreditDisplay } from './CreditDisplay';
import { creditService } from '../services/creditService';
import { LogoConfig, GeneratedLogo } from '../types';

interface LogoGeneratorProps {
  onSaveLogo: (logo: LogoConfig) => void;
  currentUser?: any;
  onPurchaseCredits: () => void;
}

export default function LogoGenerator({ 
  onSaveLogo, 
  currentUser,
  onPurchaseCredits
}: LogoGeneratorProps) {
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('modern');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [customColors, setCustomColors] = useState(['#3b82f6']);
  const [logoUrl, setLogoUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState('');
  const [credits, setCredits] = useState(0);

  // Update credits when user changes
  React.useEffect(() => {
    updateCredits();
  }, [currentUser]);

  const updateCredits = () => {
    const balance = creditService.getCreditBalance(currentUser?.id);
    setCredits(balance);
  };

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

    // Check credits first
    const requiredCredits = 1; // 1 credit per logo generation
    if (!creditService.hasEnoughCredits(requiredCredits, currentUser?.id)) {
      setError(`Insufficient credits. You need ${requiredCredits} credit${requiredCredits > 1 ? 's' : ''} to generate a logo.`);
      return;
    }
    setError('');
    setIsGenerating(true);

    try {
      // Deduct credits first
      const deducted = creditService.deductCredits(
        requiredCredits, 
        `Logo generation for ${companyName.trim()}`, 
        currentUser?.id
      );
      
      if (!deducted) {
        throw new Error('Failed to deduct credits');
      }
      
      // Update credits display
      updateCredits();
      const logoRequest = {
        companyName: companyName.trim(),
        description: description.trim() || 'Professional business',
        style,
        colorScheme: getEffectiveColor(),
        keywords: [style, selectedColor, 'professional', 'clean'],
        industry: 'Professional Services'
      };

      const logoUrl = await trpcLogoService.generateLogo(logoRequest);
      setLogoUrl(logoUrl);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error generating logo:', error);
      // Provide more specific error handling
      let errorMessage = 'Failed to generate logo. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('netlify dev')) {
          errorMessage = error.message + '\n\nTo start the backend:\n1. Install Netlify CLI: npm install -g netlify-cli\n2. Run: netlify dev\n3. Restart this app';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to AI service. Ensure backend is running with "netlify dev".';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'AI service is busy. Please wait a moment and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      setError(errorMessage);
      
      // Refund credits if logo generation failed after deduction
      creditService.addCredits(
        requiredCredits, 
        `Refund for failed logo generation`, 
        currentUser?.id
      );
      updateCredits();
    } finally {
      setIsGenerating(false);
    }
  };

  const enhanceDescription = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name first');
      return;
    }

    setIsEnhancing(true);
    setError('');

    try {
      const enhanced = await trpcLogoService.generateBusinessKeywords(
        companyName.trim(),
        description.trim() || 'Professional business'
      );
      
      // Use the enhanced keywords as an improved description
      setDescription(enhanced);
    } catch (error) {
      console.error('Error enhancing description:', error);
      let errorMessage = 'Failed to enhance description';
      if (error instanceof Error) {
        if (error.message.includes('netlify dev')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleDownload = async () => {
    if (!logoUrl) return;

    try {
      const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_logo.png`;
      
      // Check if we can use the modern download API
      if ('showSaveFilePicker' in window) {
        // Modern browsers with File System Access API
        try {
          const response = await fetch(logoUrl);
          const blob = await response.blob();
          
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'PNG Images',
              accept: { 'image/png': ['.png'] }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (err) {
          // Fall back to traditional download if user cancels or error occurs
          console.log('File System Access API failed, falling back to traditional download');
        }
      }
      
      // Try to download as blob first (works on most desktop browsers)
      try {
        const response = await fetch(logoUrl, {
          mode: 'cors'
        });
        const blob = await response.blob();
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      } catch (fetchError) {
        console.warn('Blob download failed, trying direct link method');
      }
      
      // Mobile fallback or CORS issues - open in new tab with instructions
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        // Mobile: Open in new tab for manual save
        const link = document.createElement('a');
        link.href = logoUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show mobile-friendly instructions
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          setTimeout(() => {
            alert('Tap and hold the logo image, then select "Save to Photos" or "Save Image"');
          }, 1000);
        } else {
          setTimeout(() => {
            alert('Logo opened in new tab. Long press the image to save it to your device.');
          }, 1000);
        }
      } else {
        // Desktop fallback - direct download attempt
        const link = document.createElement('a');
        link.href = logoUrl;
        link.download = filename;
        link.target = '_blank';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
      // Final fallback: open image in new tab
      const fallbackLink = document.createElement('a');
      fallbackLink.href = logoUrl;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
      
      alert('Download failed. The image has been opened in a new tab - please right-click and save it manually.');
      setError('');
    }
  };

  const handleSave = async () => {
    if (!logoUrl || !companyName.trim()) {
      setError('No logo to save');
      return;
    }

    try {
      const generatedLogo: GeneratedLogo = {
        id: crypto.randomUUID(),
        imageUrl: logoUrl,
        prompt: `${style} logo for ${companyName.trim()}`,
        style: style,
        companyName: companyName.trim(),
        industry: 'Professional Services',
        colors: [colors.find(c => c.value === selectedColor)?.color || '#3b82f6'],
        createdAt: new Date()
      };

      const logoConfig: LogoConfig = {
        id: crypto.randomUUID(),
        companyName: companyName.trim(),
        industry: 'Professional Services',
        style: style,
        colorScheme: selectedColor,
        description: description.trim(),
        keywords: [style, selectedColor, 'professional'],
        generatedLogos: [generatedLogo],
        selectedLogo: generatedLogo,
        createdAt: new Date()
      };
      
      onSaveLogo(logoConfig);
      setError('');
      alert('Logo saved successfully!');
    } catch (error) {
      console.error('Error saving logo:', error);
      setError('Failed to save logo. Please try again.');
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

        {/* Credit Display */}
        <div className="mb-8">
          <CreditDisplay 
            currentUser={currentUser}
            onPurchaseClick={onPurchaseCredits}
            compact={true}
          />
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
                    <span>Generate Logo (1 Credit)</span>
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                  {error.includes('Insufficient credits') && (
                    <button
                      onClick={onPurchaseCredits}
                      className="block mt-2 text-blue-300 underline hover:text-blue-200 transition-colors"
                    >
                      Purchase more credits →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Logo Display */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl p-8 border border-gray-700/50">
            {logoUrl ? (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-6">Your Logo</h3>
                
                <div className="bg-white rounded-2xl p-8 mb-6 inline-block">
                  <img
                    src={logoUrl}
                    alt={`Logo for ${companyName}`}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all mobile-input"
                  />
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors download-button mobile-optimized mobile-button"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors mobile-optimized mobile-button"
                  >
                    <Save className="w-5 h-5" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      handleGenerate(); // Auto-regenerate with same rules
                    }}
                    disabled={isGenerating || !companyName.trim()}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors mobile-optimized mobile-button"
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
    </div>
  );
}