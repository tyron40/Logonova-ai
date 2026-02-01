import { supabase, supabaseService } from './supabase';

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
        // Silently fail
      }
    }

    this.initialized = true;
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
          }
        });
      }
    } catch (error) {
      // Silently fail
    }
  }

  private async loadSupabaseApiKeys(userId: string) {
    try {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('user_api_keys')
        .select('openai_api_key, replicate_api_key, gemini_api_key, hugging_face_api_key')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) return;

      if (data) {
        if (data.openai_api_key && !this.cachedKeys.openai) {
          this.cachedKeys.openai = data.openai_api_key;
        }
        if (data.replicate_api_key && !this.cachedKeys.replicate) {
          this.cachedKeys.replicate = data.replicate_api_key;
        }
        if (data.gemini_api_key && !this.cachedKeys.gemini) {
          this.cachedKeys.gemini = data.gemini_api_key;
        }
        if (data.hugging_face_api_key && !this.cachedKeys.huggingFace) {
          this.cachedKeys.huggingFace = data.hugging_face_api_key;
        }
      }
    } catch (error) {
      // Silently fail
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
    } catch (error) {
      // Silently fail
    }

    // Save to Supabase if available and user is logged in
    if (this.currentUserId && supabaseService.isAvailable()) {
      try {
        await this.storeApiKeyToSupabase(keyType, apiKey.trim());
      } catch (error) {
        // Silently fail
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
      if (!columnName) return;

      if (!supabase) return;

      await supabase
        .from('user_api_keys')
        .upsert({
          user_id: this.currentUserId,
          [columnName]: apiKey,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
    } catch (error) {
      // Silently fail
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
      // Silently fail
    }

    // Clear from Supabase if available and user is logged in
    if (this.currentUserId && supabaseService.isAvailable() && supabase) {
      try {
        await supabase
          .from('user_api_keys')
          .update({
            openai_api_key: null,
            replicate_api_key: null,
            gemini_api_key: null,
            hugging_face_api_key: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', this.currentUserId);
      } catch (error) {
        // Silently fail
      }
    }
  }
}

export const apiKeyManager = ApiKeyManager.getInstance();