export interface LogoStyle {
  id: string;
  name: string;
  description: string;
  preview: string;
}

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

export interface LogoConfig {
  id: string;
  companyName: string;
  industry: string;
  style: string;
  colorScheme: string;
  description: string;
  keywords: string[];
  generatedLogos: GeneratedLogo[];
  selectedLogo: GeneratedLogo | null;
  createdAt: Date;
}

export interface ExportFormat {
  format: 'png' | 'svg' | 'pdf' | 'jpg';
  size: 'small' | 'medium' | 'large' | 'xl';
  quality: 'standard' | 'high' | 'ultra';
  transparent: boolean;
}

export interface LogoPrompt {
  companyName: string;
  industry: string;
  style: string;
  colorScheme: string;
  description: string;
  keywords: string[];
}