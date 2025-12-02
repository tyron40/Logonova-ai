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

    // Enhanced industry and description analysis for contextual logo generation
    const businessContext = this.analyzeBusinessContext(description, companyName);
    const industryImagery = this.getIndustrySpecificImagery(description, industry);
    const styleModifiers = this.getAdvancedStyleModifiers(style);
    const colorGuidance = this.getColorGuidance(colorScheme);

    // Build a contextually-aware, comprehensive prompt for logo generation
    let prompt = `Create a professional, business-ready logo for "${companyName}"`;
    
    // Add business context and industry-specific elements
    if (businessContext.businessType) {
      prompt += `, a ${businessContext.businessType}`;
    }
    
    if (industryImagery.length > 0) {
      prompt += `. Incorporate ${industryImagery.join(', ')} imagery`;
    }
    
    prompt += `. `;
    
    // Add enhanced style information
    prompt += `Design in a ${styleModifiers.primary} style with ${styleModifiers.secondary} elements. `;
    

    // Add sophisticated color guidance
    prompt += `${colorGuidance} `;

    // Add business description
    if (description && description.trim()) {
      prompt += `Business focus: ${description.trim()}. `;
    }

    // Add keywords
    if (keywords && keywords.length > 0) {
      prompt += `Brand attributes: ${keywords.join(', ')}. `;
    }

    // Add critical requirements for perfect spelling and professionalism
    prompt += `CRITICAL REQUIREMENTS: 1) The company name "${companyName}" must be spelled EXACTLY correct with perfect typography. 2) Create a clean, professional, scalable vector-style logo suitable for all business applications. 3) Ensure the design is memorable, unique, and immediately recognizable. 4) The logo must work on both light and dark backgrounds. 5) Use industry-appropriate symbolism while maintaining business professionalism. 6) Avoid overly complex details that won't scale at small sizes. 7) Ensure all text is legible and professionally typeset.`;

    return prompt;
  }

  private analyzeBusinessContext(description: string, companyName: string): { businessType: string } {
    const desc = description.toLowerCase().trim();
    const name = companyName.toLowerCase().trim();
    
    // Industry classification for appropriate imagery
    if (desc.includes('strip club') || desc.includes('gentlemen\'s club') || desc.includes('adult entertainment')) {
      return { businessType: 'upscale entertainment venue' };
    } else if (desc.includes('bar') || desc.includes('pub') || desc.includes('brewery') || desc.includes('tavern')) {
      return { businessType: 'hospitality and beverage establishment' };
    } else if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('diner') || desc.includes('eatery')) {
      return { businessType: 'dining establishment' };
    } else if (desc.includes('gym') || desc.includes('fitness') || desc.includes('workout') || desc.includes('training')) {
      return { businessType: 'fitness and wellness center' };
    } else if (desc.includes('spa') || desc.includes('salon') || desc.includes('beauty') || desc.includes('massage')) {
      return { businessType: 'beauty and wellness spa' };
    } else if (desc.includes('tech') || desc.includes('software') || desc.includes('app') || desc.includes('digital')) {
      return { businessType: 'technology company' };
    } else if (desc.includes('consulting') || desc.includes('advisory') || desc.includes('services')) {
      return { businessType: 'professional services firm' };
    } else if (desc.includes('retail') || desc.includes('store') || desc.includes('shop') || desc.includes('boutique')) {
      return { businessType: 'retail establishment' };
    }
    
    return { businessType: 'business establishment' };
  }

  private getIndustrySpecificImagery(description: string, industry: string): string[] {
    const desc = description.toLowerCase().trim();
    const imagery: string[] = [];
    
    // Entertainment and nightlife
    if (desc.includes('strip club') || desc.includes('gentlemen\'s club') || desc.includes('adult entertainment')) {
      imagery.push('elegant silhouettes', 'sophisticated lighting elements', 'premium club aesthetics', 'upscale entertainment symbols');
    } else if (desc.includes('bar') || desc.includes('pub') || desc.includes('brewery')) {
      imagery.push('elegant glassware', 'sophisticated bar elements', 'premium beverage symbols');
    } else if (desc.includes('restaurant') || desc.includes('cafe')) {
      imagery.push('culinary elements', 'elegant dining symbols', 'gourmet food imagery');
    } else if (desc.includes('gym') || desc.includes('fitness')) {
      imagery.push('dynamic fitness symbols', 'strength and wellness elements', 'athletic design motifs');
    } else if (desc.includes('spa') || desc.includes('salon') || desc.includes('beauty')) {
      imagery.push('elegant beauty elements', 'wellness and relaxation symbols', 'sophisticated spa imagery');
    } else if (desc.includes('tech') || desc.includes('software')) {
      imagery.push('modern technological elements', 'digital innovation symbols', 'clean geometric patterns');
    } else if (desc.includes('law') || desc.includes('legal')) {
      imagery.push('professional legal symbols', 'scales of justice', 'sophisticated legal elements');
    } else if (desc.includes('medical') || desc.includes('healthcare')) {
      imagery.push('medical symbols', 'health and wellness elements', 'professional healthcare imagery');
    } else if (desc.includes('real estate') || desc.includes('property')) {
      imagery.push('architectural elements', 'property symbols', 'real estate design motifs');
    } else if (desc.includes('finance') || desc.includes('investment')) {
      imagery.push('financial symbols', 'growth and prosperity elements', 'professional finance imagery');
    }
    
    return imagery;
  }

  private getAdvancedStyleModifiers(style: string): { primary: string; secondary: string } {
    const styleMap = {
      modern: { 
        primary: 'contemporary modern', 
        secondary: 'clean geometric lines, minimalist sophistication, and cutting-edge aesthetics' 
      },
      classic: { 
        primary: 'timeless classic', 
        secondary: 'traditional elegance, refined sophistication, and enduring appeal' 
      },
      creative: { 
        primary: 'uniquely creative', 
        secondary: 'artistic innovation, imaginative design elements, and distinctive character' 
      },
      minimal: { 
        primary: 'elegantly minimal', 
        secondary: 'sophisticated simplicity, understated refinement, and perfect balance' 
      },
      tech: { 
        primary: 'cutting-edge technological', 
        secondary: 'futuristic innovation, digital precision, and advanced design concepts' 
      },
      luxury: { 
        primary: 'premium luxury', 
        secondary: 'sophisticated opulence, high-end refinement, and exclusive elegance' 
      },
      organic: { 
        primary: 'naturally organic', 
        secondary: 'flowing curves, earth-inspired elements, and harmonious balance' 
      },
      bold: { 
        primary: 'powerfully bold', 
        secondary: 'strong impactful presence, dynamic energy, and commanding attention' 
      }
    };
    
    return styleMap[style as keyof typeof styleMap] || { 
      primary: 'professional', 
      secondary: 'clean design elements and business-appropriate aesthetics' 
    };
  }

  private getColorGuidance(colorScheme: string): string {
    const colorMap = {
      blue: 'Use a sophisticated blue palette with professional navy, azure, and complementary blue tones that convey trust and reliability',
      green: 'Use an elegant green palette with emerald, forest green, and natural tones that represent growth and prosperity',
      purple: 'Use a creative purple palette with royal purple, violet, and sophisticated tones that convey innovation and luxury',
      orange: 'Use an energetic orange palette with warm amber, sunset orange, and vibrant tones that represent creativity and enthusiasm',
      red: 'Use a powerful red palette with deep crimson, burgundy, and bold tones that convey strength and passion',
      black: 'Use an elegant monochrome palette with sophisticated blacks, charcoal grays, and pristine whites for timeless appeal',
      custom: 'Use carefully selected professional colors that complement the business type and brand identity'
    };
    
    return colorMap[colorScheme as keyof typeof colorMap] || 'Use appropriate professional colors that enhance brand recognition';
  }
}

export const openaiLogoService = OpenAILogoService.getInstance();