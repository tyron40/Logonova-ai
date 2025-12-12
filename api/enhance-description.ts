import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface EnhanceRequest {
  companyName: string;
  description: string;
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

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userApiKeys, error: apiKeyError } = await supabase
      .from('user_api_keys')
      .select('openai_api_key')
      .eq('user_id', user.id)
      .maybeSingle();

    let openaiApiKey = userApiKeys?.openai_api_key;

    if (!openaiApiKey) {
      openaiApiKey = process.env.OPENAI_API_KEY;
    }

    if (!openaiApiKey) {
      return res.status(500).json({
        error: 'OpenAI API key not configured. Please add your API key in Account Settings.'
      });
    }

    const requestData: EnhanceRequest = req.body;
    const { companyName, description } = requestData;

    const prompt = `You are a branding expert helping to enhance business descriptions for logo design.

Business Name: ${companyName}
Current Description: ${description || "(empty)"}

Task: Create a concise, professional description (2-3 sentences max, about 50-80 words) that captures:
1. What the business does
2. Key values or differentiators
3. Target audience or industry focus

Make it specific, memorable, and suitable for creating a distinctive logo. Use clear, descriptive language.

Provide ONLY the enhanced description text, no explanations or meta-commentary.`;

    const openaiResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional branding consultant who writes concise, impactful business descriptions for logo design.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json().catch(() => ({
        error: { message: 'Unknown error' },
      }));
      return res.status(openaiResponse.status).json({
        error: error.error?.message ?? 'Enhancement failed',
      });
    }

    const openaiData = await openaiResponse.json();
    const enhancedDescription = openaiData.choices?.[0]?.message?.content?.trim();

    if (!enhancedDescription) {
      return res.status(500).json({ error: 'No enhanced description returned' });
    }

    return res.status(200).json({ enhancedDescription });
  } catch (error) {
    console.error('Enhancement error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
