import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EnhanceRequest {
  companyName: string;
  description: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestData: EnhanceRequest = await req.json();
    const { companyName, description } = requestData;

    // First try to get user's API key from database
    const { data: userApiKeys, error: apiKeyError } = await supabase
      .from("user_api_keys")
      .select("openai_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    let openaiApiKey = userApiKeys?.openai_api_key;

    // Fallback to environment variable if user doesn't have their own key
    if (!openaiApiKey) {
      openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    }

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured. Please add your API key in settings." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const prompt = `You are a branding expert helping to enhance business descriptions for logo design.

Business Name: ${companyName}
Current Description: ${description || "(empty)"}

Task: Create a concise, professional description (2-3 sentences max, about 50-80 words) that captures:
1. What the business does
2. Key values or differentiators
3. Target audience or industry focus

Make it specific, memorable, and suitable for creating a distinctive logo. Use clear, descriptive language.

Provide ONLY the enhanced description text, no explanations or meta-commentary.`;

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a professional branding consultant who writes concise, impactful business descriptions for logo design."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json().catch(() => ({
        error: { message: "Unknown error" },
      }));
      return new Response(
        JSON.stringify({
          error: error.error?.message ?? "Enhancement failed",
        }),
        {
          status: openaiResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const enhancedDescription = openaiData.choices?.[0]?.message?.content?.trim();

    if (!enhancedDescription) {
      return new Response(
        JSON.stringify({ error: "No enhanced description returned" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ enhancedDescription }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Enhancement error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});