import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

export interface LogoGenerationRequest {
  companyName: string;
  description: string;
  style: string;
  colorScheme: string;
  keywords: string[];
  industry: string;
}

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
      
      // Handle specific network errors
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Unable to connect to AI service. Please check your internet connection or try again later.');
        }
        if (error.message.includes('CORS')) {
          throw new Error('Cross-origin request blocked. Please contact support if this persists.');
        }
        if (error.message.includes('NetworkError')) {
          throw new Error('Network error occurred. Please check your connection and try again.');
        }
        throw new Error(error.message);
      }
      
      throw new Error('Logo generation failed. Please try again.');
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
          throw new Error('Unable to connect to AI service. Please check your internet connection.');
        }
        throw new Error(error.message);
      }
      
      throw new Error('Keyword generation failed. Please try again.');
    }
  }
};