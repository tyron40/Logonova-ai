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
    this.initialized = false;

    try {
      // Always load from local storage and environment
      this.loadLocalApiKeys();

      // Load environment keys as fallback
      this.loadEnvironmentKeysAsFallback();
      this.initialized = true;
      console.log('API key manager initialized successfully');
    } catch (error) {
      console.error('Error initializing API key manager:', error);
      // Fallback to environment and local keys
      this.loadLocalApiKeys();
      this.loadEnvironmentKeysAsFallback();
      this.initialized = true;
    }
  }

  private loadEnvironmentKeysAsFallback() {
    const envKeys = {
      replicate: import.meta.env.VITE_REPLICATE_API_TOKEN,
      openai: import.meta.env.VITE_OPENAI_API_KEY,
      gemini: import.meta.env.VITE_GEMINI_API_KEY,
      huggingFace: import.meta.env.VITE_HUGGING_FACE_API_KEY
    };

    // Only use environment variables if no user keys are set
    Object.entries(envKeys).forEach(([key, value]) => {
      if (value && value.trim() !== '' && !this.cachedKeys[key as keyof ApiKeys]) {
        this.cachedKeys[key as keyof ApiKeys] = value;
        console.log(`Using environment ${key} API key as fallback`);
      }
    });
  }

  private loadLocalApiKeys() {
    console.log('Loading API keys from localStorage');
    const localKeys = {
      replicate: localStorage.getItem('replicate_api_key'),
      openai: localStorage.getItem('openai_api_key'),
      gemini: localStorage.getItem('gemini_api_key'),
      huggingFace: localStorage.getItem('hugging_face_api_key')
    };

    Object.entries(localKeys).forEach(([key, value]) => {
      if (value && value.trim() !== '' && !this.cachedKeys[key as keyof ApiKeys]) {
        this.cachedKeys[key as keyof ApiKeys] = value;
        console.log(`Using localStorage ${key} API key`);
      }
    });
  }

  async setApiKey(keyType: 'replicate' | 'gemini' | 'huggingFace', apiKey: string) {
  }
  async setApiKey(keyType: 'replicate' | 'openai' | 'gemini' | 'huggingFace', apiKey: string) {
    console.log(`Setting ${keyType} API key`);
    this.cachedKeys[keyType] = apiKey;

    // Save to localStorage as backup
    const localStorageKey = `${keyType === 'huggingFace' ? 'hugging_face' : keyType}_api_key`;
    localStorage.setItem(localStorageKey, apiKey);

    console.log(`${keyType} API key saved to localStorage`);
  }

  // Remove Supabase storage methods
  async storeEnvironmentKeysToSupabase() {
    console.log('API keys stored locally only');
  }

  getApiKey(keyType: 'replicate' | 'gemini' | 'huggingFace'): string | null {
  }
  getApiKey(keyType: 'replicate' | 'openai' | 'gemini' | 'huggingFace'): string | null {
    return this.cachedKeys[keyType] || null;
  }

  hasApiKey(keyType: 'replicate' | 'gemini' | 'huggingFace'): boolean {
  }
  hasApiKey(keyType: 'replicate' | 'openai' | 'gemini' | 'huggingFace'): boolean {
    const key = this.getApiKey(keyType);
    return key !== null && key.trim() !== '';
  }

  getAllApiKeys(): ApiKeys {
    return { ...this.cachedKeys };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async clearApiKeys() {
    this.cachedKeys = {};
    
    // Clear localStorage
    localStorage.removeItem('replicate_api_key');
    localStorage.removeItem('openai_api_key');
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('hugging_face_api_key');

    console.log('API keys cleared from localStorage');
  }
}

export const apiKeyManager = ApiKeyManager.getInstance();