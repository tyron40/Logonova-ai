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
            prompt: prompt,
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
      throw new Error("Failed to generate logo. Try again.");
    }
  }

  async generateBusinessKeywords(
    companyName: string,
    description: string
  ): Promise<string> {
    if (!this.hasValidApiKey()) throw new Error("OpenAI API key required.");

    const apiKey = this.getApiKey()!;
    const prompt = `Enhance the business description for "${companyName}". 
Description: "${description}"
Return ONLY a polished professional brand description.`;

    const res = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
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
              content: "You create clean, professional brand descriptions.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 200,
        }),
      }
    );

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  }

  // ---------------------------------------------------
  // INDUSTRY + NIGHTLIFE IMAGE LOGIC
  // ---------------------------------------------------

  private getNightlifeImagery(description: string): string[] {
    const desc = description.toLowerCase();
    const imagery: string[] = [];

    if (desc.includes("strip") || desc.includes("gentlemen"))
      imagery.push(
        "tasteful dancer silhouette (non-nude)",
        "pole dance abstract symbol",
        "neon nightlife outlines",
        "stage lighting beams",
        "sensual feminine silhouette (abstract)"
      );

    if (desc.includes("nightclub") || desc.includes("bar"))
      imagery.push(
        "neon cocktail icon",
        "VIP emblem",
        "neon sign shapes",
        "spotlight glow"
      );

    return imagery;
  }

  private getIndustrySpecificImagery(description: string, industry: string) {
    const desc = description.toLowerCase();
    const imagery: string[] = [];

    if (desc.includes("burger") || desc.includes("restaurant"))
      imagery.push("burger icon", "chef elements", "food emblem", "kitchen tools");

    if (desc.includes("tech"))
      imagery.push("digital geometric shapes", "circuit patterns");

    if (desc.includes("fitness"))
      imagery.push("strength icons", "movement symbols");

    if (desc.includes("beauty"))
      imagery.push("feminine curve shapes", "elegant floral elements");

    if (desc.includes("finance"))
      imagery.push("growth arrow", "shield", "professional line-art emblem");

    return imagery;
  }

  private getAdvancedStyleModifiers(style: string) {
    const map: any = {
      modern: {
        primary: "modern minimalist",
        secondary: "geometric precision and smooth line-work",
      },
      classic: {
        primary: "classic timeless",
        secondary: "refined symmetry and clean serif typefaces",
      },
      bold: {
        primary: "bold impactful",
        secondary: "strong shapes and high contrast",
      },
      creative: {
        primary: "creative artistic",
        secondary: "abstract imaginative shapes",
      },
      minimal: {
        primary: "minimal clean",
        secondary: "balanced simplicity and open spacing",
      },
    };

    return (
      map[style] || {
        primary: "professional",
        secondary: "clean composition and balanced geometry",
      }
    );
  }

  private getColorGuidance(color: string) {
    const map: any = {
      blue: "professional blues with modern contrast",
      green: "natural or financial green palette",
      purple: "creative neon purple accents",
      red: "bold energetic reds",
      orange: "warm inviting orange glows",
      black: "high-contrast black and grayscale palette",
    };

    return map[color] || "clean modern brand-appropriate colors";
  }

  // ---------------------------------------------------
  // MAIN PROMPT GENERATOR — WITH HARD SINGLE-LOGO RULES
  // ---------------------------------------------------

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
Create a SINGLE, clean, professional vector-style logo for the business "${companyName}".

STRICT NON-NEGOTIABLE RULES:
• EXACT spelling of "${companyName}" — perfect typography.
• ONLY ONE logo in the entire image.
• NO mockups, no thumbnails, no tiny logos, no badge variations.
• NO grid layouts, no rows of logos, no stacked alternate designs.
• NO watermarks, packaging, or repeated symbols.
• The image must contain ONE symbol + ONE text layout ONLY.
• White or plain background preferred unless color enhances logo clarity.

BUSINESS CATEGORY:
${description}

INDUSTRY SYMBOLISM:
${industryImagery.join(", ") || "industry-appropriate shapes"}

NIGHTLIFE SYMBOLISM (allowed if relevant):
${nightlifeImagery.join(", ") || "none"}

DESIGN STYLE:
${styleModifiers.primary} with ${styleModifiers.secondary}

COLOR PALETTE:
${colorGuidance}

BRAND ATTRIBUTES:
${keywords.join(", ")}

FINAL OUTPUT REQUIREMENTS:
• Vector-style clarity: crisp lines, clean geometry.
• Balanced, centered composition.
• Unique design every generation.
• Readable at small and large sizes.
`.trim();
  }
}

export const openaiLogoService = OpenAILogoService.getInstance();
