import { LogoStyle } from '../types';

export const logoStyles: LogoStyle[] = [
  {
    id: 'modern',
    name: 'Modern Minimalist',
    description: 'Clean geometric shapes, negative space, contemporary typography with perfect balance',
    preview: 'M'
  },
  {
    id: 'luxury',
    name: 'Luxury Premium',
    description: 'Sophisticated elegance, gold accents, premium typography, high-end aesthetic',
    preview: 'L'
  },
  {
    id: 'tech',
    name: 'Tech Innovation',
    description: 'Futuristic elements, circuit patterns, digital aesthetics, cutting-edge design',
    preview: 'T'
  },
  {
    id: 'organic',
    name: 'Organic Natural',
    description: 'Flowing curves, nature-inspired, earth tones, sustainable design language',
    preview: 'O'
  },
  {
    id: 'bold',
    name: 'Bold Impact',
    description: 'Strong typography, high contrast, powerful presence, memorable design',
    preview: 'B'
  },
  {
    id: 'elegant',
    name: 'Elegant Refined',
    description: 'Graceful curves, sophisticated palette, timeless appeal, premium feel',
    preview: 'E'
  },
  {
    id: 'creative',
    name: 'Creative Artistic',
    description: 'Unique artistic elements, creative typography, imaginative concepts, standout design',
    preview: 'C'
  },
  {
    id: 'corporate',
    name: 'Corporate Professional',
    description: 'Trust-building design, professional typography, business-appropriate, reliable feel',
    preview: 'P'
  }
];

export const industries = [
  'Technology & Software', 'Finance & Banking', 'Healthcare & Medical', 'Education & Learning', 
  'Retail & E-commerce', 'Food & Beverage', 'Real Estate & Property', 'Consulting & Services',
  'Marketing & Advertising', 'Manufacturing & Industrial', 'Entertainment & Media', 'Fashion & Beauty',
  'Sports & Fitness', 'Travel & Tourism', 'Automotive & Transportation', 'Energy & Sustainability',
  'Non-profit & Charity', 'Startup & Innovation', 'Legal & Law', 'Architecture & Design',
  'Photography & Creative', 'Music & Audio', 'Gaming & Esports', 'Wellness & Spa'
];

export const colorSchemes = [
  { 
    id: 'royal-blue', 
    name: 'Royal Blue', 
    colors: ['#1E3A8A', '#3B82F6', '#60A5FA'],
    description: 'Trust, professionalism, reliability'
  },
  { 
    id: 'emerald-luxury', 
    name: 'Emerald Luxury', 
    colors: ['#064E3B', '#10B981', '#34D399'],
    description: 'Growth, prosperity, premium quality'
  },
  { 
    id: 'sunset-gradient', 
    name: 'Sunset Gradient', 
    colors: ['#EA580C', '#F59E0B', '#FCD34D'],
    description: 'Energy, creativity, warmth'
  },
  { 
    id: 'purple-innovation', 
    name: 'Purple Innovation', 
    colors: ['#581C87', '#8B5CF6', '#A78BFA'],
    description: 'Innovation, creativity, technology'
  },
  { 
    id: 'rose-elegance', 
    name: 'Rose Elegance', 
    colors: ['#BE185D', '#EC4899', '#F472B6'],
    description: 'Elegance, beauty, sophistication'
  },
  { 
    id: 'teal-modern', 
    name: 'Teal Modern', 
    colors: ['#0F766E', '#14B8A6', '#2DD4BF'],
    description: 'Modern, fresh, innovative'
  },
  { 
    id: 'crimson-bold', 
    name: 'Crimson Bold', 
    colors: ['#991B1B', '#EF4444', '#F87171'],
    description: 'Power, passion, boldness'
  },
  { 
    id: 'gold-premium', 
    name: 'Gold Premium', 
    colors: ['#92400E', '#D97706', '#FBBF24'],
    description: 'Luxury, premium, excellence'
  },
  { 
    id: 'monochrome-classic', 
    name: 'Monochrome Classic', 
    colors: ['#111827', '#374151', '#6B7280'],
    description: 'Timeless, sophisticated, versatile'
  },
  { 
    id: 'ocean-depth', 
    name: 'Ocean Depth', 
    colors: ['#1E40AF', '#3B82F6', '#06B6D4'],
    description: 'Depth, stability, trust'
  }
];

export const logoTypes = [
  {
    id: 'wordmark',
    name: 'Wordmark',
    description: 'Typography-focused design with stylized company name',
    weight: 0.25
  },
  {
    id: 'lettermark',
    name: 'Lettermark',
    description: 'Monogram or initials-based design',
    weight: 0.15
  },
  {
    id: 'pictorial',
    name: 'Pictorial Mark',
    description: 'Iconic symbol or graphic representation',
    weight: 0.20
  },
  {
    id: 'abstract',
    name: 'Abstract Mark',
    description: 'Abstract geometric or artistic symbol',
    weight: 0.15
  },
  {
    id: 'combination',
    name: 'Combination Mark',
    description: 'Text and symbol working together',
    weight: 0.20
  },
  {
    id: 'emblem',
    name: 'Emblem',
    description: 'Text inside symbol or badge-style design',
    weight: 0.05
  }
];