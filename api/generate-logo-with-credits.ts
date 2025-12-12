import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface LogoGenerationRequest {
  companyName: string;
  industry: string;
  style: string;
  colorScheme: string;
  description: string;
  keywords: string[];
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized', details: authError?.message });
    }

    const { data: apiKey, error: apiKeyError } = await supabase
      .from('user_api_keys')
      .select('credit_balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (apiKeyError) {
      return res.status(500).json({ error: 'Failed to fetch user credits' });
    }

    const currentCredits = apiKey?.credit_balance ?? 0;

    if (currentCredits < 1) {
      return res.status(402).json({
        error: 'Insufficient credits. Please purchase more credits to continue.'
      });
    }

    const requestData: LogoGenerationRequest = req.body;

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const prompt = buildLogoPrompt(requestData);

    const openaiResponse = await fetch(
      'https://api.openai.com/v1/images/generations',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          size: '1024x1024',
          quality: 'hd',
          n: 1,
          response_format: 'url',
        }),
      }
    );

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json().catch(() => ({
        error: { message: 'Unknown error' },
      }));
      return res.status(openaiResponse.status).json({
        error: error.error?.message ?? 'Image generation failed',
      });
    }

    const openaiData = await openaiResponse.json();
    const imageUrl = openaiData.data?.[0]?.url;

    if (!imageUrl) {
      return res.status(500).json({ error: 'No image URL returned from OpenAI' });
    }

    const newBalance = currentCredits - 1;
    const { error: updateError } = await supabase
      .from('user_api_keys')
      .update({ credit_balance: newBalance })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to deduct credit:', updateError);
    }

    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      transaction_type: 'deduction',
      credits_amount: -1,
      description: `Logo generation for ${requestData.companyName}`,
    });

    return res.status(200).json({ imageUrl, creditsRemaining: newBalance });
  } catch (error) {
    console.error('Logo generation error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function buildLogoPrompt(req: LogoGenerationRequest): string {
  const { companyName, description, industry, style, colorScheme, keywords } = req;

  const styleInfo = getStyleModifiers(style);
  const colors = getColorPalette(colorScheme);
  const industryImagery = getIndustrySpecificImagery(description);

  return `
You are a world-class brand identity designer creating a single logo for a real client.

==============================
BUSINESS CONTEXT
==============================
Business Name: "${companyName}"
Industry: ${industry}
Description: ${description}
Brand Attributes: ${keywords.join(', ') || 'clear, memorable, professional'}

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
• ${industryImagery.join(', ') || 'industry-appropriate simple symbol'}

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
• coherent symbolism related to ${industry || 'the business'},
• polished, balanced, and ready to use as a brand logo.
`.trim();
}

function getStyleModifiers(style: string): string {
  const map: Record<string, string> = {
    modern: 'modern minimalist with clean geometry and strong visual hierarchy',
    classic: 'classic timeless with balanced symmetry and refined typography',
    bold: 'bold impactful with heavy strokes and high contrast',
    creative: 'creative expressive with distinctive, imaginative shapes',
    minimal: 'ultra-minimal with maximum simplicity and negative space',
  };
  return map[style] ?? 'professional, balanced, brand-ready styling';
}

function getColorPalette(color: string): string {
  const map: Record<string, string> = {
    blue: 'trustworthy, professional blue tones with crisp contrast',
    green: 'natural and financial greens representing growth and stability',
    purple: 'creative purple and violet tones suggesting innovation and premium feel',
    orange: 'warm energetic orange hues conveying friendliness and enthusiasm',
    red: 'bold red tones emphasizing energy and power',
    black: 'high-contrast monochrome palette with black, white, and gray',
  };
  return map[color] ?? 'a clean, modern, brand-appropriate color palette';
}

function getIndustrySpecificImagery(raw: string): string[] {
  const desc = raw.toLowerCase();
  const list: string[] = [];

  if (desc.includes('burger') || desc.includes('restaurant') || desc.includes('food')) {
    list.push('single stylized burger icon', 'simple culinary emblem');
  }

  if (desc.includes('candy') || desc.includes('sweet')) {
    list.push('single lollipop swirl', 'minimal candy icon');
  }

  if (desc.includes('skate') || desc.includes('skateboard')) {
    list.push('single skateboard deck symbol', 'simple wheel-and-truck emblem');
  }

  if (desc.includes('tech') || desc.includes('software') || desc.includes('app')) {
    list.push('geometric digital core symbol', 'circuit-inspired emblem');
  }

  if (desc.includes('fitness') || desc.includes('gym') || desc.includes('training')) {
    list.push('strong athletic silhouette', 'dynamic motion lines');
  }

  if (desc.includes('beauty') || desc.includes('spa') || desc.includes('salon')) {
    list.push('elegant floral curves', 'soft feminine line-art');
  }

  if (desc.includes('finance') || desc.includes('bank') || desc.includes('investment')) {
    list.push('upward growth arrow', 'shield of trust emblem');
  }

  if (
    desc.includes('strip') ||
    desc.includes('gentlemen') ||
    desc.includes('nightclub') ||
    desc.includes('club') ||
    desc.includes('bar')
  ) {
    list.push('tasteful abstract silhouette', 'neon nightlife badge', 'subtle spotlight accents');
  }

  return list;
}
