import { apiKeyManager } from './apiKeyManager';

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

  async generateLogo(request: LogoGenerationRequest): Promise<string> {
    try {
      const apiKey = apiKeyManager.getApiKey('openai');

      if (!apiKey) {
        throw new Error("OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.");
      }

      const prompt = `Create a professional logo for "${request.companyName}".
Style: ${request.style}
Industry: ${request.industry}
Description: ${request.description}
Color scheme: ${request.colorScheme}
The logo should be clean, memorable, and suitable for business use.`;

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
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
        const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
        throw new Error(error.error?.message ?? "Image generation failed.");
      }

      const data = await response.json();
      return data.data[0]?.url ?? "";
    } catch (err) {
      console.error("Logo Generation Error:", err);
      throw new Error(err instanceof Error ? err.message : "Failed to generate logo. Try again.");
    }
  }

  async generateBusinessKeywords(companyName: string, description: string): Promise<string> {
    try {
      const apiKey = apiKeyManager.getApiKey('openai');

      if (!apiKey) {
        throw new Error("OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.");
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a branding expert. Enhance business descriptions to be more descriptive and professional for logo generation. Keep it concise (2-3 sentences).'
            },
            {
              role: 'user',
              content: `Company: ${companyName}\nCurrent description: ${description || 'Professional business'}\n\nProvide an enhanced description:`
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
        throw new Error(error.error?.message ?? "Enhancement failed.");
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() ?? description;
    } catch (err) {
      console.error("Description Enhancement Error:", err);
      throw new Error(err instanceof Error ? err.message : "Failed to enhance description");
    }
  }
}

export const openaiLogoService = OpenAILogoService.getInstance();
