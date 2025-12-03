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
          response_format: "url",
          // HARD NEGATIVE CONSTRAINTS
          negative_prompt: `
            multiple logos, 
            thumbnails, 
            mockups, 
            previews, 
            grid layout, 
            badge variations, 
            small alternate icons, 
            duplicate symbols, 
            brand kit, 
            template layout, 
            collage, 
            watermark text, 
            second logo, 
            bottom row images, 
            extra icons, 
            two-part designs`
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
      Improve the business description for "${companyName}".
      Original: "${description}"
      Return ONLY a polished brand-ready description.
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
            content: "You create polished business descriptions optimized for logo generation."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 200
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  }

  // --------------------------------------------
  // SUPPORT FUNCTIONS FOR INDUSTRY SYMBOLS
  // --------------------------------------------

  private getNightlifeImagery(description: string): string[] {
    const desc = description.toLowerCase();
    const list: string[] = [];

    if (desc.includes("strip") || desc.includes("gentlemen"))
      list.push(
        "abstract dancer silhouette (non-nude)",
        "pole dance line-icon",
        "neon nightclub outline",
        "stage spotlight glow"
      );

    if (desc.includes("nightclub") || desc.includes("bar"))
      list.push("neon cocktail icon", "VIP emblem", "glowing neon border");

    return list;
  }

  private getIndustrySpecificImagery(description: string, industry: string) {
    const desc = description.toLowerCase();
    const list: string[] = [];

    if (desc.includes("burger"))
      list.push("burger icon", "restaurant emblem", "chef hat line-art");

    if (desc.includes("food"))
      list.push("culinary iconography", "fork and knife symbol");

    if (desc.includes("tech"))
      list.push("digital geometric shapes", "circuit pattern emblem");

    if (desc.includes("fitness"))
      list.push("strength symbol", "motion silhouette");

    if (desc.includes("beauty"))
      list.push("feminine curves", "floral elegance line art");

    if (desc.includes("finance"))
      list.push("growth arrow", "shield protection emblem");

    return list;
  }

  private getAdvancedStyleModifiers(style: string) {
    const map: any = {
      modern: {
        primary: "modern minimalist",
        secondary: "geometric sharp line-work"
      },
      classic: {
        primary: "classic timeless",
        secondary: "refined serif typography"
      },
      bold: {
        primary: "bold strong",
        secondary: "thick lines and intense contrast"
      },
      creative: {
        primary: "creative abstract",
        secondary: "unique imaginative shapes"
      },
      minimal: {
        primary: "minimal clean",
        secondary: "uncluttered balanced geometry"
      }
    };

    return map[style] || { primary: "professional", secondary: "clean balanced composition" };
  }

  private getColorGuidance(color: string) {
    const map: any = {
      blue: "professional blues with cool gradients",
      green: "fresh greens with modern contrast",
      purple: "creative neon purples",
      red: "bold high-energy reds",
      orange: "warm strong oranges",
      black: "high-contrast black + white palette"
    };

    return map[color] || "clean modern branding colors";
  }

  // --------------------------------------------
  // MAIN PROMPT — WITH HARD GLOBAL RESTRICTIONS FIRST
  // --------------------------------------------

  private buildLogoPrompt(request: LogoGenerationRequest): string {
    const { companyName, industry, style, colorScheme, description, keywords } = request;

    const industrySymbols = this.getIndustrySpecificImagery(description, industry);
    const nightlifeSymbols = this.getNightlifeImagery(description);
    const styleInfo = this.getAdvancedStyleModifiers(style);
    const colors = this.getColorGuidance(colorScheme);

    return `
IMPORTANT — STRICT GLOBAL RULES (APPLY TO ALL LOGOS, EVERY TIME):
• Output MUST contain ONE single logo only.
• NO thumbnails, NO mockups, NO previews, NO multiple versions.
• NO bottom rows of icons, NO grid layouts, NO badge sets.
• NO duplicates, NO alternate designs inside the same image.
• NO product mockups, business cards, signage, or backgrounds.
• NO extra icons or symbols outside the main single logo.
• EXACT spelling of "${companyName}" only.
• Centered composition. Clean vector-style.
• Background must be plain, simple, or lightly gradiented.

Create a professional, unique vector-style logo for "${companyName}".

BUSINESS DESCRIPTION:
${description}

INDUSTRY SYMBOLS:
${industrySymbols.join(", ") || "industry-suitable shapes"}

NIGHTLIFE SYMBOLS (if relevant):
${nightlifeSymbols.join(", ") || "none"}

DESIGN STYLE:
${styleInfo.primary} with ${styleInfo.secondary}

COLOR PALETTE:
${colors}

BRAND ATTRIBUTES:
${keywords.join(", ")}
`.trim();
  }
}

export const openaiLogoService = OpenAILogoService.getInstance();
