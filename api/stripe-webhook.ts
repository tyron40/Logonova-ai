import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).send('No signature found');
    }

    const buf = await buffer(req);
    const body = buf.toString();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return res.status(400).send(`Webhook signature verification failed: ${error.message}`);
    }

    handleEvent(event).catch(console.error);

    return res.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function buffer(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  if (!('customer' in stripeData)) {
    return;
  }

  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;
      isSubscription = mode === 'subscription';
      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
        } = stripeData as Stripe.Checkout.Session;

        // Get the user_id from stripe_customers
        const { data: customerData, error: customerError } = await supabase
          .from('stripe_customers')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (customerError || !customerData) {
          console.error('Error finding user for customer:', customerError);
          return;
        }

        const userId = customerData.user_id;

        // Get the full session to access line items
        const fullSession = await stripe.checkout.sessions.retrieve(checkout_session_id, {
          expand: ['line_items'],
        });

        // Calculate credits based on price ID or amount
        const priceId = fullSession.line_items?.data[0]?.price?.id;
        const priceToCreditsMap: { [key: string]: number } = {
          'price_1SXDQDLkzHXwN84vsj54I3Ly': 10,
          'price_1SXDR5LkzHXwN84vNGKH0EJH': 25,
          'price_1SXDSPLkzHXwN84vLo9kQlbE': 55,
          'price_1SXDSoLkzHXwN84vSe77zkio': 150,
        };

        let credits = 0;
        if (priceId && priceToCreditsMap[priceId]) {
          credits = priceToCreditsMap[priceId];
        } else {
          // Fallback to amount-based calculation
          const amountInDollars = (amount_total || 0) / 100;
          if (amountInDollars >= 50) credits = 150;
          else if (amountInDollars >= 20) credits = 55;
          else if (amountInDollars >= 10) credits = 25;
          else if (amountInDollars >= 5) credits = 10;
          else credits = Math.floor(amountInDollars);
        }

        // Insert order
        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent,
          customer_id: customerId,
          amount_subtotal,
          amount_total,
          currency,
          payment_status,
          order_status: 'completed',
        });

        if (orderError) {
          console.error('Error inserting order:', orderError);
          return;
        }

        // Add credits to user account
        const { error: updateError } = await supabase.rpc('increment_credits', {
          p_user_id: userId,
          p_amount: credits,
        });

        if (updateError) {
          console.error('Error adding credits:', updateError);
          return;
        }

        // Create credit transaction record
        const { error: transactionError } = await supabase.from('credit_transactions').insert({
          user_id: userId,
          transaction_type: 'purchase',
          credits_amount: credits,
          stripe_payment_intent_id: payment_intent,
          stripe_session_id: checkout_session_id,
          description: `Purchased ${credits} credits for $${amountInDollars}`,
        });

        if (transactionError) {
          console.error('Error creating credit transaction:', transactionError);
        }

        console.info(`Successfully processed payment and added ${credits} credits for session: ${checkout_session_id}`);
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
  }
}

async function syncCustomerFromStripe(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase
        .from('stripe_subscriptions')
        .upsert(
          {
            customer_id: customerId,
            subscription_status: 'not_started',
          },
          {
            onConflict: 'customer_id',
          }
        );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    const subscription = subscriptions.data[0];

    const { error: subError } = await supabase
      .from('stripe_subscriptions')
      .upsert(
        {
          customer_id: customerId,
          subscription_id: subscription.id,
          price_id: subscription.items.data[0].price.id,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
            ? {
                payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
                payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
              }
            : {}),
          status: subscription.status,
        },
        {
          onConflict: 'customer_id',
        }
      );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}
