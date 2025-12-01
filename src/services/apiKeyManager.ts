// API Key Manager - now uses environment variables directly
export interface ApiKeys {
  openai?: string;
}

export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private initialized = false;

  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  async initializeForUser(userId: string | null) {
    console.log('Initializing API key manager...');
    this.initialized = true;
  }

  hasApiKey(keyType: 'openai'): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  }

  getApiKey(keyType: 'openai'): string | null {
    return import.meta.env.VITE_OPENAI_API_KEY || null;
  }

  async setApiKey(keyType: 'openai', apiKey: string) {
    console.log('API keys are managed through environment variables. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  getAllApiKeys(): ApiKeys {
    return {
      openai: this.getApiKey('openai')
    };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async clearApiKeys() {
    console.log('API keys are managed through environment variables.');
  }
}

export const apiKeyManager = ApiKeyManager.getInstance();