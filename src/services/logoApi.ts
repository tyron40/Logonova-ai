import { openaiLogoService } from './openaiApi';

export interface GeneratedLogo {
  id: string;
  imageUrl: string;
  prompt: string;
  style: string;
  companyName: string;
  industry: string;
  colors: string[];
  createdAt: Date;
}

export interface LogoPrompt {
  companyName: string;
  industry: string;
  style: string;
  colorScheme: string;
  description: string;
  keywords: string[];
}

export class LogoGenerationService {
  private static instance: LogoGenerationService;
  private cache: Map<string, GeneratedLogo[]> = new Map();

  static getInstance(): LogoGenerationService {
    if (!LogoGenerationService.instance) {
      LogoGenerationService.instance = new LogoGenerationService();
    }
    return LogoGenerationService.instance;
  }

  async generateLogos(prompt: LogoPrompt, count: number = 4): Promise<GeneratedLogo[]> {
    const cacheKey = this.createCacheKey(prompt);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Generate single professional logo with OpenAI
      const logoUrl = await openaiLogoService.generateLogo({
        companyName: prompt.companyName,
        industry: prompt.industry,
        style: prompt.style,
        colorScheme: prompt.colorScheme,
        description: prompt.description,
        keywords: prompt.keywords
      });

      const logo: GeneratedLogo = {
        id: crypto.randomUUID(),
        imageUrl: logoUrl,
        prompt: this.buildLogoPrompt(prompt, 0),
        style: prompt.style,
        companyName: prompt.companyName,
        industry: prompt.industry,
        colors: this.extractColors(prompt.colorScheme),
        createdAt: new Date()
      };

      const logos = [logo];
      
      // Cache the results
      this.cache.set(cacheKey, logos);
      
      return logos;
    } catch (error) {
      console.error('Logo generation failed:', error);
      throw new Error(`Logo generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildLogoPrompt(prompt: LogoPrompt, variation: number): string {
    const styleVariations = {
      modern: ['minimalist', 'clean', 'geometric', 'sleek'],
      vintage: ['retro', 'classic', 'ornate', 'traditional'],
      tech: ['futuristic', 'digital', 'innovative', 'cutting-edge'],
      organic: ['natural', 'flowing', 'organic', 'curved'],
      bold: ['strong', 'impactful', 'powerful', 'dynamic'],
      elegant: ['sophisticated', 'refined', 'luxury', 'premium']
    };

    const styleModifier = styleVariations[prompt.style as keyof typeof styleVariations]?.[variation % 4] || 'professional';
    
    return `Professional ${styleModifier} logo for ${prompt.companyName}, ${prompt.industry} company, ${prompt.colorScheme} color scheme, ${prompt.description}, featuring ${prompt.keywords.join(', ')}, vector style, clean design, scalable, brand identity`;
  }

  private extractColors(colorScheme: string): string[] {
    const palettes = {
      'royal-blue': ['#1E3A8A', '#3B82F6', '#60A5FA'],
      'emerald-luxury': ['#064E3B', '#10B981', '#34D399'],
      'sunset-gradient': ['#EA580C', '#F59E0B', '#FCD34D'],
      'purple-innovation': ['#581C87', '#8B5CF6', '#A78BFA'],
      'rose-elegance': ['#BE185D', '#EC4899', '#F472B6'],
      'teal-modern': ['#0F766E', '#14B8A6', '#2DD4BF'],
      'crimson-bold': ['#991B1B', '#EF4444', '#F87171'],
      'gold-premium': ['#92400E', '#D97706', '#FBBF24'],
      'monochrome-classic': ['#111827', '#374151', '#6B7280'],
      'ocean-depth': ['#1E40AF', '#3B82F6', '#06B6D4'],
      'blue-modern': ['#2563eb', '#1e40af', '#60a5fa'],
      'green-growth': ['#059669', '#10b981', '#34d399']
    };
    
    return palettes[colorScheme as keyof typeof palettes] || palettes['royal-blue'];
  }

  private createCacheKey(prompt: LogoPrompt): string {
    return `${prompt.companyName}-${prompt.industry}-${prompt.style}-${prompt.colorScheme}`;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const logoService = LogoGenerationService.getInstance();