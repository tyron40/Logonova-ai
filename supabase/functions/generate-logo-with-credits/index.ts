import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LogoGenerationRequest {
  companyName: string;
  industry: string;
  style: string;
  colorScheme: string;
  description: string;
  keywords: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get auth token from request
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

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
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

    // Check user has credits
    const { data: apiKey, error: apiKeyError } = await supabase
      .from("user_api_keys")
      .select("credit_balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (apiKeyError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch user credits" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const currentCredits = apiKey?.credit_balance ?? 0;

    if (currentCredits < 1) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits. Please purchase more credits to continue." }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const requestData: LogoGenerationRequest = await req.json();

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build the logo prompt
    const prompt = buildLogoPrompt(requestData);

    // Call OpenAI API
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          size: "1024x1024",
          quality: "hd",
          n: 1,
          response_format: "url",
        }),
      }
    );

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json().catch(() => ({
        error: { message: "Unknown error" },
      }));
      return new Response(
        JSON.stringify({
          error: error.error?.message ?? "Image generation failed",
        }),
        {
          status: openaiResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const imageUrl = openaiData.data?.[0]?.url;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "No image URL returned from OpenAI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Deduct credit from user
    const newBalance = currentCredits - 1;
    const { error: updateError } = await supabase
      .from("user_api_keys")
      .update({ credit_balance: newBalance })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to deduct credit:", updateError);
      // Still return the image, but log the error
    }

    // Log the transaction
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      transaction_type: "deduction",
      credits_amount: -1,
      description: `Logo generation for ${requestData.companyName}`,
    });

    return new Response(
      JSON.stringify({ imageUrl, creditsRemaining: newBalance }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Logo generation error:", error);
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

function buildLogoPrompt(req: LogoGenerationRequest): string {
  const { companyName, description, industry, style, colorScheme, keywords } =
    req;

  const styleInfo = getStyleModifiers(style);
  const colors = getColorPalette(colorScheme);
  const industryImagery = getIndustrySpecificImagery(description);

  return `
You are a world-class brand identity designer creating a single logo for a real client.

==============================
BUSINESS CONTEXT
==============================
Business Name: "${companyName}"
Industry: ${industry}
Description: ${description}
Brand Attributes: ${keywords.join(", ") || "clear, memorable, professional"}

==============================
DESIGN GOAL
==============================
Create ONE (1) finished, production-ready logo for "${companyName}" that:
• looks clean, modern, and professional,
• works as a standalone mark on websites, apps, and merchandise,
• feels instantly recognizable and memorable.

Style: ${styleInfo}
Color Palette: ${colors}

Suggested symbolic imagery (optional but coherent):
• ${industryImagery.join(", ") || "industry-appropriate simple symbol"}

==============================
HARD STRUCTURE RULES (NON-NEGOTIABLE)
==============================
• The image MUST contain EXACTLY ONE logo in the center of the canvas.
• The logo must be a flat, vector-style design with crisp lines and smooth curves.
• The composition must be a SINGLE compact logo unit, not a layout or poster.
• The canvas must NOT be split into panels, halves, or sections.
• Do NOT create rows of icons, extra symbols, or brand sheets.
• Do NOT place multiple versions of the logo anywhere in the image.
• Keep generous clean space around the logo; no cluttered edges.

==============================
TEXT RULES (NON-NEGOTIABLE)
==============================
• The visible text MUST be exactly: "${companyName}".
• Spell "${companyName}" perfectly — no typos, no alternate spellings.
• Do NOT use initials or monograms instead of the full name.
• Do NOT add taglines or generic words like "professional", "brand", "studio", etc.
• No placeholder text, lorem ipsum, or random characters.
• There must be NO other words or numbers besides "${companyName}".

TEXT TO RENDER (STRICT):
"${companyName}"

==============================
FORBIDDEN ELEMENTS (NEGATIVE PROMPT)
==============================
Do NOT include any of the following:
• mockups, stationery, business cards, posters, signage, billboards
• t-shirts, hats, packaging, boxes, bags, stickers, labels
• photos of paper, notebooks, or any physical object
• UI screens, app windows, device frames, buttons
• multiple logos, thumbnails, grids, alternate variations, or icon rows
• separate decorative icons under or above the logo
• complex scenes, environments, rooms, or backgrounds with objects
• people, hands, bodies, faces, or characters
• watermarks, QR codes, barcodes, tiny legal text
• random letters, misspelled text, or meaningless symbols

==============================
FINAL OUTPUT
==============================
Produce ONE centered logo for "${companyName}" on a plain or subtle gradient background:
• clean vector-like rendering,
• sharp and readable text,
• coherent symbolism related to ${industry || "the business"},
• polished, balanced, and ready to use as a brand logo.
`.trim();
}

function getStyleModifiers(style: string): string {
  const map: Record<string, string> = {
    modern: "modern minimalist with clean geometry and strong visual hierarchy",
    classic:
      "classic timeless with balanced symmetry and refined typography",
    bold: "bold impactful with heavy strokes and high contrast",
    creative: "creative expressive with distinctive, imaginative shapes",
    minimal: "ultra-minimal with maximum simplicity and negative space",
  };
  return map[style] ?? "professional, balanced, brand-ready styling";
}

function getColorPalette(color: string): string {
  const map: Record<string, string> = {
    blue: "trustworthy, professional blue tones with crisp contrast",
    green:
      "natural and financial greens representing growth and stability",
    purple:
      "creative purple and violet tones suggesting innovation and premium feel",
    orange: "warm energetic orange hues conveying friendliness and enthusiasm",
    red: "bold red tones emphasizing energy and power",
    black: "high-contrast monochrome palette with black, white, and gray",
  };
  return map[color] ?? "a clean, modern, brand-appropriate color palette";
}

function getIndustrySpecificImagery(raw: string): string[] {
  const desc = raw.toLowerCase();
  const list: string[] = [];

  if (
    desc.includes("burger") ||
    desc.includes("restaurant") ||
    desc.includes("food")
  ) {
    list.push("single stylized burger icon", "simple culinary emblem");
  }

  if (desc.includes("candy") || desc.includes("sweet")) {
    list.push("single lollipop swirl", "minimal candy icon");
  }

  if (desc.includes("skate") || desc.includes("skateboard")) {
    list.push(
      "single skateboard deck symbol",
      "simple wheel-and-truck emblem"
    );
  }

  if (
    desc.includes("tech") ||
    desc.includes("software") ||
    desc.includes("app")
  ) {
    list.push("geometric digital core symbol", "circuit-inspired emblem");
  }

  if (
    desc.includes("fitness") ||
    desc.includes("gym") ||
    desc.includes("training")
  ) {
    list.push("strong athletic silhouette", "dynamic motion lines");
  }

  if (
    desc.includes("beauty") ||
    desc.includes("spa") ||
    desc.includes("salon")
  ) {
    list.push("elegant floral curves", "soft feminine line-art");
  }

  if (
    desc.includes("finance") ||
    desc.includes("bank") ||
    desc.includes("investment")
  ) {
    list.push("upward growth arrow", "shield of trust emblem");
  }

  if (
    desc.includes("strip") ||
    desc.includes("gentlemen") ||
    desc.includes("nightclub") ||
    desc.includes("club") ||
    desc.includes("bar")
  ) {
    list.push(
      "tasteful abstract silhouette",
      "neon nightlife badge",
      "subtle spotlight accents"
    );
  }

  return list;
}
