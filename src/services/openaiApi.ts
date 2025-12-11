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

      // Call the edge function
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-logo-with-credits`;

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
    throw new Error("Description enhancement is currently unavailable. Please write your own description.");
  }
}

export const openaiLogoService = OpenAILogoService.getInstance();
