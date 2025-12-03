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
    if (!this.hasValidApiKey()) throw new Error("OpenAI API key required.");

    const apiKey = this.getApiKey()!;
    const prompt = this.buildLogoPrompt(request);

    try {
      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
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

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error?.message ?? "Image generation failed.");
      }

      const data = await response.json();
      return data.data?.[0]?.url ?? "";
    } catch (err) {
      console.error("Logo generation failed:", err);
      throw new Error("Failed to generate logo.");
    }
  }

  async generateBusinessKeywords(
    companyName: string,
    description: string
  ): Promise<string> {
    if (!this.hasValidApiKey()) throw new Error("OpenAI API key required.");
    const apiKey = this.getApiKey()!;

    const prompt = `Enhance this business description for logo creation:
Business: "${companyName}"
Description: "${description}"
Return ONLY a polished, professional description.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content:
              "You create clean, sharp business descriptions optimized for logo creation.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 200,
      }),
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  }

  // --------------------------------------------------
  // INDUSTRY + NIGHTLIFE SYMBOL LOGIC
  // --------------------------------------------------

  private getNightlifeImagery(description: string): string[] {
    const desc = description.toLowerCase();
    const imagery: string[] = [];

    if (desc.includes("strip") || desc.includes("gentlemen"))
      imagery.push(
        "abstract dancer silhouette (non-nude)",
        "pole dance minimalist symbol",
        "neon nightlife emblem",
        "stage lighting glow",
        "sensual feminine outline (abstract)"
      );

    if (desc.includes("nightclub") || desc.includes("bar"))
      imagery.push("neon cocktail icon", "VIP emblem", "glowing neon outline");

    return imagery;
  }

  private getIndustrySpecificImagery(description: string, industry: string) {
    const desc = description.toLowerCase();
    const imagery: string[] = [];

    if (desc.includes("burger"))
      imagery.push("burger icon", "restaurant emblem", "chef tools");

    if (desc.includes("food"))
      imagery.push("culinary symbol", "dining elements");

    if (desc.includes("tech"))
      imagery.push("circuit patterns", "digital geometric shapes");

    if (desc.includes("fitness"))
      imagery.push("strength icons", "movement silhouettes");

    if (desc.includes("beauty"))
      imagery.push("feminine curves", "elegant floral line art");

    if (desc.includes("finance"))
      imagery.push("bar chart", "growth arrow", "shield emblem");

    return imagery;
  }

  private getAdvancedStyleModifiers(style: string) {
    const map: any = {
      modern: {
        primary: "modern minimalist",
        secondary: "geometric lines and clean symmetry",
      },
      classic: {
        primary: "classic timeless",
        secondary: "refined serif typography and balanced layout",
      },
      bold: {
        primary: "bold impactful",
        secondary: "strong shapes and dramatic contrast",
      },
      creative: {
        primary: "creative artistic",
        secondary: "unique abstract shapes",
      },
      minimal: {
        primary: "minimal clean",
        secondary: "simple geometry and open spacing",
      },
    };

    return (
      map[style] || {
        primary: "professional",
        secondary: "clean balanced composition",
      }
    );
  }

  private getColorGuidance(color: string) {
    const map: any = {
      blue: "professional blues with high contrast",
      green: "natural or financial greens",
      purple: "creative neon purples",
      red: "bold energetic reds",
      orange: "warm motivated oranges",
      black: "high-contrast black & white palette",
    };

    return map[color] || "clean modern brand colors";
  }

  // --------------------------------------------------
  // GLOBAL STRICT PROMPT RULESET — APPLIES TO *ALL* GENERATIONS
  // --------------------------------------------------

  private buildLogoPrompt(request: LogoGenerationRequest): string {
    const { companyName, industry, style, colorScheme, description, keywords } =
      request;

    const industryImagery = this.getIndustrySpecificImagery(
      description,
      industry
    );
    const nightlifeImagery = this.getNightlifeImagery(description);
    const styleModifiers = this.getAdvancedStyleModifiers(style);
    const colorGuidance = this.getColorGuidance(colorScheme);

    return `
Generate a SINGLE, professional, vector-style logo for "${companyName}".

🚫 GLOBAL STRICT RULES (ALWAYS APPLY):
• ONLY ONE logo in the entire image — absolutely no duplicates.
• NO mockups, NO thumbnails, NO badge variations, NO rows, NO grids.
• NO multiple logo versions inside the same image.
• NO watermarks, no extra text outside the logo.
• Must be ONE icon/symbol + ONE text layout only.
• Centered, balanced composition.
• Plain or minimal background only.
• Perfect, exact spelling: "${companyName}".

BUSINESS CONTEXT:
${description}

INDUSTRY SYMBOLS:
${industryImagery.join(", ") || "industry-appropriate shapes"}

NIGHTLIFE SYMBOLS (if relevant):
${nightlifeImagery.join(", ") || "none"}

STYLE:
${styleModifiers.primary} with ${styleModifiers.secondary}

COLOR PALETTE:
${colorGuidance}

BRAND ATTRIBUTES:
${keywords.join(", ")}

FINAL OUTPUT:
• High contrast vector-style clarity.
• Clean lines, sharp geometry.
• Unique logo every generation.
`.trim();
  }
}

export const openaiLogoService = OpenAILogoService.getInstance();
