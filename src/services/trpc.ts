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
      url: '/api/trpc',
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
console.log('🔗 tRPC URL: /api/trpc (Bolt Backend)');

export const trpcLogoService = {
  async generateLogo(request: LogoGenerationRequest): Promise<string> {
    try {
      const result = await trpc.logo.generate.mutate(request);
      return result.logoUrl || result.imageUrl;
    } catch (error) {
      console.error('tRPC logo generation failed:', error);
      
      // Provide more specific error handling for connection issues
      if (error instanceof Error) {
        if (error.message.includes('Unexpected end of JSON input') || error.message.includes('JSON')) {
          throw new Error('Backend service is not responding properly. The tRPC backend may not be running or configured correctly.');
        }
        if (error.message.includes('fetch')) {
          throw new Error('Unable to connect to backend service. Make sure the tRPC backend is running.');
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ERR_NETWORK')) {
          throw new Error('Backend service not available. Please check if the tRPC server is running.');
        }
        throw new Error(error.message);
      }
      throw new Error('Backend service unavailable. The tRPC server may not be running.');
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
        if (error.message.includes('Unexpected end of JSON input') || error.message.includes('JSON')) {
          throw new Error('Backend service is not responding properly. The tRPC backend may not be running or configured correctly.');
        }
        if (error.message.includes('fetch')) {
          throw new Error('Unable to connect to backend service. Make sure the tRPC backend is running.');
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ERR_NETWORK')) {
          throw new Error('Backend service not available. Please check if the tRPC server is running.');
        }
        throw new Error(error.message);
      }
      throw new Error('Backend service unavailable. The tRPC server may not be running.');
    }
  }
};