import { supabase } from './supabase';
import { stripeProducts, type StripeProduct } from '../stripe-config';

export interface StripeSubscription {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export interface StripeOrder {
  customer_id: string;
  order_id: number;
  checkout_session_id: string;
  payment_intent_id: string;
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

export class StripeService {
  private static instance: StripeService;

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  async createCheckoutSession(priceId: string, mode: 'payment' | 'subscription' = 'subscription'): Promise<{ sessionId: string; url: string }> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const baseUrl = window.location.origin;
    const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/generator`;

    console.log('Creating checkout session via edge function:', { priceId, mode });

    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: {
        price_id: priceId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        mode,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }

    if (!data) {
      throw new Error('No response from checkout service');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    console.log('Checkout session created:', data);
    return data;
  }

  async getUserSubscription(): Promise<StripeSubscription | null> {
    if (!supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching user subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  async getUserOrders(): Promise<StripeOrder[]> {
    if (!supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('stripe_user_orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (error) {
        console.error('Error fetching user orders:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  }

  getProducts(): StripeProduct[] {
    return stripeProducts;
  }

  getProductByPriceId(priceId: string): StripeProduct | undefined {
    return stripeProducts.find(product => product.priceId === priceId);
  }

  async redirectToCheckout(priceId: string, mode: 'payment' | 'subscription' = 'subscription'): Promise<void> {
    const { url } = await this.createCheckoutSession(priceId, mode);

    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No checkout URL received from server');
    }
  }

  async verifyPaymentSession(sessionId: string): Promise<{ success: boolean; credits?: number; amount?: number }> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { session_id: sessionId },
      });

      if (error) {
        console.error('Verify payment error:', error);
        return { success: false };
      }

      return data || { success: false };
    } catch (error) {
      console.error('Error verifying payment session:', error);
      return { success: false };
    }
  }
}

export const stripeService = StripeService.getInstance();