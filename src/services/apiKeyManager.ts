import { supabase } from '../lib/supabase';

export interface ApiKeys {
  replicate?: string;
  openai?: string;
  gemini?: string;
  huggingFace?: string;
}

export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private cachedKeys: ApiKeys = {};
  private initialized = false;

  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  async initializeForUser(_userId: string | null) {
    this.cachedKeys = {};
    this.loadEnvironmentKeys();
    this.loadLocalApiKeys();

    if (_userId) {
      await this.loadDatabaseApiKeys(_userId);
      await this.syncEnvironmentToDatabase(_userId);
    }

    this.initialized = true;
  }

  private loadEnvironmentKeys() {
    const envKeys = {
      openai: import.meta.env.VITE_OPENAI_API_KEY,
      replicate: import.meta.env.VITE_REPLICATE_API_KEY,
      gemini: import.meta.env.VITE_GEMINI_API_KEY,
      huggingFace: import.meta.env.VITE_HUGGING_FACE_API_KEY
    };

    Object.entries(envKeys).forEach(([key, value]) => {
      if (value && value.trim()) {
        this.cachedKeys[key as keyof ApiKeys] = value.trim();
      }
    });
  }

  private loadLocalApiKeys() {
    try {
      const stored = localStorage.getItem('api-keys');
      if (stored) {
        const localKeys = JSON.parse(stored);
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

  private async loadDatabaseApiKeys(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('openai_api_key')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data?.openai_api_key) {
        if (!this.cachedKeys.openai) {
          this.cachedKeys.openai = data.openai_api_key;
        }
      }
    } catch (error) {
      console.error('Error loading API keys from database:', error);
    }
  }

  private async syncEnvironmentToDatabase(userId: string) {
    try {
      const envOpenAIKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (envOpenAIKey && envOpenAIKey.trim()) {
        const { data } = await supabase
          .from('user_api_keys')
          .select('openai_api_key')
          .eq('user_id', userId)
          .maybeSingle();

        if (!data?.openai_api_key) {
          await supabase
            .from('user_api_keys')
            .upsert({
              user_id: userId,
              openai_api_key: envOpenAIKey.trim()
            }, {
              onConflict: 'user_id'
            });
        }
      }
    } catch (error) {
      console.error('Error syncing API key to database:', error);
    }
  }

  async setApiKey(keyType: 'replicate' | 'openai' | 'gemini' | 'huggingFace', apiKey: string) {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('API key cannot be empty');
    }

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

    try {
      const currentStored = localStorage.getItem('api-keys');
      const storedKeys = currentStored ? JSON.parse(currentStored) : {};
      storedKeys[keyType] = apiKey.trim();
      localStorage.setItem('api-keys', JSON.stringify(storedKeys));
    } catch (error) {
      // Silently fail
    }

    if (keyType === 'openai') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_api_keys')
          .upsert({
            user_id: user.id,
            openai_api_key: apiKey.trim()
          }, {
            onConflict: 'user_id'
          });
      }
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

  clearApiKeys() {
    this.cachedKeys = {};
    try {
      localStorage.removeItem('api-keys');
    } catch (error) {
      // Silently fail
    }
  }
}

export const apiKeyManager = ApiKeyManager.getInstance();