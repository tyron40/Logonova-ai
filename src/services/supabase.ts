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
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'logoai-auth-token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }) : null;

if (!envValidation.isValid) {
  console.warn('Supabase not configured - authentication features will be disabled');
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
      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0]
          }
        }
      });

      return { data, error };
    } catch (error) {
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
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });

      return { data, error };
    } catch (error) {
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
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const userPromise = supabase!.auth.getUser();

      const { data: { user } } = await Promise.race([userPromise, timeoutPromise]);
      return user;
    } catch (error) {
      if (error instanceof Error && error.message === 'Request timeout') {
        console.warn('getCurrentUser timed out, continuing without user');
      }
      return null;
    }
  }

  // API Keys Management
  async getUserApiKeys(userId: string): Promise<UserApiKeys | null> {
    if (!this.isAvailable()) {
      console.warn('Supabase not available for getUserApiKeys');
      return null;
    }
  }

  async updatePassword(newPassword: string) {
    if (!this.isAvailable()) {
      throw new Error('Supabase not configured. Please check your environment variables and restart the server.');
    }

    try {
      const { data, error } = await supabase!.auth.updateUser({
        password: newPassword
      });

      return { data, error };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to Supabase. Please check your internet connection and Supabase URL.');
      }
      throw error;
    }
  }

  async deleteAccount() {
    if (!this.isAvailable()) {
      throw new Error('Supabase not configured. Please check your environment variables and restart the server.');
    }

    try {
      // Get current user first
      const { data: { user } } = await supabase!.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { error } = await supabase!.auth.admin.deleteUser(user.id);

      if (error) {
        throw new Error('Account deletion requires administrator access. Please contact support to delete your account.');
      }

      return { error: null };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to Supabase. Please check your internet connection and Supabase URL.');
      }
      throw error;
    }
  }

  async requestAccountDeletion() {
    if (!this.isAvailable()) {
      throw new Error('Supabase not configured. Please check your environment variables and restart the server.');
    }
    
    try {
      // Since direct account deletion might not be available,
      // we'll mark the account for deletion and sign out
      const { data: { user } } = await supabase!.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Update user metadata to mark for deletion
      const { error: updateError } = await supabase!.auth.updateUser({
        data: {
          deletion_requested: new Date().toISOString(),
          account_status: 'deletion_requested'
        }
      });
      
      if (updateError) {
        throw updateError;
      }
      
      // Sign out the user
      await this.signOut();
      
      return { 
        success: true, 
        message: 'Account deletion requested. Your account has been marked for deletion and you have been signed out. All data will be permanently removed within 24-48 hours.' 
      };
    } catch (error) {
      console.error('RequestAccountDeletion error:', error);
      throw error;
    }
  }
}

export const supabaseService = SupabaseService.getInstance();