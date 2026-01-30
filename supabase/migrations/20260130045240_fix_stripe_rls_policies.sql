/*
  # Fix Stripe RLS Policies
  
  1. Changes
    - Add RLS policies for users to read their own stripe orders
    - Add RLS policies for users to read their own stripe subscriptions
    
  2. Security
    - Users can only read their own subscription and order data
    - Service role maintains full access for webhook operations
*/

-- Add policy for users to read their own orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'stripe_orders' 
    AND policyname = 'Users can read own orders'
  ) THEN
    CREATE POLICY "Users can read own orders"
      ON stripe_orders FOR SELECT
      TO authenticated
      USING (
        customer_id IN (
          SELECT stripe_customer_id 
          FROM stripe_customers 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Add policy for users to read their own subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'stripe_subscriptions' 
    AND policyname = 'Users can read own subscriptions'
  ) THEN
    CREATE POLICY "Users can read own subscriptions"
      ON stripe_subscriptions FOR SELECT
      TO authenticated
      USING (
        customer_id IN (
          SELECT stripe_customer_id 
          FROM stripe_customers 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
