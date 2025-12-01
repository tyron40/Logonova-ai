import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

export interface LogoGenerationRequest {
  companyName: string;
  description: string;
  style: string;
  colorScheme: string;
  keywords: string[];
  industry: string;
}

// Mock logo service for fallback
const mockLogoService = {
  generateLogo: async (request: LogoGenerationRequest): Promise<string> => {
    console.log('🎭 Using mock logo service as fallback');
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return a sample logo URL from a reliable service
    const color = request.colorScheme === 'custom' ? 'blue' : request.colorScheme;
    const style = request.style || 'modern';
    const company = encodeURIComponent(request.companyName.slice(0, 20));
    
    return `https://via.placeholder.com/400x400/${color === 'blue' ? '3B82F6' : color === 'green' ? '10B981' : color === 'purple' ? '8B5CF6' : color === 'orange' ? 'F59E0B' : color === 'red' ? 'EF4444' : '1F2937'}/FFFFFF?text=${company}+Logo`;
  },
  
  generateKeywords: async (companyName: string, description: string): Promise<string> => {
    console.log('🎭 Using mock keyword service as fallback');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const enhancedDescription = description || `${companyName} is a professional business that provides high-quality services to clients. We focus on innovation, excellence, and customer satisfaction in everything we do.`;
    return enhancedDescription;
  }
};

// Create tRPC client
const apiUrl = import.meta.env.VITE_TRPC_API_URL || '/api/trpc';
console.log('🔗 tRPC URL:', apiUrl);

export const trpc = createTRPCProxyClient<any>({
  links: [
    httpBatchLink({
      url: apiUrl,
      // Add headers for cross-origin requests
      headers() {
        return {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        };
      },
      fetch(url, options) {
        return fetch(url, {
          ...options,
          mode: 'cors',
          credentials: 'omit',
        });
      },
    }),
  ],
});

export const trpcLogoService = {
  async generateLogo(request: LogoGenerationRequest): Promise<string> {
    try {
      console.log('🚀 Generating logo with request:', request);
      const result = await trpc.logo.generate.mutate(request);
      console.log('✅ Logo generated successfully:', result);
      return result.logoUrl || result.imageUrl;
    } catch (error) {
      console.error('❌ tRPC logo generation failed:', error);
      
      // Handle JSON parsing errors specifically
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.warn('⚠️ tRPC backend unavailable, using fallback service');
        return await mockLogoService.generateLogo(request);
      }
      
      // Handle specific network errors
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          console.warn('⚠️ Network error, using fallback service');
          return await mockLogoService.generateLogo(request);
        }
        if (error.message.includes('CORS')) {
          console.warn('⚠️ CORS error, using fallback service');
          return await mockLogoService.generateLogo(request);
        }
        if (error.message.includes('NetworkError')) {
          console.warn('⚠️ Network error, using fallback service');
          return await mockLogoService.generateLogo(request);
        }
      }
      
      console.warn('⚠️ Unknown error, using fallback service');
      return await mockLogoService.generateLogo(request);
    }
  },

  async generateBusinessKeywords(companyName: string, description: string): Promise<string> {
    try {
      console.log('🔍 Generating keywords for:', { companyName, description });
      const result = await trpc.logo.generateKeywords.mutate({
        companyName,
        description
      });
      console.log('✅ Keywords generated successfully:', result);
      return result.keywords || result.enhancedDescription;
    } catch (error) {
      console.error('❌ tRPC keyword generation failed:', error);
      
      // Handle specific network errors
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          console.warn('⚠️ Network error, using fallback service');
          return await mockLogoService.generateKeywords(companyName, description);
        }
      }
      
      console.warn('⚠️ tRPC backend unavailable, using fallback service');
      return await mockLogoService.generateKeywords(companyName, description);
    }
  }
};