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
    const { price_id, success_url, cancel_url, mode } = req.body;

    const error = validateParameters(
      { price_id, success_url, cancel_url, mode },
      {
        cancel_url: 'string',
        price_id: 'string',
        success_url: 'string',
        mode: { values: ['payment', 'subscription'] },
      }
    );

    if (error) {
      return res.status(400).json({ error });
    }

    const authHeader = req.headers.authorization!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError) {
      return res.status(401).json({ error: 'Failed to authenticate user' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (getCustomerError) {
      console.error('Failed to fetch customer information from the database', getCustomerError);
      return res.status(500).json({ error: 'Failed to fetch customer information' });
    }

    let customerId: string;

    if (!customer || !customer.stripe_customer_id) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });

      console.log(`Created new Stripe customer ${newCustomer.id} for user ${user.id}`);

      const { error: createCustomerError } = await supabase.from('stripe_customers').insert({
        user_id: user.id,
        stripe_customer_id: newCustomer.id,
      });

      if (createCustomerError) {
        console.error('Failed to save customer information in the database', createCustomerError);

        try {
          await stripe.customers.del(newCustomer.id);
          await supabase.from('stripe_subscriptions').delete().eq('customer_id', newCustomer.id);
        } catch (deleteError) {
          console.error('Failed to clean up after customer mapping error:', deleteError);
        }

        return res.status(500).json({ error: 'Failed to create customer mapping' });
      }

      if (mode === 'subscription') {
        const { error: createSubscriptionError } = await supabase
          .from('stripe_subscriptions')
          .insert({
            customer_id: newCustomer.id,
            status: 'not_started',
          });

        if (createSubscriptionError) {
          console.error('Failed to save subscription in the database', createSubscriptionError);

          try {
            await stripe.customers.del(newCustomer.id);
          } catch (deleteError) {
            console.error('Failed to delete Stripe customer after subscription creation error:', deleteError);
          }

          return res.status(500).json({ error: 'Unable to save the subscription in the database' });
        }
      }

      customerId = newCustomer.id;

      console.log(`Successfully set up new customer ${customerId} with subscription record`);
    } else {
      customerId = customer.stripe_customer_id;

      if (mode === 'subscription') {
        const { data: subscription, error: getSubscriptionError } = await supabase
          .from('stripe_subscriptions')
          .select('status')
          .eq('customer_id', customerId)
          .maybeSingle();

        if (getSubscriptionError) {
          console.error('Failed to fetch subscription information from the database', getSubscriptionError);
          return res.status(500).json({ error: 'Failed to fetch subscription information' });
        }

        if (!subscription) {
          const { error: createSubscriptionError } = await supabase
            .from('stripe_subscriptions')
            .insert({
              customer_id: customerId,
              status: 'not_started',
            });

          if (createSubscriptionError) {
            console.error('Failed to create subscription record for existing customer', createSubscriptionError);
            return res.status(500).json({ error: 'Failed to create subscription record for existing customer' });
          }
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode,
      success_url,
      cancel_url,
    });

    console.log(`Created checkout session ${session.id} for customer ${customerId}`);

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error(`Checkout error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
}

type ExpectedType = 'string' | { values: string[] };
type Expectations<T> = { [K in keyof T]: ExpectedType };

function validateParameters<T extends Record<string, any>>(
  values: T,
  expected: Expectations<T>
): string | undefined {
  for (const parameter in values) {
    const expectation = expected[parameter];
    const value = values[parameter];

    if (expectation === 'string') {
      if (value == null) {
        return `Missing required parameter ${parameter}`;
      }
      if (typeof value !== 'string') {
        return `Expected parameter ${parameter} to be a string got ${JSON.stringify(value)}`;
      }
    } else {
      if (!expectation.values.includes(value)) {
        return `Expected parameter ${parameter} to be one of ${expectation.values.join(', ')}`;
      }
    }
  }

  return undefined;
}
