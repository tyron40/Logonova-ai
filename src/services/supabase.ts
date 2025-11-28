import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced validation functions
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function isValidSupabaseUrl(url: string): boolean {
  if (!url || !isValidUrl(url)) return false;
  // Check if it's a valid Supabase URL pattern
  return url.includes('supabase.co') || url.includes('localhost') || url.includes('127.0.0.1');
}

function isValidAnonKey(key: string): boolean {
  // Supabase anon keys typically start with 'eyJ' (base64 JWT)
  return key && key.length > 100 && key.startsWith('eyJ');
}

// Environment validation
function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is missing from environment variables');
  } else if (!isValidSupabaseUrl(supabaseUrl)) {
    errors.push(`VITE_SUPABASE_URL appears invalid: ${supabaseUrl}`);
  }
  
  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is missing from environment variables');
  } else if (!isValidAnonKey(supabaseAnonKey)) {
    errors.push('VITE_SUPABASE_ANON_KEY appears to be invalid format');
  }
  
  return { isValid: errors.length === 0, errors };
}

const envValidation = validateEnvironment();

// Only create client if we have the required environment variables
export const supabase = envValidation.isValid ? 
  createClient(supabaseUrl, supabaseAnonKey) : null;

if (!envValidation.isValid) {
  console.warn('⚠️ Supabase not configured - authentication features will be disabled');
  console.warn('To enable authentication:');
  console.warn('1. Create a .env file in your project root');
  console.warn('2. Add: VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.warn('3. Add: VITE_SUPABASE_ANON_KEY=your-anon-key');
  console.warn('4. Restart the development server');
}
export class SupabaseService {
  private static instance: SupabaseService;

  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  isAvailable(): boolean {
    return supabase !== null;
  }

  async signUp(email: string, password: string, username?: string) {
    if (!this.isAvailable()) {
      throw new Error('Supabase not configured. Please check your environment variables and restart the server.');
    }
    
    try {
      console.log('🔧 Supabase signUp called for:', email);
      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0]
          }
        }
      });
      
      console.log('📤 SignUp response:', { data, error });
      return { data, error };
    } catch (error) {
      console.error('SignUp error:', error);
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to Supabase. Please check your internet connection and Supabase URL.');
      }
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    if (!this.isAvailable()) {
      throw new Error('Supabase not configured. Please check your environment variables and restart the server.');
    }
    
    try {
      console.log('🔧 Supabase signIn called for:', email);
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('📤 SignIn response:', { data, error });
      return { data, error };
    } catch (error) {
      console.error('SignIn error:', error);
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to Supabase. Please check your internet connection and Supabase URL.');
      }
      throw error;
    }
  }

  async signOut() {
    if (!this.isAvailable()) {
      return { error: null };
    }
    
    try {
      const { error } = await supabase!.auth.signOut();
      return { error };
    } catch (error) {
      console.error('SignOut error:', error);
      return { error };
    }
  }

  async getCurrentUser() {
    if (!this.isAvailable()) {
      return null;
    }
    
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      return user;
    } catch (error) {
      console.warn('Error getting current user:', error);
      return null;
    }
  }

  // API Keys Management
  async getUserApiKeys(userId: string): Promise<UserApiKeys | null> {
    if (!this.isAvailable()) {
      console.warn('Supabase not available for getUserApiKeys');
    }
  }
}

export const supabaseService = SupabaseService.getInstance();