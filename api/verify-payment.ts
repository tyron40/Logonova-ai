import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const authHeader = req.headers.authorization!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return res.status(401).json({ error: 'Failed to authenticate user' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (getCustomerError || !customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (session.customer !== customer.stripe_customer_id) {
      return res.status(403).json({ error: 'Session does not belong to this user' });
    }

    if (session.payment_status !== 'paid') {
      return res.json({
        success: false,
        error: 'Payment not completed',
        payment_status: session.payment_status,
      });
    }

    const priceId = session.line_items?.data[0]?.price?.id;
    let credits = 0;

    const priceToCreditsMap: { [key: string]: number } = {
      price_1SXDQDLkzHXwN84vsj54I3Ly: 10,
      price_1SXDR5LkzHXwN84vNGKH0EJH: 25,
      price_1SXDSPLkzHXwN84vLo9kQlbE: 55,
      price_1SXDSoLkzHXwN84vSe77zkio: 150,
    };

    if (priceId && priceToCreditsMap[priceId]) {
      credits = priceToCreditsMap[priceId];
    } else {
      const amount = session.amount_total || 0;
      if (amount >= 5000) credits = 150;
      else if (amount >= 2000) credits = 55;
      else if (amount >= 1000) credits = 25;
      else if (amount >= 500) credits = 10;
      else credits = 5;
    }

    return res.json({
      success: true,
      credits,
      amount: session.amount_total,
      payment_status: session.payment_status,
      session_id: session.id,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify payment',
    });
  }
}
