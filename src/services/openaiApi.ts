// This file has been deprecated - all API calls now go through tRPC backend
// API keys are securely managed server-side

export const openaiLogoService = {
  generateLogo: () => {
    throw new Error('OpenAI API calls now handled by tRPC backend. Use trpcLogoService instead.');
  },
  
  generateBrandingIdeas: () => {
    throw new Error('OpenAI API calls now handled by tRPC backend. Use trpcLogoService instead.');
  },
  
  generateEnhancedKeywords: () => {
    throw new Error('OpenAI API calls now handled by tRPC backend. Use trpcLogoService instead.');
  }
};