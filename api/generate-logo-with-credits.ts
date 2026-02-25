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

    // Check if user is admin
    const adminEmail = process.env.VITE_ADMIN_EMAIL || 'robertstyron40@gmail.com';
    const isAdmin = user.email === adminEmail;
    console.log(`User: ${user.email}, Admin: ${isAdmin}`);

    const { data: apiKey, error: apiKeyError } = await supabase
      .from('user_api_keys')
      .select('credit_balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!isAdmin && apiKeyError) {
      return res.status(500).json({ error: 'Failed to fetch user credits' });
    }

    const currentCredits = isAdmin ? 999999 : (apiKey?.credit_balance ?? 0);

    if (!isAdmin && currentCredits < 1) {
      return res.status(402).json({
        error: 'Insufficient credits. Please purchase more credits to continue.'
      });
    }

    const requestData: LogoGenerationRequest = req.body;

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY is not configured');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const prompt = buildLogoPrompt(requestData);
    console.log('Generated prompt for DALL-E:', prompt.substring(0, 200) + '...');

    console.log('Calling OpenAI DALL-E 3 API...');

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

    console.log('OpenAI Response Status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json().catch(() => ({
        error: { message: 'Unknown error' },
      }));
      console.error('OpenAI API Error:', error);
      return res.status(openaiResponse.status).json({
        error: error.error?.message ?? 'Image generation failed',
      });
    }

    const openaiData = await openaiResponse.json();
    const imageUrl = openaiData.data?.[0]?.url;

    if (!imageUrl) {
      return res.status(500).json({ error: 'No image URL returned from OpenAI' });
    }

    // Deduct credit from user (skip for admin)
    let newBalance = currentCredits;

    if (!isAdmin) {
      newBalance = currentCredits - 1;
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
    } else {
      console.log('Admin user - no credits deducted');
    }

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

  return `Create a single, professional logo design for "${companyName}".

Business: ${companyName}
Industry: ${industry}
Description: ${description}
Style: ${styleInfo}
Colors: ${colors}
${industryImagery.length > 0 ? `Visual elements: ${industryImagery.join(', ')}` : ''}
Brand values: ${keywords.join(', ') || 'professional, clean, memorable'}

CRITICAL REQUIREMENTS:
1. OUTPUT EXACTLY ONE LOGO - centered on a solid color or clean gradient background
2. The logo should be vector-style, flat design with clean lines
3. Include the text "${companyName}" spelled exactly as shown
4. Make it production-ready - clean, balanced, and professional

ABSOLUTELY FORBIDDEN - DO NOT INCLUDE:
- NO mockups (business cards, stationery, t-shirts, packaging, phone screens)
- NO multiple versions or variations in the same image
- NO split panels or grid layouts
- NO 3D renders or product presentations
- NO decorative frames, borders, or ornamental backgrounds
- NO people, hands, or physical objects
- NO watermarks or extra text beyond the company name

The output must be a single, clean logo mark that could be used immediately on a website, app, or product - nothing else.`.trim();
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
