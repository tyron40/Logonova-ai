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
          prompt,
          size: "1024x1024",
          quality: "hd",
          n: 1,
          response_format: "url",
        }),
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
      Improve this business description for stronger branding:
      Business Name: "${companyName}"
      Original Description: "${description}"

      Return ONLY the improved description. No explanations.
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
            content: "You refine business descriptions for use in brand identity and logo creation."
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  }

  // ---------------------------------------------------------
  // SYMBOLIC INTELLIGENCE
  // ---------------------------------------------------------

  private getNightlifeImagery(desc: string): string[] {
    desc = desc.toLowerCase();
    const list: string[] = [];

    if (desc.includes("strip") || desc.includes("gentlemen"))
      list.push("abstract dancer silhouette", "neon nightlife badge", "spotlight accent");

    if (desc.includes("nightclub") || desc.includes("club") || desc.includes("bar"))
      list.push("neon drink icon", "VIP star emblem");

    return list;
  }

  private getIndustrySpecificImagery(desc: string): string[] {
    desc = desc.toLowerCase();
    const list: string[] = [];

    if (desc.includes("burger") || desc.includes("food"))
      list.push("burger icon", "culinary utensils", "chef hat emblem");

    if (desc.includes("candy"))
      list.push("lollipop swirl", "candy icon", "circle sweets pattern");

    if (desc.includes("tech") || desc.includes("software") || desc.includes("app"))
      list.push("digital geometric symbol", "circuit-core emblem");

    if (desc.includes("fitness") || desc.includes("gym"))
      list.push("strength silhouette", "athletic motion lines");

    if (desc.includes("beauty") || desc.includes("spa"))
      list.push("elegant floral curves", "soft feminine icon");

    if (desc.includes("finance"))
      list.push("growth arrow", "shield of trust");

    return list;
  }

  private getStyleModifiers(style: string) {
    const map: any = {
      modern: "modern minimalist, clean geometry, balanced composition",
      classic: "classic timeless identity, elegant symmetry",
      bold: "bold impactful strokes, strong contrast",
      creative: "creative imaginative shapes, artistic flair",
      minimal: "ultra-minimal clean forms, uncluttered simplicity",
    };

    return map[style] || "professional brand identity styling";
  }

  private getColorPalette(color: string) {
    const map: any = {
      blue: "professional blue tones, crisp contrast",
      green: "natural and financial greens",
      purple: "neon purple creativity tones",
      orange: "warm energetic orange tones",
      red: "bold attention-grabbing reds",
      black: "high-contrast monochrome palette",
    };

    return map[color] || "brand-appropriate modern color palette";
  }

  // ---------------------------------------------------------
  // STRICT MASTER PROMPT — WITH NEGATIVE PROMPTS
  // ---------------------------------------------------------

  private buildLogoPrompt(req: LogoGenerationRequest): string {
    const { companyName, description, industry, style, colorScheme, keywords } = req;

    const industryImagery = this.getIndustrySpecificImagery(description);
    const nightlifeImagery = this.getNightlifeImagery(description);
    const styleInfo = this.getStyleModifiers(style);
    const colors = this.getColorPalette(colorScheme);

    return `
CREATE A PROFESSIONAL BRAND LOGO.

==============================
NON-NEGOTIABLE HARD RULES
==============================

• EXACTLY ONE (1) logo must be generated — no variations, no duplicates.
• The logo must be flat, centered, vector-style, clean, and standalone.
• Absolutely NO mockups, NO scenes, NO paper, NO packaging, NO signage, NO products.
• No 3D rooms, no photography, no real-world environments at all.
• The business name MUST appear exactly as: "${companyName}" — spelled perfectly.
• No placeholder text, no alternate spellings, no fake words, no random characters.
• No additional text besides the company name.
• No watermarks, no margins clutter, no UI-like elements.
• Background must be plain, minimal, or gradient — NOT physical.

==============================
DESIGN REQUIREMENTS
==============================

• Industry: ${industry}
• Business Description: ${description}
• Logo Style: ${styleInfo}
• Color Palette: ${colors}
• Suggested Symbolic Imagery:
  - ${industryImagery.join(", ") || "industry-appropriate symbols"}
  - ${nightlifeImagery.join(", ") || ""}
• Brand Attributes: ${keywords.join(", ")}

==============================
NEGATIVE PROMPTS (STRICT)
==============================

DO NOT include:
• mockups  
• stationery  
• product printing  
• business cards  
• posters  
• t-shirts  
• notebooks  
• stickers  
• real objects  
• hands or people  
• photography  
• shadows from objects  
• multiple logos  
• thumbnails  
• grids  
• alternate versions  
• extra icons  
• UI elements  
• random letters  
• misspelled text  
• watermarks  
• QR codes  
• barcodes  
• borders unless part of the logo  

==============================
TEXT REINFORCEMENT
==============================

TEXT MUST APPEAR EXACTLY AS: "${companyName}"
VISIBLE TEXT: "${companyName}"
RENDERED TEXT MUST ONLY BE: "${companyName}"
NO OTHER TEXT IS ALLOWED.

==============================
OUTPUT
==============================

Produce a single centered logo with:
• clean vector style  
• perfect readability  
• harmonious layout  
• strong symbolic meaning  
• balanced negative space  
• crisp line-work and aesthetic precision  
`.trim();
  }
}

export const openaiLogoService = OpenAILogoService.getInstance();
