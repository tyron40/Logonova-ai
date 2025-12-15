import React, { useState } from 'react';
import { LogoConfig, ExportFormat } from '../types';
import { Download, X, FileImage, FileText, Settings } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ExportModalProps {
  logoConfig: LogoConfig;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ logoConfig, onClose }) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>({
    format: 'png',
    size: 'medium',
    quality: 'high',
    transparent: true
  });

  const [isExporting, setIsExporting] = useState(false);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const formatOptions = [
    { value: 'png', label: 'PNG', icon: FileImage, description: 'Best for web and digital use with transparency' },
    { value: 'jpg', label: 'JPG', icon: FileImage, description: 'Smaller file size, good for web without transparency' },
    { value: 'svg', label: 'SVG', icon: FileText, description: 'Vector format, perfect for scaling and print' },
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Professional format for print and presentations' }
  ];

  const sizeOptions = [
    { value: 'small', label: 'Small (256x256)', pixels: '256x256', description: 'Social media avatars' },
    { value: 'medium', label: 'Medium (512x512)', pixels: '512x512', description: 'Website headers' },
    { value: 'large', label: 'Large (1024x1024)', pixels: '1024x1024', description: 'Print materials' },
    { value: 'xl', label: 'Extra Large (2048x2048)', pixels: '2048x2048', description: 'High-resolution print' }
  ];

  const qualityOptions = [
    { value: 'standard', label: 'Standard', description: 'Good quality, smaller file size' },
    { value: 'high', label: 'High', description: 'Better quality, balanced file size' },
    { value: 'ultra', label: 'Ultra', description: 'Best quality, larger file size' }
  ];

  const handleExport = async () => {
    if (!logoConfig.selectedLogo) {
      alert('No logo selected for export');
      return;
    }

    setIsExporting(true);
    
    try {
      const size = exportFormat.size === 'small' ? 256 : 
                   exportFormat.size === 'medium' ? 512 : 
                   exportFormat.size === 'large' ? 1024 : 2048;

      if (exportFormat.format === 'svg') {
        // For SVG, we can directly use the SVG content
        const svgContent = await fetch(logoConfig.selectedLogo.imageUrl).then(r => r.text());
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        downloadFile(blob, `${logoConfig.companyName.toLowerCase().replace(/\s+/g, '-')}-logo.svg`);
      } else {
        // For raster formats, create a canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;

        if (ctx) {
          // Set background
          if (!exportFormat.transparent || exportFormat.format === 'jpg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);
          }

          // Load and draw the logo
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              // Center the image
              const scale = Math.min(size / img.width, size / img.height) * 0.8;
              const x = (size - img.width * scale) / 2;
              const y = (size - img.height * scale) / 2;
              
              ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
              resolve(void 0);
            };
            img.onerror = reject;
            img.src = logoConfig.selectedLogo!.imageUrl;
          });

          // Convert to blob and download
          const quality = exportFormat.quality === 'standard' ? 0.8 : 
                         exportFormat.quality === 'high' ? 0.9 : 0.95;

          canvas.toBlob((blob) => {
            if (blob) {
              const extension = exportFormat.format === 'jpg' ? 'jpg' : 'png';
              downloadFile(blob, `${logoConfig.companyName.toLowerCase().replace(/\s+/g, '-')}-logo.${extension}`);
            }
          }, `image/${exportFormat.format}`, quality);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);

    if (isMobile) {
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleQuickSave = () => {
    if (!logoConfig.selectedLogo) return;

    window.open(logoConfig.selectedLogo.imageUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Export Your Logo</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Preview */}
          {logoConfig.selectedLogo && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <img
                  src={logoConfig.selectedLogo.imageUrl}
                  alt="Logo preview"
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{logoConfig.companyName}</h4>
                  <p className="text-sm text-gray-600 capitalize">{logoConfig.selectedLogo.style} style</p>
                </div>
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Format</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {formatOptions.map((format) => (
                  <button
                    key={format.value}
                    onClick={() => setExportFormat(prev => ({ ...prev, format: format.value as any }))}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      exportFormat.format === format.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <format.icon className="w-5 h-5" />
                      <span className="font-semibold">{format.label}</span>
                    </div>
                    <p className="text-xs text-gray-600">{format.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Size</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sizeOptions.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setExportFormat(prev => ({ ...prev, size: size.value as any }))}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      exportFormat.size === size.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{size.label}</span>
                      <span className="text-sm text-gray-600">{size.pixels}</span>
                    </div>
                    <div className="text-xs text-gray-600">{size.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality and Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quality Selection (for raster formats) */}
              {exportFormat.format !== 'svg' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Quality</label>
                  <div className="space-y-2">
                    {qualityOptions.map((quality) => (
                      <button
                        key={quality.value}
                        onClick={() => setExportFormat(prev => ({ ...prev, quality: quality.value as any }))}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          exportFormat.quality === quality.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium mb-1">{quality.label}</div>
                        <div className="text-sm text-gray-600">{quality.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Transparency Option */}
              {exportFormat.format === 'png' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Background</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setExportFormat(prev => ({ ...prev, transparent: true }))}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        exportFormat.transparent
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium mb-1">Transparent</div>
                      <div className="text-sm text-gray-600">No background, perfect for overlays</div>
                    </button>
                    <button
                      onClick={() => setExportFormat(prev => ({ ...prev, transparent: false }))}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        !exportFormat.transparent
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium mb-1">White Background</div>
                      <div className="text-sm text-gray-600">Solid white background</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Export Buttons */}
          <div className="mt-8 space-y-4">
            {isMobile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Quick Save to Photos</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Open the image in a new tab, then tap and hold to save to your photo library
                </p>
                <button
                  onClick={handleQuickSave}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors mobile-optimized mobile-button"
                >
                  <FileImage className="w-5 h-5" />
                  <span>Open Image to Save</span>
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                {!isMobile && `File will be saved as: ${logoConfig.companyName.toLowerCase().replace(/\s+/g, '-')}-logo.${exportFormat.format}`}
                {isMobile && 'Or customize export settings:'}
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mobile-optimized mobile-button"
              >
                <Download className="w-5 h-5" />
                <span>{isExporting ? 'Exporting...' : isMobile ? 'Custom Export' : 'Export Logo'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};