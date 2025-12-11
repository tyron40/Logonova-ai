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
    if (!this.hasValidApiKey()) {
      throw new Error("OpenAI API key required.");
    }

    const apiKey = this.getApiKey()!;
    const prompt = `
      Improve this business description for stronger branding and logo creation:
      Business Name: "${companyName}"
      Original Description: "${description}"

      Return ONLY the improved description. Do not add commentary.
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
            content: "You refine business descriptions specifically to guide professional logo design."
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
  // SYMBOLIC INTELLIGENCE HELPERS
  // ---------------------------------------------------------

  private getNightlifeImagery(raw: string): string[] {
    const desc = raw.toLowerCase();
    const list: string[] = [];

    if (desc.includes("strip") || desc.includes("gentlemen")) {
      list.push(
        "tasteful abstract dancer silhouette",
        "neon nightlife badge",
        "subtle spotlight accents"
      );
    }

    if (desc.includes("nightclub") || desc.includes("club") || desc.includes("bar")) {
      list.push("neon cocktail icon", "vip star emblem");
    }

    return list;
  }

  private getIndustrySpecificImagery(raw: string): string[] {
    const desc = raw.toLowerCase();
    const list: string[] = [];

    if (desc.includes("burger") || desc.includes("restaurant") || desc.includes("food")) {
      list.push("single stylized burger icon", "simple culinary emblem");
    }

    if (desc.includes("candy") || desc.includes("sweet")) {
      list.push("single lollipop swirl", "minimal candy icon");
    }

    if (desc.includes("skate") || desc.includes("skateboard")) {
      list.push("single skateboard deck symbol", "simple wheel-and-truck emblem");
    }

    if (desc.includes("tech") || desc.includes("software") || desc.includes("app")) {
      list.push("geometric digital core symbol", "circuit-inspired emblem");
    }

    if (desc.includes("fitness") || desc.includes("gym") || desc.includes("training")) {
      list.push("strong athletic silhouette", "dynamic motion lines");
    }

    if (desc.includes("beauty") || desc.includes("spa") || desc.includes("salon")) {
      list.push("elegant floral curves", "soft feminine line-art");
    }

    if (desc.includes("finance") || desc.includes("bank") || desc.includes("investment")) {
      list.push("upward growth arrow", "shield of trust emblem");
    }

    return list;
  }

  private getStyleModifiers(style: string): string {
    const map: Record<string, string> = {
      modern: "modern minimalist with clean geometry and strong visual hierarchy",
      classic: "classic timeless with balanced symmetry and refined typography",
      bold: "bold impactful with heavy strokes and high contrast",
      creative: "creative expressive with distinctive, imaginative shapes",
      minimal: "ultra-minimal with maximum simplicity and negative space",
    };
    return map[style] ?? "professional, balanced, brand-ready styling";
  }

  private getColorPalette(color: string): string {
    const map: Record<string, string> = {
      blue: "trustworthy, professional blue tones with crisp contrast",
      green: "natural and financial greens representing growth and stability",
      purple: "creative purple and violet tones suggesting innovation and premium feel",
      orange: "warm energetic orange hues conveying friendliness and enthusiasm",
      red: "bold red tones emphasizing energy and power",
      black: "high-contrast monochrome palette with black, white, and gray",
    };
    return map[color] ?? "a clean, modern, brand-appropriate color palette";
  }

  // ---------------------------------------------------------
  // MASTER PROMPT (WITH STRONG NEGATIVE LOGIC)
  // ---------------------------------------------------------

  private buildLogoPrompt(req: LogoGenerationRequest): string {
    const { companyName, description, industry, style, colorScheme, keywords } = req;

    const industryImagery = this.getIndustrySpecificImagery(description);
    const nightlifeImagery = this.getNightlifeImagery(description);
    const styleInfo = this.getStyleModifiers(style);
    const colors = this.getColorPalette(colorScheme);

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
• ${nightlifeImagery.join(", ") || "no nightlife symbol if not relevant"}

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
}

export const openaiLogoService = OpenAILogoService.getInstance();
