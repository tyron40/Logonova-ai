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

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    username?: string;
    [key: string]: any;
  };
  app_metadata?: {
    [key: string]: any;
  };
  created_at?: string;
  email_confirmed_at?: string | null;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: 'purchase' | 'deduction' | 'refund';
  credits_amount: number;
  stripe_payment_intent_id?: string;
  stripe_session_id?: string;
  description?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  subscription_id?: string;
  price_id?: string;
  subscription_status?: string;
  status?: string;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  payment_method_brand?: string;
  payment_method_last4?: string;
  created_at: string;
  updated_at: string;
}