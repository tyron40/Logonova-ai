import { apiKeyManager } from './apiKeyManager';

export interface HuggingFaceRequest {
  inputs: string;
  parameters?: {
    max_length?: number;
    temperature?: number;
    do_sample?: boolean;
  };
}

export class HuggingFaceService {
  private static instance: HuggingFaceService;

  constructor() {
    // No longer store API key directly - use ApiKeyManager
  }

  static getInstance(): HuggingFaceService {
    if (!HuggingFaceService.instance) {
      HuggingFaceService.instance = new HuggingFaceService();
    }
    return HuggingFaceService.instance;
  }

  hasApiKey(): boolean {
    return apiKeyManager.hasApiKey('huggingFace');
  }

  private getApiKey(): string {
    const apiKey = apiKeyManager.getApiKey('huggingFace');
    if (!apiKey) {
      throw new Error('Hugging Face API key not available');
    }
    return apiKey;
  }

  async generateLogoDescription(companyName: string, industry: string, style: string): Promise<string> {
    if (!this.hasApiKey()) {
      throw new Error('Hugging Face API key not available');
    }

    const prompt = `Create a professional logo description for ${companyName}, a ${industry} company with ${style} style:`;

    try {
      const apiKey = this.getApiKey();
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 150,
            temperature: 0.7,
            do_sample: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status}`);
      }

      const data = await response.json();
      return data[0]?.generated_text || prompt;
    } catch (error) {
      console.error('Error generating description with Hugging Face:', error);
      return prompt; // Fallback to original prompt
    }
  }

  async analyzeLogoSentiment(logoDescription: string): Promise<{ label: string; score: number }> {
    if (!this.hasApiKey()) {
      return { label: 'POSITIVE', score: 0.8 };
    }

    try {
      const apiKey = this.getApiKey();
      const response = await fetch('https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: logoDescription
        })
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status}`);
      }

      const data = await response.json();
      return data[0] || { label: 'POSITIVE', score: 0.8 };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return { label: 'POSITIVE', score: 0.8 };
    }
  }
}

export const huggingFaceService = HuggingFaceService.getInstance();