import { LogoConfig } from '../types';

export function enhancePrompt(config: LogoConfig): string {
  const styleDescriptions = {
    modern: 'clean, minimalist, geometric, contemporary',
    vintage: 'retro, classic, ornate, traditional, timeless',
    tech: 'futuristic, digital, innovative, cutting-edge, high-tech',
    organic: 'natural, flowing, organic, curved, earth-inspired',
    bold: 'strong, impactful, powerful, dynamic, striking',
    elegant: 'sophisticated, refined, luxury, premium, graceful'
  };

  const colorDescriptions = {
    blue: 'professional blue tones, navy, azure',
    purple: 'creative purple, violet, lavender',
    green: 'growth green, emerald, forest',
    orange: 'energetic orange, amber, sunset',
    red: 'bold red, crimson, scarlet',
    pink: 'vibrant pink, magenta, rose',
    teal: 'modern teal, turquoise, cyan',
    indigo: 'deep indigo, midnight blue',
    gray: 'sophisticated gray, charcoal, silver',
    black: 'classic black, monochrome, elegant'
  };

  const styleDesc = styleDescriptions[config.style as keyof typeof styleDescriptions] || 'professional';
  const colorDesc = colorDescriptions[config.colorScheme as keyof typeof colorDescriptions] || 'professional colors';

  const keywordsText = config.keywords.length > 0 ? `, incorporating themes of ${config.keywords.join(', ')}` : '';
  const descriptionText = config.description ? `, representing ${config.description}` : '';

  return `A high-quality vector logo for a ${config.industry.toLowerCase()} company named "${config.companyName}". Style: ${styleDesc}. Colors: ${colorDesc}${descriptionText}${keywordsText}. Professional branding, clean design, scalable, white background, logo design`;
}