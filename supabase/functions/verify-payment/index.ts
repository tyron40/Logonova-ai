import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  // For 204 No Content, don't include Content-Type or body
  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { session_id } = await req.json();

    if (!session_id) {
      return corsResponse({ error: 'session_id is required' }, 400);
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Verify the session belongs to this user's customer
    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (getCustomerError || !customer) {
      return corsResponse({ error: 'Customer not found' }, 404);
    }

    // Verify the session customer matches
    if (session.customer !== customer.stripe_customer_id) {
      return corsResponse({ error: 'Session does not belong to this user' }, 403);
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return corsResponse({ 
        success: false, 
        error: 'Payment not completed',
        payment_status: session.payment_status 
      });
    }

    // Get credits based on the price
    const priceId = session.line_items?.data[0]?.price?.id;
    let credits = 0;

    // Map price IDs to credits (these should match your Stripe products)
    const priceToCreditsMap: { [key: string]: number } = {
      'price_1SXDQDLkzHXwN84vsj54I3Ly': 10,  // $5.00 = 10 credits
      'price_1SXDR5LkzHXwN84vNGKH0EJH': 25,  // $10.00 = 25 credits
      'price_1SXDSPLkzHXwN84vLo9kQlbE': 55,  // $20.00 = 55 credits
      'price_1SXDSoLkzHXwN84vSe77zkio': 150, // $50.00 = 150 credits
    };

    if (priceId && priceToCreditsMap[priceId]) {
      credits = priceToCreditsMap[priceId];
    } else {
      // Fallback: determine credits based on amount
      const amount = session.amount_total || 0;
      if (amount >= 5000) credits = 150;
      else if (amount >= 2000) credits = 55;
      else if (amount >= 1000) credits = 25;
      else if (amount >= 500) credits = 10;
      else credits = 5; // minimum
    }

    return corsResponse({
      success: true,
      credits,
      amount: session.amount_total,
      payment_status: session.payment_status,
      session_id: session.id,
    });

  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return corsResponse({ 
      success: false, 
      error: error.message || 'Failed to verify payment' 
    }, 500);
  }
});