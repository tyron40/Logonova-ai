import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid URL parameter' });
    }

    const imageResponse = await fetch(url);

    if (!imageResponse.ok) {
      return res.status(imageResponse.status).json({
        error: 'Failed to fetch image from source'
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/png';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'attachment; filename="logo.png"');
    res.setHeader('Cache-Control', 'no-cache');

    return res.status(200).send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error('Download proxy error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to download image',
    });
  }
}
