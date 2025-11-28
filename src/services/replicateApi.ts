import { apiKeyManager } from './apiKeyManager';

export interface LogoGenerationRequest {
  companyName: string;
  industry: string;
  style: string;
  colorScheme: string;
  description: string;
  keywords: string[];
}

export class ReplicateLogoService {
  private static instance: ReplicateLogoService;

  constructor() {
    // No longer store API key directly - use ApiKeyManager
  }

  static getInstance(): ReplicateLogoService {
    if (!ReplicateLogoService.instance) {
      ReplicateLogoService.instance = new ReplicateLogoService();
    }
    return ReplicateLogoService.instance;
  }

  async initializeForUser(userId: string | null) {
    // ApiKeyManager handles initialization
    await apiKeyManager.initializeForUser(userId);
  }

  async setApiToken(token: string): Promise<void> {
    await apiKeyManager.setApiKey('replicate', token);
  }

  hasApiToken(): boolean {
    return apiKeyManager.hasApiKey('replicate');
  }

  private getApiToken(): string {
    const token = apiKeyManager.getApiKey('replicate');
    if (!token) {
      throw new Error('Replicate API token is required. Please set your API key first.');
    }
    return token;
  }

  private getLogoTypeVariation(variation: number): string {
    const logoTypes = [
      'wordmark with elegant typography',
      'lettermark monogram with modern styling',
      'pictorial mark with iconic symbol',
      'abstract geometric logo',
      'combination mark with text and symbol',
      'minimalist icon with clean lines',
      'emblem-style circular design',
      'typographic logo with creative styling'
    ];
    return logoTypes[variation % logoTypes.length];
  }

  private getStyleEnhancement(style: string): string {
    const styleEnhancements = {
      'modern': 'clean minimalist design, geometric proportions',
      'luxury': 'premium aesthetic, elegant typography',
      'tech': 'futuristic elements, digital geometry',
      'organic': 'natural curves, earth-inspired colors',
      'bold': 'high-impact typography, strong contrast',
      'elegant': 'graceful curves, sophisticated colors',
      'creative': 'unique artistic elements, innovative design',
      'corporate': 'professional design, business-appropriate'
    };
    return styleEnhancements[style] || 'professional clean design';
  }

  private getIndustryContext(industry: string): string {
    const industryContexts = {
      'Technology & Software': 'innovation, digital solutions',
      'Finance & Banking': 'trust, security, stability',
      'Healthcare & Medical': 'care, healing, wellness',
      'Education & Learning': 'knowledge, growth, learning',
      'Retail & E-commerce': 'shopping, customer satisfaction',
      'Food & Beverage': 'culinary excellence, freshness',
      'Real Estate & Property': 'home, investment, community',
      'Consulting & Services': 'expertise, problem-solving',
      'Marketing & Advertising': 'creativity, brand building',
      'Manufacturing & Industrial': 'precision, quality',
      'Entertainment & Media': 'creativity, storytelling',
      'Fashion & Beauty': 'style, elegance, beauty',
      'Sports & Fitness': 'performance, strength, health',
      'Travel & Tourism': 'adventure, exploration',
      'Automotive & Transportation': 'speed, reliability',
      'Energy & Sustainability': 'renewable energy, sustainability',
      'Non-profit & Charity': 'compassion, community service',
      'Startup & Innovation': 'disruption, innovation',
      'Legal & Law': 'justice, integrity, expertise',
      'Architecture & Design': 'structural beauty, design',
      'Photography & Creative': 'visual storytelling, artistry',
      'Music & Audio': 'sound quality, musical excellence',
      'Gaming & Esports': 'competitive gaming, entertainment',
      'Wellness & Spa': 'relaxation, rejuvenation, wellness'
    };
    return industryContexts[industry] || 'professional excellence, quality';
  }

  private getColorPsychology(colorScheme: string): string {
    const colorPsychologies = {
      'royal-blue': 'professional blue, trust and reliability',
      'emerald-luxury': 'rich emerald green, growth and prosperity',
      'sunset-gradient': 'warm orange-yellow gradient, energy and optimism',
      'purple-innovation': 'sophisticated purple, innovation and creativity',
      'rose-elegance': 'elegant rose pink, beauty and sophistication',
      'teal-modern': 'contemporary teal, modernity and freshness',
      'crimson-bold': 'bold crimson red, power and passion',
      'gold-premium': 'luxurious gold, premium quality and prestige',
      'monochrome-classic': 'timeless black and gray, sophisticated appeal',
      'ocean-depth': 'deep ocean blue, depth and trustworthiness'
    };
    return colorPsychologies[colorScheme] || 'professional color palette';
  }

  private buildAdvancedLogoPrompt(request: LogoGenerationRequest, variation: number): string {
    const logoType = this.getLogoTypeVariation(variation);
    const styleEnhancement = this.getStyleEnhancement(request.style);
    const industryContext = this.getIndustryContext(request.industry);
    const colorPsychology = this.getColorPsychology(request.colorScheme);
    
    const keywordsText = request.keywords.length > 0 ? 
      `, ${request.keywords.join(', ')}` : '';
    
    const descriptionText = request.description ? 
      `, ${request.description}` : '';

    // Simplified prompt to avoid length issues
    const prompt = `Professional vector logo for "${request.companyName}" - ${logoType}. ${styleEnhancement}. Industry: ${request.industry} - ${industryContext}. Colors: ${colorPsychology}${descriptionText}${keywordsText}. Clean white background, vector style, high quality logo design.`;

    return prompt;
  }

  async generateLogo(request: LogoGenerationRequest, variation: number = 0): Promise<string> {
    const apiToken = this.getApiToken();
    
    // Validate API token format
    if (!apiToken || apiToken.length < 10) {
      throw new Error('Invalid Replicate API token format');
    }
    
    const prompt = this.buildAdvancedLogoPrompt(request, variation);
    console.log('Generating logo with prompt:', prompt.substring(0, 100) + '...');

    try {
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
          input: {
            prompt,
            width: 1024,
            height: 1024,
            guidance_scale: 12,
            num_outputs: 1,
            safety_tolerance: 2,
            prompt_upsampling: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Replicate API error:', response.status, errorText);
        
        // Check for specific error types
        if (response.status === 401) {
          throw new Error('Invalid Replicate API token. Please check your API key.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status >= 500) {
          throw new Error('Replicate service temporarily unavailable. Please try again later.');
        }
        
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const prediction = await response.json();
      console.log('Prediction created:', prediction.id);
      
      // Poll for completion with timeout
      let result = prediction;
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds timeout
      
      while ((result.status === 'starting' || result.status === 'processing') && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
          headers: {
            'Authorization': `Token ${apiToken}`,
          },
        });
        
        if (!pollResponse.ok) {
          console.error('Polling failed:', pollResponse.status);
          throw new Error(`Polling failed! status: ${pollResponse.status}`);
        }
        
        result = await pollResponse.json();
        console.log('Poll attempt', attempts, 'status:', result.status);
      }

      if (attempts >= maxAttempts) {
        throw new Error('Generation timeout - please try again');
      }

      if (result.status === 'failed') {
        console.error('Generation failed:', result.error);
        throw new Error(result.error || 'Generation failed');
      }

      if (!result.output || !result.output[0]) {
        console.error('No output generated:', result);
        throw new Error('No output generated');
      }

      console.log('Logo generated successfully');
      return result.output[0];
    } catch (error) {
      console.error('Error generating logo with FLUX:', error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to Replicate API. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  async generateMultipleLogos(request: LogoGenerationRequest, count: number = 6): Promise<string[]> {
    const apiToken = this.getApiToken();
    
    console.log('Generating', count, 'logos for', request.companyName);
    const results: string[] = [];
    const errors: string[] = [];
    
    // Generate logos with some parallelization but rate limiting
    const batchSize = 2; // Generate 2 at a time to avoid rate limits
    
    for (let i = 0; i < count; i += batchSize) {
      const batch = [];
      
      for (let j = 0; j < batchSize && i + j < count; j++) {
        batch.push(this.generateLogo(request, i + j));
      }
      
      try {
        console.log('Processing batch', Math.floor(i / batchSize) + 1);
        const batchResults = await Promise.allSettled(batch);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
            console.log('Logo', i + index + 1, 'generated successfully');
          } else {
            const errorMsg = `Logo ${i + index + 1}: ${result.reason.message}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        });
        
        // Add delay between batches
        if (i + batchSize < count) {
          console.log('Waiting before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Error in batch ${i / batchSize + 1}:`, error);
        errors.push(`Batch error: ${error}`);
      }
    }

    if (results.length === 0) {
      throw new Error(`Failed to generate any logos. Errors: ${errors.join(', ')}`);
    }

    if (errors.length > 0) {
      console.warn('Some logos failed to generate:', errors);
    }

    console.log('Generated', results.length, 'logos successfully');
    return results;
  }
}

export const replicateLogoService = ReplicateLogoService.getInstance();