import { supabase } from './supabase';

export interface LogoGenerationRequest {
  companyName: string;
  industry: string;
  style: string;
  colorScheme: string;
  description: string;
  keywords: string[];
}

export class OpenAILogoService {
  private static instance: OpenAILogoService;

  static getInstance(): OpenAILogoService {
    if (!OpenAILogoService.instance) {
      OpenAILogoService.instance = new OpenAILogoService();
    }
    return OpenAILogoService.instance;
  }

  async generateLogo(request: LogoGenerationRequest): Promise<string> {
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("You must be logged in to generate logos");
      }

      // Call the Vercel API
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
      const apiUrl = `${apiBaseUrl}/api/generate-logo-with-credits`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(error.error ?? "Image generation failed.");
      }

      const data = await response.json();
      return data.imageUrl ?? "";
    } catch (err) {
      console.error("Logo Generation Error:", err);
      throw new Error(err instanceof Error ? err.message : "Failed to generate logo. Try again.");
    }
  }

  async generateBusinessKeywords(companyName: string, description: string): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("You must be logged in to use AI enhancement");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const apiUrl = `${supabaseUrl}/functions/v1/enhance-description`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
        },
        body: JSON.stringify({
          companyName,
          description: description || "",
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Enhancement failed" }));
        throw new Error(error.error ?? "Failed to enhance description");
      }

      const data = await response.json();
      return data.enhancedDescription ?? description;
    } catch (err) {
      console.error("Description Enhancement Error:", err);
      throw new Error(err instanceof Error ? err.message : "Failed to enhance description");
    }
  }
}

export const openaiLogoService = OpenAILogoService.getInstance();
