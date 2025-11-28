/*
  # Stripe Integration Schema

  1. New Tables
    - `stripe_customers`
      - Links Supabase users to Stripe customer IDs
      - `user_id` (uuid, foreign key to auth.users)
      - `stripe_customer_id` (text, unique)
      - `created_at` (timestamp)
    
    - `stripe_subscriptions` 
      - Stores subscription data
      - `customer_id` (text, references stripe_customers.stripe_customer_id)
      - `subscription_id` (text, unique)
      - `price_id` (text)
      - `subscription_status` (text)
      - `current_period_start` (integer)
      - `current_period_end` (integer)
      - `cancel_at_period_end` (boolean)
      - `payment_method_brand` (text)
      - `payment_method_last4` (text)
    
    - `stripe_orders`
      - Stores one-time payment data
      - `customer_id` (text, references stripe_customers.stripe_customer_id)
      - `checkout_session_id` (text, unique)
      - `payment_intent_id` (text)
      - `amount_subtotal` (integer)
      - `amount_total` (integer)
      - `currency` (text)
      - `payment_status` (text)
      - `order_status` (text)

  2. Views
    - `stripe_user_subscriptions` - User-specific subscription view
    - `stripe_user_orders` - User-specific orders view

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read their own data
*/

-- Create stripe_customers table
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- Create stripe_subscriptions table
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text REFERENCES stripe_customers(stripe_customer_id) ON DELETE CASCADE NOT NULL,
  subscription_id text UNIQUE,
  price_id text,
  subscription_status text DEFAULT 'not_started',
  current_period_start integer,
  current_period_end integer,
  cancel_at_period_end boolean DEFAULT false,
  payment_method_brand text,
  payment_method_last4 text,
  status text DEFAULT 'not_started',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stripe_orders table
CREATE TABLE IF NOT EXISTS stripe_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text REFERENCES stripe_customers(stripe_customer_id) ON DELETE CASCADE NOT NULL,
  order_id serial UNIQUE,
  checkout_session_id text UNIQUE NOT NULL,
  payment_intent_id text,
  amount_subtotal integer NOT NULL,
  amount_total integer NOT NULL,
  currency text NOT NULL,
  payment_status text NOT NULL,
  order_status text DEFAULT 'pending',
  order_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for stripe_customers
CREATE POLICY "Users can read own stripe customer data"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own stripe customer data"
  ON stripe_customers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create policies for stripe_subscriptions (no direct user access needed)
CREATE POLICY "Allow service role full access to subscriptions"
  ON stripe_subscriptions FOR ALL
  TO service_role;

-- Create policies for stripe_orders (no direct user access needed)
CREATE POLICY "Allow service role full access to orders"
  ON stripe_orders FOR ALL
  TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_id ON stripe_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_customer_id ON stripe_orders(customer_id);

-- Create user-specific views for easy access
CREATE OR REPLACE VIEW stripe_user_subscriptions AS
SELECT 
  s.*,
  c.user_id
FROM stripe_subscriptions s
JOIN stripe_customers c ON s.customer_id = c.stripe_customer_id
WHERE c.user_id = auth.uid();

CREATE OR REPLACE VIEW stripe_user_orders AS
SELECT 
  o.*,
  c.user_id
FROM stripe_orders o
JOIN stripe_customers c ON o.customer_id = c.stripe_customer_id
WHERE c.user_id = auth.uid();

-- Grant permissions on views
GRANT SELECT ON stripe_user_subscriptions TO authenticated;
GRANT SELECT ON stripe_user_orders TO authenticated;