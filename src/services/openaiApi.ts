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

  private getApiKey(): string | null {
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envKey) return envKey;
    return localStorage.getItem("openai-api-key");
  }

  private hasValidApiKey(): boolean {
    const apiKey = this.getApiKey();
    return !!(apiKey && apiKey.startsWith("sk-"));
  }

  async generateLogo(request: LogoGenerationRequest): Promise<string> {
    if (!this.hasValidApiKey()) throw new Error("OpenAI API key is required.");

    const apiKey = this.getApiKey()!;
    const prompt = this.buildLogoPrompt(request);

    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          size: "1024x1024",
          quality: "hd",
          n: 1,
          response_format: "url"
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
        throw new Error(error.error?.message ?? "Image generation failed.");
      }

      const data = await response.json();
      return data.data?.[0]?.url ?? "";
    } catch (err) {
      console.error("Logo Generation Error:", err);
      throw new Error("Failed to generate logo. Try again.");
    }
  }

  async generateBusinessKeywords(companyName: string, description: string): Promise<string> {
    if (!this.hasValidApiKey()) throw new Error("OpenAI API key required.");

    const apiKey = this.getApiKey()!;
    const prompt = `
      Improve this business description for branding:
      Business: "${companyName}"
      Description: "${description}"
      Return ONLY a polished business description with no extra explanations.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You refine and enhance business descriptions for branding and logo creation."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 200
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  }

  // ------------------------------
  // SYMBOL / INDUSTRY HELPERS
  // ------------------------------

  private getNightlifeImagery(description: string): string[] {
    const desc = description.toLowerCase();
    const list: string[] = [];

    if (desc.includes("strip") || desc.includes("gentlemen"))
      list.push(
        "abstract dancer silhouette (non-nude)",
        "minimal pole-dance icon",
        "neon nightclub outline",
        "spotlight glow"
      );

    if (desc.includes("nightclub") || desc.includes("bar"))
      list.push("neon cocktail icon", "VIP badge", "nightlife neon border");

    return list;
  }

  private getIndustrySpecificImagery(description: string, industry: string) {
    const desc = description.toLowerCase();
    const list: string[] = [];

    if (desc.includes("burger"))
      list.push("burger icon", "chef hat emblem", "restaurant badge");

    if (desc.includes("food"))
      list.push("culinary tools", "fork and knife badge");

    if (desc.includes("tech"))
      list.push("digital geometric shapes", "circuit-style emblem");

    if (desc.includes("fitness"))
      list.push("strength symbol", "movement silhouette");

    if (desc.includes("beauty"))
      list.push("floral line-art", "feminine curves");

    if (desc.includes("finance"))
      list.push("growth arrow", "shield emblem");

    return list;
  }

  private getAdvancedStyleModifiers(style: string) {
    const map: any = {
      modern: {
        primary: "modern minimalist",
        secondary: "geometric precision and clean symmetry"
      },
      classic: {
        primary: "classic timeless",
        secondary: "refined elegant balance"
      },
      bold: {
        primary: "bold impactful",
        secondary: "heavy line-weight design"
      },
      creative: {
        primary: "creative artistic",
        secondary: "abstract imaginative flair"
      },
      minimal: {
        primary: "minimal clean",
        secondary: "simple uncluttered geometry"
      }
    };

    return map[style] || { primary: "professional", secondary: "balanced commercial identity" };
  }

  private getColorGuidance(color: string) {
    const map: any = {
      blue: "professional blue palette with clean contrast",
      green: "natural or financial greens",
      purple: "creative neon purples",
      red: "bold energetic reds",
      orange: "warm inviting oranges",
      black: "high-contrast black and white palette"
    };

    return map[color] || "clean modern brand colors";
  }

  // ------------------------------
  // MAIN PROMPT — STRICT RULESET
  // ------------------------------

  private buildLogoPrompt(request: LogoGenerationRequest): string {
    const { companyName, industry, style, colorScheme, description, keywords } = request;

    const industrySymbols = this.getIndustrySpecificImagery(description, industry);
    const nightlifeSymbols = this.getNightlifeImagery(description);
    const styleInfo = this.getAdvancedStyleModifiers(style);
    const colorPalette = this.getColorGuidance(colorScheme);

    return `
IMPORTANT — GLOBAL HARD RULES (APPLY TO EVERY GENERATION):

• NON-NEGOTIABLE: The output MUST be a single, flat, standalone centered logo — nothing else.
• NON-NEGOTIABLE: No mockups, no business cards, no paper, no packaging, no products, no shirts, no signage, no stationery, no scenes, no 3D rooms.
• NON-NEGOTIABLE: The logo cannot appear printed, photographed, displayed, staged, or shown in any real-world environment.
• NON-NEGOTIABLE: The image must contain EXACTLY ONE logo — no duplicates, no alternate placements, no multiple versions.
• NON-NEGOTIABLE: The business name "${companyName}" MUST appear inside the logo clearly and spelled perfectly.
• Absolutely NO thumbnails, NO preview rows, NO grids, NO brand kits.
• Background must be plain, minimal, non-realistic, NOT a physical surface.
• Clean vector-style artwork only.

TEXT ENFORCEMENT — STRICT AND REQUIRED:
• The visible text MUST be spelled EXACTLY "${companyName}".
• No placeholder text, no fake words, no random letters, no abbreviations.
• No other text is allowed besides "${companyName}".

Create a professional vector-style logo for "${companyName}".

BUSINESS DESCRIPTION:
${description}

INDUSTRY SYMBOLS:
${industrySymbols.join(", ") || "industry-appropriate shapes"}

NIGHTLIFE SYMBOLS:
${nightlifeSymbols.join(", ") || "none"}

DESIGN STYLE:
${styleInfo.primary} with ${styleInfo.secondary}

COLOR PALETTE:
${colorPalette}

BRAND ATTRIBUTES:
${keywords.join(", ")}

TEXT REQUIREMENT (REINFORCEMENT):
TEXT TO RENDER: "${companyName}"
VISIBLE TEXT: "${companyName}"
DISPLAYED TEXT: "${companyName}"
RENDER EXACTLY: "${companyName}"
`.trim();
  }
}

export const openaiLogoService = OpenAILogoService.getInstance();
