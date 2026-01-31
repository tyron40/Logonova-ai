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

  initializeForUser(_userId: string | null) {
    this.cachedKeys = {};
    this.loadEnvironmentKeys();
    this.loadLocalApiKeys();
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

  setApiKey(keyType: 'replicate' | 'openai' | 'gemini' | 'huggingFace', apiKey: string) {
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