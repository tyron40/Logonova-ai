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
const apiUrl = import.meta.env.VITE_TRPC_API_URL || 'http://localhost:3001/api/trpc';
console.log('🔗 tRPC URL:', apiUrl);

// Test if tRPC backend is available
let backendAvailable = false;
let backendTested = false;

async function testBackendAvailability(): Promise<boolean> {
  if (backendTested) {
    return backendAvailable;
  }
  
  try {
    const response = await fetch(apiUrl.replace('/api/trpc', '/health'), {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });
    backendAvailable = response.ok;
  } catch (error) {
    backendAvailable = false;
  }
  
  backendTested = true;
  return backendAvailable;
}

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
      // Check if backend is available first
      const isAvailable = await testBackendAvailability();
      if (!isAvailable) {
        throw new Error('BACKEND_UNAVAILABLE');
      }
      
      console.log('🚀 Generating logo with request:', request);
      const result = await trpc.logo.generate.mutate(request);
      console.log('✅ Logo generated successfully:', result);
      return result.logoUrl || result.imageUrl;
    } catch (error) {
      console.error('❌ tRPC logo generation failed:', error);
      
      // Handle backend unavailable
      if (error instanceof Error && error.message === 'BACKEND_UNAVAILABLE') {
        throw new Error('The tRPC backend service is not running. Please ensure the backend is started and accessible at: ' + apiUrl);
      }
      
      // Handle JSON parsing errors specifically
      if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('Unexpected end of JSON input'))) {
        throw new Error('The tRPC backend returned an invalid response. This usually means the backend is not properly configured or is returning HTML instead of JSON. Check that the backend is running at: ' + apiUrl);
      }
      
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
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          throw new Error('tRPC backend endpoint not found. The backend may not be properly deployed.');
        }
        if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          throw new Error('Backend server error. Please try again later or contact support.');
        }
        throw new Error(error.message);
      }
      
      throw new Error('Logo generation failed. Please try again.');
    }
  },

  async generateBusinessKeywords(companyName: string, description: string): Promise<string> {
    try {
      // Check if backend is available first
      const isAvailable = await testBackendAvailability();
      if (!isAvailable) {
        throw new Error('BACKEND_UNAVAILABLE');
      }
      
      console.log('🔍 Generating keywords for:', { companyName, description });
      const result = await trpc.logo.generateKeywords.mutate({
        companyName,
        description
      });
      console.log('✅ Keywords generated successfully:', result);
      return result.keywords || result.enhancedDescription;
    } catch (error) {
      console.error('❌ tRPC keyword generation failed:', error);
      
      // Handle backend unavailable
      if (error instanceof Error && error.message === 'BACKEND_UNAVAILABLE') {
        throw new Error('The tRPC backend service is not running. Please ensure the backend is started and accessible at: ' + apiUrl);
      }
      
      // Handle JSON parsing errors specifically
      if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('Unexpected end of JSON input'))) {
        throw new Error('The tRPC backend returned an invalid response. This usually means the backend is not properly configured. Check that the backend is running at: ' + apiUrl);
      }
      
      // Handle specific network errors
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Unable to connect to AI service. Please check your internet connection.');
        }
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          throw new Error('tRPC backend endpoint not found. The backend may not be properly deployed.');
        }
        throw new Error(error.message);
      }
      
      throw new Error('Keyword generation failed. Please try again.');
    }
  }
};