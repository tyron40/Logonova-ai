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
      throw new Error("OpenAI API key required.");
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
      throw new Error("Logo generation failed. Try again.");
    }
  }

  // Enhanced description generator
  async generateBusinessKeywords(
    companyName: string,
    description: string
  ): Promise<string> {
    if (!this.hasValidApiKey()) throw new Error("API key required.");
    const apiKey = this.getApiKey()!;

    const prompt = `Enhance the brand description for "${companyName}". 
    Description: "${description}"
    Return ONLY a refined, professional brand description.`;

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
              content:
                "You produce polished, brand-ready business descriptions.",
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

  // NEW — Adult-nightlife mapping
  private getNightlifeImagery(description: string): string[] {
    const desc = description.toLowerCase();
    const imagery: string[] = [];

    if (desc.includes("strip") || desc.includes("gentlemen"))
      imagery.push(
        "sensual silhouette of a dancer (non-nude)",
        "pole dance abstract figure",
        "neon light outlines",
        "nightclub stage lighting",
        "seductive but tasteful feminine silhouette"
      );

    if (desc.includes("nightclub") || desc.includes("bar"))
      imagery.push(
        "glowing neon signs",
        "cocktail or martini shapes",
        "VIP nightlife motifs",
        "spotlight beams"
      );

    return imagery;
  }

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
Create a SINGLE, clean, professional vector-style logo for the company "${companyName}".

STRICT RULES:
• EXACT spelling of "${companyName}" — perfect typography.
• ONE logo only. No duplicate icons or variants inside the same image.
• No mockups, no watermarks, no 3D backgrounds.
• The design must be unique every generation.
• Include ONE symbol + clean text layout.

BUSINESS TYPE:
${description}

INDUSTRY SYMBOLISM TO USE:
${industryImagery.join(", ") || "industry-appropriate shapes"}

NIGHTLIFE / ADULT-CLUB SYMBOLISM (allowed):
${nightlifeImagery.join(", ") || "none"}

These elements *are allowed*: seductive silhouettes, pole dancing abstract shapes, nightclub neon signs, nightlife lighting, artistic feminine outlines.  
These elements *are NOT allowed*: nudity, explicit detail, realistic human faces.

STYLE:
${styleModifiers.primary}, with ${styleModifiers.secondary}.

COLOR PALETTE:
${colorGuidance}

BRAND ATTRIBUTES:
${keywords.join(", ")}

FINAL OUTPUT REQUIREMENTS:
• Strong, bold nightlife or club aesthetic if description matches.
• Unique, memorable emblem suitable for signage + marketing.
• Vector-style clarity: crisp lines, high contrast, simple shapes.
`.trim();
  }

  private getIndustrySpecificImagery(description: string, industry: string) {
    const imagery: string[] = [];
    const desc = description.toLowerCase();

    if (desc.includes("tech")) imagery.push("digital geometric shapes");
    if (desc.includes("fitness")) imagery.push("strength and movement icons");
    if (desc.includes("beauty")) imagery.push("elegant feminine curves");

    return imagery;
  }

  private getAdvancedStyleModifiers(style: string) {
    const map: any = {
      modern: {
        primary: "modern minimalist",
        secondary: "geometric precision and smooth lines",
      },
      luxury: {
        primary: "luxury high-end",
        secondary: "metallic gradients and elegant shapes",
      },
      bold: {
        primary: "bold impactful",
        secondary: "thick lines and strong forms",
      },
      creative: {
        primary: "creative artistic",
        secondary: "playful abstract shapes",
      },
      minimal: {
        primary: "minimal clean",
        secondary: "simple balanced geometry",
      },
    };

    return (
      map[style] || {
        primary: "professional",
        secondary: "clean composition and balance",
      }
    );
  }

  private getColorGuidance(color: string) {
    const map: any = {
      blue: "bold electric blues with nightclub undertones",
      purple: "neon purple with nightlife glow",
      red: "deep seductive reds with nightclub lighting",
      black: "high-contrast black with neon accents",
      green: "vibrant nightclub green lighting",
      orange: "warm nightlife orange glows",
    };
    return map[color] || "clean modern colors appropriate for the brand";
  }
}

export const openaiLogoService = OpenAILogoService.getInstance();
