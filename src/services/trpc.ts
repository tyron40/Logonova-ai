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
export const trpc = createTRPCProxyClient<any>({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_NEXT_PUBLIC_TRPC_API_URL || 'https://logonova-ai.netlify.app/.netlify/functions/trpc',
      // Add headers for cross-origin requests
      headers() {
        return {
          'Content-Type': 'application/json',
        };
      },
    }),
  ],
});

// Debug log the URL being used
console.log('🔗 tRPC URL:', import.meta.env.VITE_NEXT_PUBLIC_TRPC_API_URL || 'https://logonova-ai.netlify.app/.netlify/functions/trpc');

export const trpcLogoService = {
  async generateLogo(request: LogoGenerationRequest): Promise<string> {
    try {
      const result = await trpc.logo.generate.mutate(request);
      return result.logoUrl || result.imageUrl;
    } catch (error) {
      console.error('tRPC logo generation failed:', error);
      
      // Provide more specific error handling for connection issues
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Unable to connect to logo generation service. Please ensure the backend server is running with "netlify dev"');
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ERR_NETWORK')) {
          throw new Error('Backend service not available. Run "netlify dev" to start the local server.');
        }
        throw new Error(error.message);
      }
      throw new Error('Logo generation service unavailable');
    }
  },

  async generateBusinessKeywords(companyName: string, description: string): Promise<string> {
    try {
      const result = await trpc.logo.generateKeywords.mutate({
        companyName,
        description
      });
      return result.keywords || result.enhancedDescription;
    } catch (error) {
      console.error('tRPC keyword generation failed:', error);
      
      // Provide more specific error handling for connection issues
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Unable to connect to keyword enhancement service. Please ensure the backend server is running with "netlify dev"');
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ERR_NETWORK')) {
          throw new Error('Backend service not available. Run "netlify dev" to start the local server.');
        }
        throw new Error(error.message);
      }
      throw new Error('Keyword generation service unavailable');
    }
  }
};