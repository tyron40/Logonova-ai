import React, { useState } from 'react';
import { LogoConfig } from '../types';
import { Search, Download, Trash2, Eye, Calendar, Tag } from 'lucide-react';

interface GalleryProps {
  savedLogos: LogoConfig[];
  onDeleteLogo: (id: string) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ savedLogos, onDeleteLogo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLogo, setSelectedLogo] = useState<LogoConfig | null>(null);

  const filteredLogos = savedLogos.filter(logo => 
    logo.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = async (logo: LogoConfig) => {
    if (!logo.selectedLogo) return;

    try {
      const filename = `${logo.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_logo.png`;
      
      // Check if we can use the modern download API
      if ('showSaveFilePicker' in window) {
        // Modern browsers with File System Access API
        try {
          const response = await fetch(logo.selectedLogo.imageUrl);
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
        const response = await fetch(logo.selectedLogo.imageUrl, {
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
        link.href = logo.selectedLogo.imageUrl;
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
        link.href = logo.selectedLogo.imageUrl;
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
      fallbackLink.href = logo.selectedLogo.imageUrl;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
      
      alert('Download failed. The image has been opened in a new tab - please right-click and save it manually.');
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Your Logo Gallery</h1>
          <p className="text-lg text-gray-300">
            All your saved logos in one place
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 mobile-input"
            />
          </div>
        </div>

        {/* Gallery */}
        {filteredLogos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">No Logos Found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? 'No logos match your search' : 'Create your first logo to see it here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLogos.map((logo) => (
              <div
                key={logo.id}
                className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105"
              >
                {/* Logo Display */}
                <div className="bg-white/95 aspect-square flex items-center justify-center p-6 relative group">
                  {logo.selectedLogo ? (
                    <>
                      <img
                        src={logo.selectedLogo.imageUrl}
                        alt={`Logo for ${logo.companyName}`}
                        className="max-w-full max-h-full object-contain cursor-pointer"
                        onClick={() => setSelectedLogo(logo)}
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400">No Logo Selected</div>
                  )}
                </div>
                
                {/* Logo Info */}
                <div className="p-6">
                  <h3 className="font-bold text-white text-lg mb-2 truncate">
                    {logo.companyName || 'Unnamed Company'}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                    <Tag className="w-4 h-4" />
                    <span className="capitalize">{logo.style} • {logo.industry}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(logo.createdAt)}</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {logo.selectedLogo && (
                      <button
                        onClick={() => handleDownload(logo)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors download-button mobile-optimized mobile-button"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this logo?')) {
                          onDeleteLogo(logo.id);
                        }
                      }}
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors mobile-optimized mobile-button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedLogo && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4">
          <div className="relative bg-gray-800 rounded-2xl max-w-2xl w-full p-8">
            <button
              onClick={() => setSelectedLogo(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {selectedLogo.companyName}
              </h2>
              <p className="text-gray-400 capitalize">{selectedLogo.industry} • {selectedLogo.style}</p>
            </div>
            
            {selectedLogo.selectedLogo && (
              <div className="flex justify-center mb-8">
                <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm">
                  <img
                    src={selectedLogo.selectedLogo.imageUrl}
                    alt={`Logo for ${selectedLogo.companyName}`}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleDownload(selectedLogo)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors download-button mobile-optimized mobile-button"
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
};