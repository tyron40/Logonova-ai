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
  private maxRetries = 2;

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
      throw new Error("OpenAI API key is required. Please add it in settings.");
    }

    const apiKey = this.getApiKey()!;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const prompt = this.buildLogoPrompt(request);

        console.log(`Logo generation attempt ${attempt + 1}/${this.maxRetries + 1}`);

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
          const error = await response.json().catch(() => ({
            error: { message: `HTTP ${response.status}: ${response.statusText}` }
          }));

          const errorMessage = error.error?.message || "Unknown API error";

          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please wait a moment and try again.");
          } else if (response.status === 401) {
            throw new Error("Invalid API key. Please check your OpenAI API key.");
          } else if (response.status === 402 || errorMessage.includes("insufficient_quota")) {
            throw new Error("OpenAI API quota exceeded. Please check your billing.");
          } else if (response.status === 400 && errorMessage.includes("content_policy")) {
            throw new Error("Content policy violation. Please adjust your description.");
          }

          throw new Error(`OpenAI API Error: ${errorMessage}`);
        }

        const data = await response.json();

        if (!data.data || !data.data[0] || !data.data[0].url) {
          throw new Error("Invalid API response: No image URL returned");
        }

        const imageUrl = data.data[0].url;

        if (!imageUrl.startsWith("http")) {
          throw new Error("Invalid image URL received from API");
        }

        console.log("Logo generated successfully");
        return imageUrl;

      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Unknown error occurred");
        console.error(`Attempt ${attempt + 1} failed:`, lastError.message);

        if (
          lastError.message.includes("quota") ||
          lastError.message.includes("Invalid API key") ||
          lastError.message.includes("content_policy")
        ) {
          throw lastError;
        }

        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error("Failed to generate logo after multiple attempts");
  }

  async generateBusinessKeywords(companyName: string, description: string): Promise<string> {
    if (!this.hasValidApiKey()) {
      throw new Error("OpenAI API key required.");
    }

    const apiKey = this.getApiKey()!;

    try {
      const prompt = `
Enhance this business description for professional branding and logo design:
Business Name: "${companyName}"
Current Description: "${description}"

Provide an improved, professional description that highlights key brand attributes, industry position, and visual identity concepts. Keep it concise and focused.
Return ONLY the enhanced description without commentary.
      `.trim();

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
              content: "You are a professional brand strategist specializing in creating compelling business descriptions for logo design and brand identity development."
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 250,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error("Keyword generation failed, using original description");
        return description;
      }

      const data = await response.json();
      const enhanced = data.choices?.[0]?.message?.content?.trim();

      return enhanced || description;
    } catch (error) {
      console.error("Error generating keywords:", error);
      return description;
    }
  }

  private getIndustryImagery(description: string): string[] {
    const desc = description.toLowerCase();
    const imagery: string[] = [];

    if (desc.includes("strip") || desc.includes("gentlemen") || desc.includes("exotic")) {
      imagery.push(
        "elegant silhouette figure",
        "sophisticated neon accent",
        "upscale nightlife symbol",
        "stylized stage spotlight"
      );
    }

    if (desc.includes("nightclub") || desc.includes("club") || desc.includes("lounge")) {
      imagery.push("neon cocktail glass", "VIP star badge", "musical note accent");
    }

    if (desc.includes("bar") || desc.includes("pub") || desc.includes("brewery")) {
      imagery.push("craft beer glass", "bottle silhouette", "bar counter element");
    }

    if (desc.includes("burger") || desc.includes("restaurant") || desc.includes("diner")) {
      imagery.push("burger stack icon", "chef hat symbol", "fork and knife cross");
    }

    if (desc.includes("candy") || desc.includes("sweet") || desc.includes("dessert")) {
      imagery.push("lollipop swirl", "candy wrapper twist", "sweet confection shape");
    }

    if (desc.includes("skate") || desc.includes("skateboard")) {
      imagery.push("skateboard deck profile", "wheel silhouette", "ramp curve");
    }

    if (desc.includes("tech") || desc.includes("software") || desc.includes("app") || desc.includes("digital")) {
      imagery.push("circuit path element", "pixel grid", "digital wave form");
    }

    if (desc.includes("fitness") || desc.includes("gym") || desc.includes("training") || desc.includes("workout")) {
      imagery.push("athletic figure", "dumbbell icon", "motion streak");
    }

    if (desc.includes("beauty") || desc.includes("spa") || desc.includes("salon") || desc.includes("cosmetic")) {
      imagery.push("elegant leaf curve", "flower petal", "mirror reflection");
    }

    if (desc.includes("finance") || desc.includes("bank") || desc.includes("investment") || desc.includes("wealth")) {
      imagery.push("upward arrow", "shield emblem", "coin stack");
    }

    if (desc.includes("law") || desc.includes("legal") || desc.includes("attorney")) {
      imagery.push("scales of justice", "pillared column", "legal document scroll");
    }

    if (desc.includes("medical") || desc.includes("health") || desc.includes("clinic") || desc.includes("doctor")) {
      imagery.push("medical cross", "heartbeat line", "wellness symbol");
    }

    if (desc.includes("real estate") || desc.includes("property") || desc.includes("housing")) {
      imagery.push("house outline", "building skyline", "key symbol");
    }

    if (desc.includes("education") || desc.includes("school") || desc.includes("learning")) {
      imagery.push("graduation cap", "open book", "lightbulb of knowledge");
    }

    return imagery;
  }

  private getStyleDirection(style: string): string {
    const styleMap: Record<string, string> = {
      modern: "ultra-modern minimalist aesthetic with clean geometric precision, sharp edges, and strong visual hierarchy",
      classic: "timeless classic design with traditional elegance, balanced symmetry, and refined sophistication",
      bold: "powerful bold styling with heavy weight strokes, high contrast, and commanding presence",
      creative: "uniquely creative expression with distinctive artistic elements, imaginative shapes, and memorable character",
      minimal: "pure minimal design with maximum simplicity, essential elements only, and generous negative space",
      tech: "cutting-edge technological feel with digital precision, futuristic elements, and innovative geometry",
      luxury: "premium luxury aesthetic with sophisticated refinement, elegant details, and exclusive appeal",
      organic: "natural organic flow with smooth curves, earth-inspired forms, and harmonious balance",
      playful: "fun playful character with friendly shapes, approachable design, and cheerful energy",
      elegant: "graceful elegant styling with refined curves, sophisticated balance, and timeless beauty"
    };

    return styleMap[style] || "professional balanced design with clean commercial appeal and brand-ready aesthetics";
  }

  private getColorStrategy(colorScheme: string): string {
    const colorMap: Record<string, string> = {
      blue: "professional blue palette with deep navy, bright azure, and crisp whites for trust and stability",
      green: "natural green spectrum with forest greens, emerald tones, and fresh accents for growth and vitality",
      purple: "creative purple range with royal violets, deep plum, and bright accents for innovation and luxury",
      orange: "energetic orange palette with warm amber, vibrant tangerine, and complementary tones for enthusiasm",
      red: "powerful red spectrum with deep crimson, bold scarlet, and strong accents for passion and energy",
      black: "sophisticated monochrome with rich blacks, refined grays, and pure whites for timeless elegance",
      pink: "modern pink palette with soft blush, bold magenta, and complementary tones for contemporary appeal",
      yellow: "bright yellow spectrum with golden tones, sunny accents, and balanced contrast for optimism",
      teal: "fresh teal palette with ocean blues, turquoise accents, and clean contrast for modern sophistication",
      brown: "earthy brown range with rich chocolate, warm tan, and natural tones for authenticity and warmth"
    };

    return colorMap[colorScheme] || "carefully selected brand colors with professional contrast and visual harmony";
  }

  private buildLogoPrompt(req: LogoGenerationRequest): string {
    const { companyName, description, industry, style, colorScheme, keywords } = req;

    const industrySymbols = this.getIndustryImagery(description);
    const styleDirection = this.getStyleDirection(style);
    const colorStrategy = this.getColorStrategy(colorScheme);

    const symbolGuidance = industrySymbols.length > 0
      ? `${industrySymbols.slice(0, 2).join(", ")}`
      : "industry symbol";

    return `
Professional logo: "${companyName}" | ${industry} | ${description}
Style: ${styleDirection}
Colors: ${colorStrategy}
Symbols: ${symbolGuidance}
Brand: ${keywords.slice(0, 3).join(", ") || "professional"}

===CRITICAL RULES - ZERO TOLERANCE===

1. TEXT SPELLING - ABSOLUTE REQUIREMENT:
Display EXACTLY "${companyName}" with perfect spelling. NO typos, NO abbreviations, NO initials only, NO placeholder text (lorem ipsum, dummy text), NO generic words (logo, company, brand), NO taglines, NO other words. Only "${companyName}".

2. SINGLE LOGO ONLY:
Output exactly ONE centered logo. NO multiple versions, NO thumbnails, NO grids, NO alternates, NO variations, NO side-by-side presentations, NO option sheets, NO A/B versions.

3. CLEAN COMPOSITION:
Vector-style design on plain/gradient background. Clean space on all sides. Logo is the ONLY element.

4. ABSOLUTELY FORBIDDEN - NO MOCKUPS:
❌ NO business cards, letterheads, envelopes, stationery, brochures, flyers, posters, notepads, paper textures
❌ NO t-shirts, apparel, mugs, bags, packaging, boxes, labels, stickers, merchandise
❌ NO signage, billboards, storefronts, building facades, windows, banners
❌ NO website screens, app interfaces, phones, tablets, computers, social media
❌ NO desks, offices, rooms, walls, surfaces, real-world environments, photography
❌ NO people, hands, bodies, faces, cameras, equipment, tools, props
❌ NO frames, borders, containers, floating icons, QR codes, watermarks, rulers, guides

5. NO SCENES OR CONTEXTS:
NO real-world environments, NO photographs, NO shadows from external lights, NO 3D renders, NO presentations, NO layouts.

6. PRODUCTION QUALITY:
Clean, scalable, professional logo ready for commercial use at any size.

===DELIVERABLE===
ONE centered logo for "${companyName}" with:
- Perfect spelling: "${companyName}"
- ${colorStrategy}
- ${styleDirection}
- Industry-appropriate ${industry} symbolism
- Clean background only
- Production-ready quality

TEXT TO RENDER: "${companyName}"
SPELL IT: "${companyName}"
DISPLAY: "${companyName}"

Deliver one perfect centered logo.
`.trim();
  }
}

export const openaiLogoService = OpenAILogoService.getInstance();
