export interface LogoGenerationRequest {
  companyName: string;
  industry: string;
  style: string;
  colorScheme: string;
  description: string;
  keywords: string[];
}

export class OpenAILogoService {
  private static instance: OpenAILogoService;

  static getInstance(): OpenAILogoService {
    if (!OpenAILogoService.instance) {
      OpenAILogoService.instance = new OpenAILogoService();
    }
    return OpenAILogoService.instance;
  }

  private getApiKey(): string | null {
    // Try to get from environment variables first
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envKey) {
      return envKey;
    }

    // Fallback to localStorage for user-provided keys
    return localStorage.getItem('openai-api-key');
  }

  private hasValidApiKey(): boolean {
    const apiKey = this.getApiKey();
    return !!(apiKey && apiKey.startsWith('sk-'));
  }

  async generateLogo(request: LogoGenerationRequest): Promise<string> {
    if (!this.hasValidApiKey()) {
      throw new Error('OpenAI API key is required. Please add VITE_OPENAI_API_KEY to your .env file or provide it in settings.');
    }

    const apiKey = this.getApiKey()!;
    
    try {
      const prompt = this.buildLogoPrompt(request);
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          size: '1024x1024',
          quality: 'hd',
          response_format: 'url',
          n: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`OpenAI API Error: ${errorMessage}`);
      }

      const data = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].url) {
        throw new Error('Invalid response from OpenAI API: No image URL returned');
      }

      return data.data[0].url;
    } catch (error) {
      console.error('Error generating logo with OpenAI:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient_quota')) {
          throw new Error('OpenAI API quota exceeded. Please check your billing and usage limits.');
        } else if (error.message.includes('invalid_api_key')) {
          throw new Error('Invalid OpenAI API key. Please check your API key in the .env file.');
        } else if (error.message.includes('rate_limit_exceeded')) {
          throw new Error('OpenAI API rate limit exceeded. Please wait a moment and try again.');
        }
        throw error;
      }
      
      throw new Error('Failed to generate logo. Please try again.');
    }
  }

  async generateBusinessKeywords(companyName: string, description: string): Promise<string> {
    if (!this.hasValidApiKey()) {
      throw new Error('OpenAI API key is required. Please add VITE_OPENAI_API_KEY to your .env file or provide it in settings.');
    }

    const apiKey = this.getApiKey()!;
    
    try {
      const prompt = `Generate enhanced business keywords and description for "${companyName}". 
      Current description: "${description}".
      
      Please provide an improved, professional business description that includes relevant industry keywords, value propositions, and brand attributes. Focus on making it clear, compelling, and suitable for logo generation. Return only the enhanced description, no additional text.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a professional brand strategist. Generate enhanced business descriptions that are clear, professional, and suitable for logo design.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`OpenAI API Error: ${errorMessage}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenAI API');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating business keywords:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient_quota')) {
          throw new Error('OpenAI API quota exceeded. Please check your billing and usage limits.');
        } else if (error.message.includes('invalid_api_key')) {
          throw new Error('Invalid OpenAI API key. Please check your API key in the .env file.');
        } else if (error.message.includes('rate_limit_exceeded')) {
          throw new Error('OpenAI API rate limit exceeded. Please wait a moment and try again.');
        }
        throw error;
      }
      
      throw new Error('Failed to generate enhanced description. Please try again.');
    }
  }

  private buildLogoPrompt(request: LogoGenerationRequest): string {
    const {
      companyName,
      industry,
      style,
      colorScheme,
      description,
      keywords
    } = request;

    // Build a comprehensive prompt for logo generation
    let prompt = `Create a professional logo design for "${companyName}", a ${industry.toLowerCase()} company. `;
    
    // Add style information
    const styleDescriptions = {
      modern: 'modern, minimalist, clean, contemporary, sleek',
      classic: 'classic, traditional, timeless, elegant, refined',
      creative: 'creative, artistic, unique, innovative, imaginative',
      minimal: 'minimal, simple, clean, understated, sophisticated',
      tech: 'tech, futuristic, digital, innovative, cutting-edge',
      luxury: 'luxury, premium, elegant, sophisticated, high-end',
      organic: 'organic, natural, flowing, curved, earth-inspired',
      bold: 'bold, strong, impactful, powerful, dynamic'
    };
    
    const styleDesc = styleDescriptions[style as keyof typeof styleDescriptions] || 'professional';
    prompt += `The logo should have a ${styleDesc} style. `;

    // Add color scheme
    if (colorScheme !== 'custom') {
      const colorDescriptions = {
        blue: 'blue color palette with professional blue tones',
        green: 'green color palette with growth and nature tones',
        purple: 'purple color palette with creative and innovative tones',
        orange: 'orange color palette with energetic and warm tones',
        red: 'red color palette with bold and powerful tones',
        black: 'monochrome black and white palette with sophisticated tones'
      };
      
      const colorDesc = colorDescriptions[colorScheme as keyof typeof colorDescriptions] || 'professional colors';
      prompt += `Use a ${colorDesc}. `;
    } else {
      prompt += 'Use appropriate professional colors. ';
    }

    // Add business description
    if (description && description.trim()) {
      prompt += `The company is described as: ${description.trim()}. `;
    }

    // Add keywords
    if (keywords && keywords.length > 0) {
      prompt += `Key brand attributes include: ${keywords.join(', ')}. `;
    }

    // Add technical requirements
    prompt += `Create a vector-style logo that is clean, professional, scalable, and suitable for business use. The logo should work well on both light and dark backgrounds. Focus on clarity, memorability, and brand recognition. Avoid overly complex details that won't scale well at small sizes.`;

    return prompt;
  }
}

export const openaiLogoService = OpenAILogoService.getInstance();