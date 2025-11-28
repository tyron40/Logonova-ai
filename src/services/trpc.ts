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
      url: 'https://logonova-ai.netlify.app/api/trpc',
      // Add headers for cross-origin requests
      headers() {
        return {
          'Content-Type': 'application/json',
        };
      },
    }),
  ],
});

export const trpcLogoService = {
  async generateLogo(request: LogoGenerationRequest): Promise<string> {
    try {
      const result = await trpc.logo.generate.mutate(request);
      return result.logoUrl || result.imageUrl;
    } catch (error) {
      console.error('tRPC logo generation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Logo generation failed');
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
      throw new Error(error instanceof Error ? error.message : 'Keyword generation failed');
    }
  }
};