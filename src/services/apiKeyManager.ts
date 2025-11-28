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
    console.log('API key manager deprecated - using tRPC backend for API calls');
    this.currentUserId = userId;
    this.cachedKeys = {};
    this.initialized = true;
  }

  private loadEnvironmentKeysAsFallback() {
    // API keys now handled securely by tRPC backend
    console.log('Environment keys deprecated - using tRPC backend');
  }

  private loadLocalApiKeys() {
    // Local storage API keys deprecated - using tRPC backend
    console.log('Local API keys deprecated - using tRPC backend');
  }

  async setApiKey(keyType: 'replicate' | 'gemini' | 'huggingFace', apiKey: string) {
  }
  async setApiKey(keyType: 'replicate' | 'openai' | 'gemini' | 'huggingFace', apiKey: string) {
    console.log(`API keys now managed securely by tRPC backend`);
  }

  // Remove Supabase storage methods
  async storeEnvironmentKeysToSupabase() {
    console.log('API keys managed by tRPC backend');
  }

  getApiKey(keyType: 'replicate' | 'gemini' | 'huggingFace'): string | null {
  }
  getApiKey(keyType: 'replicate' | 'openai' | 'gemini' | 'huggingFace'): string | null {
    // API keys now handled by tRPC backend
    return null;
  }

  hasApiKey(keyType: 'replicate' | 'gemini' | 'huggingFace'): boolean {
  }
  hasApiKey(keyType: 'replicate' | 'openai' | 'gemini' | 'huggingFace'): boolean {
    // Always return true since tRPC backend handles API keys
    return true;
  }

  getAllApiKeys(): ApiKeys {
    return {}; // API keys managed by tRPC backend
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async clearApiKeys() {
    console.log('API keys managed by tRPC backend - no local clearing needed');
  }
}

export const apiKeyManager = ApiKeyManager.getInstance();