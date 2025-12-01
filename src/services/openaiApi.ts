// OpenAI API service for direct logo generation
export interface LogoGenerationRequest {
  companyName: string;
  description: string;
  style: string;
  colorScheme: string;
  keywords: string[];
  industry: string;
}

export const openaiLogoService = {
  async generateLogo(request: LogoGenerationRequest): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
    }

    const prompt = this.buildPrompt(request);

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].url;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  },

  async generateBusinessKeywords(companyName: string, description: string): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a branding expert. Generate an enhanced, professional description for logo design based on company information.'
            },
            {
              role: 'user',
              content: `Company: ${companyName}\nDescription: ${description}\n\nCreate a detailed, professional description for logo design that captures the essence of this business. Focus on visual elements, brand personality, and industry-appropriate concepts. Keep it under 100 words.`
            }
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  },

  buildPrompt(request: LogoGenerationRequest): string {
    const styleDescriptions = {
      modern: 'clean, minimalist, geometric, contemporary',
      classic: 'traditional, timeless, elegant, refined',
      creative: 'artistic, unique, imaginative, expressive',
      minimal: 'simple, clean, uncluttered, essential'
    };

    const colorDescriptions = {
      blue: 'professional blue tones, navy, azure',
      green: 'growth green, emerald, forest',
      purple: 'creative purple, violet, royal',
      orange: 'energetic orange, amber, vibrant',
      red: 'bold red, crimson, powerful',
      black: 'sophisticated black, elegant, premium',
      custom: 'balanced color palette'
    };

    const styleDesc = styleDescriptions[request.style as keyof typeof styleDescriptions] || 'professional';
    const colorDesc = colorDescriptions[request.colorScheme as keyof typeof colorDescriptions] || 'professional colors';
    
    const keywordsText = request.keywords.length > 0 ? `, incorporating themes of ${request.keywords.join(', ')}` : '';
    const descriptionText = request.description ? `, representing ${request.description}` : '';

    return `A professional vector logo design for "${request.companyName}", a ${request.industry.toLowerCase()} company. Style: ${styleDesc}. Colors: ${colorDesc}${descriptionText}${keywordsText}. Clean, scalable design with perfect typography, suitable for business use, white background, high quality vector illustration.`;
  }
};