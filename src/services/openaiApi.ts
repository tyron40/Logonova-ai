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
      throw new Error(
        "OpenAI API key is required. Add VITE_OPENAI_API_KEY to your .env or enter it in settings."
      );
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
            // STRICT constraint: NO extra variations
            style: "natural",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: { message: "Unknown error" },
        }));
        const errorMessage =
          errorData.error?.message ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`OpenAI API Error: ${errorMessage}`);
      }

      const data = await response.json();
      if (!data.data || !data.data[0]?.url) {
        throw new Error("Invalid response: No image URL returned.");
      }

      return data.data[0].url;
    } catch (error: any) {
      console.error("Error generating logo:", error);

      if (error.message?.includes("insufficient_quota"))
        throw new Error("OpenAI quota exceeded.");
      if (error.message?.includes("invalid_api_key"))
        throw new Error("Invalid OpenAI API key.");
      if (error.message?.includes("rate_limit_exceeded"))
        throw new Error("Rate limit exceeded. Try again shortly.");

      throw new Error("Failed to generate logo. Please try again.");
    }
  }

  async generateBusinessKeywords(
    companyName: string,
    description: string
  ): Promise<string> {
    if (!this.hasValidApiKey()) {
      throw new Error(
        "OpenAI API key is required. Add VITE_OPENAI_API_KEY to your .env or enter in settings."
      );
    }

    const apiKey = this.getApiKey()!;

    try {
      const prompt = `Improve the business description for "${companyName}".  
      Current description: "${description}".
      Return ONLY a polished, professional, brand-focused description suitable for logo design.`;

      const response = await fetch(
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
                  "You are a branding expert. You generate concise, professional business descriptions ideal for logo creation.",
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 200,
            temperature: 0.5,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: { message: "Unknown error" },
        }));
        throw new Error(errorData.error?.message || "API Error");
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error: any) {
      console.error("Keyword generation error:", error);
      throw new Error("Failed to enhance description.");
    }
  }

  // --- ENHANCED STRICT PROMPT ENGINEERING ---
  private buildLogoPrompt(request: LogoGenerationRequest): string {
    const { companyName, industry, style, colorScheme, description, keywords } =
      request;

    const businessContext = this.analyzeBusinessContext(description, companyName);
    const industryImagery = this.getIndustrySpecificImagery(
      description,
      industry
    );
    const styleModifiers = this.getAdvancedStyleModifiers(style);
    const colorGuidance = this.getColorGuidance(colorScheme);

    let prompt = `Create a SINGLE, CLEAN, HIGH-QUALITY LOGO for the company "${companyName}".  
    
    STRICT NON-NEGOTIABLE RULES:
    • ABSOLUTELY NO mockups, no extra logos, no duplicates, no watermarks.  
    • EXACT spelling of "${companyName}" with clean, professional typography.  
    • ONE symbol + ONE text layout ONLY.  
    • No background scenes, no extra objects, no clutter.  
    • Do NOT include multiple icons, repeated visuals, or variations inside the same image.  
    • The logo must look vector-based, minimal, clean, balanced, and brand-ready.  
    • Must match the industry description with accurate and relevant imagery ONLY.  
    
    BUSINESS CONTEXT:  
    The company is a ${businessContext.businessType}.  
    Industry imagery to incorporate: ${industryImagery.join(", ") || "appropriate symbolism"}.  
    
    STYLE:  
    ${styleModifiers.primary} with ${styleModifiers.secondary}.  
    
    COLORS:  
    ${colorGuidance}.  
    
    DESCRIPTION:  
    ${description.trim()}.  
    
    BRAND ATTRIBUTES:  
    ${keywords.join(", ")}.  
    
    FINAL CRITICAL OUTPUT RULES:
    • ONE single centered logo.  
    • Include ONLY what a real professional designer would place in a logo.  
    • Avoid realism—use clean vector-logo style.  
    • The logo must be unique, memorable, and perfectly composed.`;

    return prompt;
  }

  private analyzeBusinessContext(description: string, companyName: string) {
    const desc = description.toLowerCase();

    if (desc.includes("fitness") || desc.includes("gym"))
      return { businessType: "fitness and wellness brand" };
    if (desc.includes("tech") || desc.includes("software"))
      return { businessType: "technology company" };
    if (desc.includes("food") || desc.includes("cafe"))
      return { businessType: "food / dining business" };
    if (desc.includes("real estate"))
      return { businessType: "real estate company" };
    if (desc.includes("finance"))
      return { businessType: "financial services brand" };

    return { businessType: "professional business" };
  }

  private getIndustrySpecificImagery(description: string, industry: string) {
    const desc = description.toLowerCase();
    const imagery: string[] = [];

    if (desc.includes("fitness")) imagery.push("dumbbell symbol", "athletic icon");
    if (desc.includes("tech")) imagery.push("circuit lines", "digital symbol");
    if (desc.includes("beauty")) imagery.push("elegant curves", "floral elements");
    if (desc.includes("food")) imagery.push("minimal culinary icon");
    if (desc.includes("finance")) imagery.push("growth arrow", "shield");

    return imagery;
  }

  private getAdvancedStyleModifiers(style: string) {
    const styleMap = {
      modern: {
        primary: "modern minimalist",
        secondary: "geometric precision and sleek forms",
      },
      luxury: {
        primary: "premium luxury",
        secondary: "elegant metallic accents and refined balance",
      },
      bold: {
        primary: "bold impactful",
        secondary: "strong shapes and commanding presence",
      },
      classic: {
        primary: "classic timeless",
        secondary: "refined symmetry and clean serif typography",
      },
      tech: {
        primary: "futuristic tech",
        secondary: "sharp digital angles and sleek precision",
      },
    };

    return (
      styleMap[style] || {
        primary: "professional",
        secondary: "clean lines and balanced layout",
      }
    );
  }

  private getColorGuidance(colorScheme: string) {
    const colorMap = {
      blue: "Use a professional blue palette symbolizing trust and reliability.",
      green: "Use a natural or financial green palette representing growth.",
      red: "Use a bold red palette symbolizing strength and passion.",
      purple: "Use a creative purple palette symbolizing innovation.",
      black: "Use a luxury black/charcoal palette with high contrast.",
      orange: "Use energetic orange shades representing creativity.",
      custom: "Use colors that match the brand identity appropriately.",
    };

    return colorMap[colorScheme] || "Use clean, professional branding colors.";
  }
}

export const openaiLogoService = OpenAILogoService.getInstance();
