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
    if (!this.hasValidApiKey()) {
      throw new Error("OpenAI API key is required.");
    }

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
          prompt,
          size: "1024x1024",
          quality: "hd",
          n: 1,
          response_format: "url"
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
        throw new Error(errorData.error?.message ?? "Image generation failed.");
      }

      const data = await response.json();
      return data.data?.[0]?.url ?? "";

    } catch (error) {
      console.error("Image generation Error:", error);
      throw new Error("Failed to generate logo. Try again.");
    }
  }

  async generateBusinessKeywords(companyName: string, description: string): Promise<string> {
    if (!this.hasValidApiKey()) {
      throw new Error("OpenAI API key required.");
    }

    const apiKey = this.getApiKey()!;
    const prompt = `
      Enhance this business description for professional branding:
      Business: "${companyName}"
      Description: "${description}"
      Return ONLY a polished, final brand description — no extra text.
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
            content: "You produce refined brand descriptions optimized for logo design."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  }

  // --------------------------------------------
  // INDUSTRY / NIGHTLIFE SYMBOL COMPONENTS
  // --------------------------------------------

  private getNightlifeImagery(description: string): string[] {
    const desc = description.toLowerCase();
    const list: string[] = [];

    if (desc.includes("strip") || desc.includes("gentlemen"))
      list.push(
        "abstract dancer silhouette (non-nude)",
        "pole dance minimal line-art symbol",
        "neon nightclub outline",
        "stage spotlight glow"
      );

    if (desc.includes("nightclub") || desc.includes("bar"))
      list.push("neon cocktail icon", "VIP emblem", "nightlife neon border");

    return list;
  }

  private getIndustrySpecificImagery(description: string, industry: string) {
    const desc = description.toLowerCase();
    const list: string[] = [];

    if (desc.includes("burger"))
      list.push("burger icon", "restaurant emblem", "chef line-art");

    if (desc.includes("food"))
      list.push("culinary tools icon", "fork and knife symbol");

    if (desc.includes("tech"))
      list.push("geometric tech shapes", "digital circuit emblem");

    if (desc.includes("fitness"))
      list.push("strength symbol", "movement silhouette");

    if (desc.includes("beauty"))
      list.push("feminine curves", "elegant floral line art");

    if (desc.includes("finance"))
      list.push("growth arrow icon", "shield financial emblem");

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
        secondary: "refined serif typography and balanced layout"
      },
      bold: {
        primary: "bold impactful",
        secondary: "thick lines and high contrast"
      },
      creative: {
        primary: "creative artistic",
        secondary: "abstract imaginative design language"
      },
      minimal: {
        primary: "minimal clean",
        secondary: "simple uncluttered geometry"
      }
    };

    return map[style] || { primary: "professional", secondary: "clean balanced identity" };
  }

  private getColorGuidance(color: string) {
    const map: any = {
      blue: "professional blue palette with strong contrast",
      green: "natural or financial greens with clarity",
      purple: "creative neon purples",
      red: "bold energetic reds",
      orange: "warm strong oranges",
      black: "high-contrast monochrome palette"
    };

    return map[color] || "clean modern branding colors";
  }

  // --------------------------------------------
  // MASTER PROMPT WITH GLOBAL STRICT RULES
  // --------------------------------------------

  private buildLogoPrompt(request: LogoGenerationRequest): string {
    const { companyName, industry, style, colorScheme, description, keywords } = request;

    const industrySymbols = this.getIndustrySpecificImagery(description, industry);
    const nightlifeSymbols = this.getNightlifeImagery(description);
    const styleInfo = this.getAdvancedStyleModifiers(style);
    const colorPalette = this.getColorGuidance(colorScheme);

    return `
IMPORTANT — GLOBAL HARD RULES (ALWAYS APPLY):
• The final output MUST contain ONE (1) single centered logo only.
• Absolutely NO thumbnails, NO mockups, NO preview rows, NO grids.
• No duplicate icons, no alternate versions, no brand kits.
• No second symbol, no small icons placed below, no multi-logo compositions.
• No watermarks or extra text outside the main logo.
• Must be a clean vector-style professional logo.
• Plain, simple, or slightly gradient background only.
• Exact spelling of the company name: "${companyName}".

Create a unique vector-style logo for "${companyName}".

BUSINESS DESCRIPTION:
${description}

INDUSTRY SYMBOLS (if applicable):
${industrySymbols.join(", ") || "industry-related shapes"}

NIGHTLIFE SYMBOLS (if applicable):
${nightlifeSymbols.join(", ") || "none"}

DESIGN STYLE:
${styleInfo.primary} with ${styleInfo.secondary}

COLOR PALETTE:
${colorPalette}

BRAND ATTRIBUTES:
${keywords.join(", ")}
`.trim();
  }
}

export const openaiLogoService = OpenAILogoService.getInstance();
