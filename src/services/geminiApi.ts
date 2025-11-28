import { apiKeyManager } from './apiKeyManager';

export interface GeminiRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export class GeminiService {
  private static instance: GeminiService;

  constructor() {
    // No longer store API key directly - use ApiKeyManager
  }

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  hasApiKey(): boolean {
    return apiKeyManager.hasApiKey('gemini');
  }

  private getApiKey(): string {
    const apiKey = apiKeyManager.getApiKey('gemini');
    if (!apiKey) {
      throw new Error('Gemini API key not available');
    }
    return apiKey;
  }

  async enhanceLogoPrompt(companyName: string, industry: string, description: string, keywords: string[]): Promise<string> {
    if (!this.hasApiKey()) {
      throw new Error('Gemini API key not available');
    }

    // Create a shorter, more focused prompt to avoid API issues
    const prompt = `Create a logo design prompt for "${companyName}" in ${industry}. Include style, colors, and visual elements. Keep it concise and professional.`;

    try {
      const apiKey = this.getApiKey();
      
      // Validate API key format
      if (!apiKey || apiKey.length < 10) {
        throw new Error('Invalid Gemini API key format');
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200, // Reduced token limit
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.warn('Unexpected Gemini response format:', data);
        return `Professional logo for ${companyName} in ${industry}. ${description}. Keywords: ${keywords.join(', ')}.`;
      }

      return data.candidates[0].content.parts[0]?.text || `Professional logo for ${companyName} in ${industry}. ${description}. Keywords: ${keywords.join(', ')}.`;
    } catch (error) {
      console.error('Error enhancing prompt with Gemini:', error);
      // Return a fallback prompt instead of throwing
      return `Professional logo for ${companyName} in ${industry}. ${description}. Keywords: ${keywords.join(', ')}.`;
    }
  }

  async generateBrandingIdeas(companyName: string, industry: string): Promise<string[]> {
    if (!this.hasApiKey()) {
      return [];
    }

    const prompt = `Generate 5 branding keywords for "${companyName}" in ${industry}. One per line.`;

    try {
      const apiKey = this.getApiKey();
      
      if (!apiKey || apiKey.length < 10) {
        return [];
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 100,
          }
        })
      });

      if (!response.ok) {
        console.error('Gemini API error for branding ideas:', response.status);
        return [];
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text.split('\n').filter(line => line.trim()).slice(0, 5);
    } catch (error) {
      console.error('Error generating branding ideas:', error);
      return [];
    }
  }
}

export const geminiService = GeminiService.getInstance();