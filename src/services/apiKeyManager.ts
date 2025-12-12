import { supabaseService } from './supabase';

export interface ApiKeys {
  replicate?: string;
  openai?: string;
  gemini?: string;
  huggingFace?: string;
}

export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private currentUserId: string | null = null;
  private cachedKeys: ApiKeys = {};
  private initialized = false;

  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  async initializeForUser(userId: string | null) {
    console.log('Initializing API key manager for user:', userId);
    this.currentUserId = userId;
    this.cachedKeys = {};
    
    // Load environment keys first (highest priority)
    this.loadEnvironmentKeysAsFallback();
    
    // Load user-specific keys from localStorage
    this.loadLocalApiKeys();
    
    // Load from Supabase if available and user is logged in
    if (userId && supabaseService.isAvailable()) {
      try {
        await this.loadSupabaseApiKeys(userId);
      } catch (error) {
        console.warn('Failed to load Supabase API keys:', error);
      }
    }
    
    this.initialized = true;
    console.log('API key manager initialized. Available keys:', Object.keys(this.cachedKeys));
  }

  private loadEnvironmentKeysAsFallback() {
    // Load API keys from environment variables
    const envKeys = {
      openai: import.meta.env.VITE_OPENAI_API_KEY,
      replicate: import.meta.env.VITE_REPLICATE_API_TOKEN,
      gemini: import.meta.env.VITE_GEMINI_API_KEY,
      huggingFace: import.meta.env.VITE_HUGGING_FACE_API_KEY
    };

    // Only store non-empty keys
    Object.entries(envKeys).forEach(([key, value]) => {
      if (value && value.trim()) {
        this.cachedKeys[key as keyof ApiKeys] = value.trim();
        console.log(`Loaded ${key} API key from environment`);
      }
    });
  }

  private loadLocalApiKeys() {
    try {
      const storageKey = this.currentUserId ? `api-keys-${this.currentUserId}` : 'api-keys-guest';
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const localKeys = JSON.parse(stored);
        // Merge with existing keys (environment keys take precedence)
        Object.entries(localKeys).forEach(([key, value]) => {
          if (value && !this.cachedKeys[key as keyof ApiKeys]) {
            this.cachedKeys[key as keyof ApiKeys] = value as string;
            console.log(`Loaded ${key} API key from localStorage`);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load local API keys:', error);
    }
  }

  private async loadSupabaseApiKeys(userId: string) {
    try {
      const { data, error } = await supabaseService.getClient()
        .from('user_api_keys')
        .select('openai_api_key, replicate_api_key, gemini_api_key, hugging_face_api_key')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Failed to load Supabase API keys:', error);
        return;
      }

      if (data) {
        if (data.openai_api_key && !this.cachedKeys.openai) {
          this.cachedKeys.openai = data.openai_api_key;
          console.log('Loaded openai API key from Supabase');
        }
        if (data.replicate_api_key && !this.cachedKeys.replicate) {
          this.cachedKeys.replicate = data.replicate_api_key;
          console.log('Loaded replicate API key from Supabase');
        }
        if (data.gemini_api_key && !this.cachedKeys.gemini) {
          this.cachedKeys.gemini = data.gemini_api_key;
          console.log('Loaded gemini API key from Supabase');
        }
        if (data.hugging_face_api_key && !this.cachedKeys.huggingFace) {
          this.cachedKeys.huggingFace = data.hugging_face_api_key;
          console.log('Loaded huggingFace API key from Supabase');
        }
      }
    } catch (error) {
      console.warn('Failed to load Supabase API keys:', error);
    }
  }

  async setApiKey(keyType: 'replicate' | 'openai' | 'gemini' | 'huggingFace', apiKey: string) {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('API key cannot be empty');
    }

    // Validate API key format
    const validationRules = {
      openai: (key: string) => key.startsWith('sk-'),
      replicate: (key: string) => key.includes('-') && key.length > 20,
      gemini: (key: string) => key.startsWith('AIza') || key.length > 30,
      huggingFace: (key: string) => key.startsWith('hf_') || key.length > 20
    };

    const validator = validationRules[keyType];
    if (validator && !validator(apiKey.trim())) {
      throw new Error(`Invalid ${keyType} API key format`);
    }

    this.cachedKeys[keyType] = apiKey.trim();

    // Save to localStorage
    try {
      const storageKey = this.currentUserId ? `api-keys-${this.currentUserId}` : 'api-keys-guest';
      const currentStored = localStorage.getItem(storageKey);
      const storedKeys = currentStored ? JSON.parse(currentStored) : {};
      storedKeys[keyType] = apiKey.trim();
      localStorage.setItem(storageKey, JSON.stringify(storedKeys));
      console.log(`Saved ${keyType} API key to localStorage`);
    } catch (error) {
      console.warn(`Failed to save ${keyType} API key to localStorage:`, error);
    }

    // Save to Supabase if available and user is logged in
    if (this.currentUserId && supabaseService.isAvailable()) {
      try {
        await this.storeApiKeyToSupabase(keyType, apiKey.trim());
      } catch (error) {
        console.warn(`Failed to save ${keyType} API key to Supabase:`, error);
      }
    }
  }

  private async storeApiKeyToSupabase(keyType: string, apiKey: string) {
    try {
      const columnMap: Record<string, string> = {
        openai: 'openai_api_key',
        replicate: 'replicate_api_key',
        gemini: 'gemini_api_key',
        huggingFace: 'hugging_face_api_key'
      };

      const columnName = columnMap[keyType];
      if (!columnName) {
        console.warn(`Unknown key type: ${keyType}`);
        return;
      }

      const { error } = await supabaseService.getClient()
        .from('user_api_keys')
        .upsert({
          user_id: this.currentUserId,
          [columnName]: apiKey,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.warn(`Failed to save ${keyType} API key to Supabase:`, error);
      } else {
        console.log(`Saved ${keyType} API key to Supabase`);
      }
    } catch (error) {
      console.warn(`Failed to save ${keyType} API key to Supabase:`, error);
    }
  }

  getApiKey(keyType: 'replicate' | 'openai' | 'gemini' | 'huggingFace'): string | null {
    return this.cachedKeys[keyType] || null;
  }

  hasApiKey(keyType: 'replicate' | 'openai' | 'gemini' | 'huggingFace'): boolean {
    const key = this.getApiKey(keyType);
    return !!(key && key.trim());
  }

  getAllApiKeys(): ApiKeys {
    return { ...this.cachedKeys };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async clearApiKeys() {
    this.cachedKeys = {};
    
    // Clear from localStorage
    try {
      const storageKey = this.currentUserId ? `api-keys-${this.currentUserId}` : 'api-keys-guest';
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear localStorage API keys:', error);
    }

    // Clear from Supabase if available and user is logged in
    if (this.currentUserId && supabaseService.isAvailable()) {
      try {
        const { error } = await supabaseService.getClient()
          .from('user_api_keys')
          .update({
            openai_api_key: null,
            replicate_api_key: null,
            gemini_api_key: null,
            hugging_face_api_key: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', this.currentUserId);

        if (error) {
          console.warn('Failed to clear Supabase API keys:', error);
        } else {
          console.log('Cleared API keys from Supabase');
        }
      } catch (error) {
        console.warn('Failed to clear Supabase API keys:', error);
      }
    }
  }
}

export const apiKeyManager = ApiKeyManager.getInstance();