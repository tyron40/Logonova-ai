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
      console.log('🚀 Starting logo generation...', request);

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 Session check:', session ? 'Authenticated' : 'Not authenticated');

      if (!session) {
        throw new Error("You must be logged in to generate logos");
      }

      // Call the Supabase Edge Function (has longer timeout than Vercel)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/generate-logo-with-credits`;
      console.log('📡 Calling Supabase Edge Function:', apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      console.log('📥 API Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error('❌ API Error:', error);
        throw new Error(error.error ?? "Image generation failed.");
      }

      const data = await response.json();
      console.log('✅ Logo generated successfully:', data.imageUrl ? 'URL received' : 'No URL');
      return data.imageUrl ?? "";
    } catch (err) {
      console.error("❌ Logo Generation Error:", err);
      throw new Error(err instanceof Error ? err.message : "Failed to generate logo. Try again.");
    }
  }

  async generateBusinessKeywords(companyName: string, description: string): Promise<string> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("You must be logged in to use AI enhancement");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/enhance-description`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          description: description || "",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Enhancement failed";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
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
