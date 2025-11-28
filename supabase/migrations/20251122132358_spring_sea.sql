/*
  # Credits and Payment System

  1. New Tables
    - Add credits columns to existing user system
    - `credit_transactions` table for tracking purchases and usage
    - `stripe_customers` table for Stripe customer mapping

  2. Security
    - Enable RLS on all new tables
    - Add policies for users to read their own data
    - Admin policies for transaction management

  3. Functions
    - Credit deduction function
    - Credit addition function with transaction logging
*/

-- Add credits columns to user_api_keys table (using existing table)
ALTER TABLE user_api_keys 
ADD COLUMN IF NOT EXISTS credit_balance integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_refill_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Create credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'deduction', 'refund')),
  credits_amount integer NOT NULL,
  stripe_payment_intent_id text,
  stripe_session_id text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create Stripe customers table
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Policies for credit_transactions
CREATE POLICY "Users can read own transactions"
  ON credit_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON credit_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for stripe_customers
CREATE POLICY "Users can read own stripe data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to safely deduct credits
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id uuid,
  p_credits integer,
  p_description text DEFAULT 'Logo generation'
)
RETURNS boolean AS $$
DECLARE
  current_balance integer;
BEGIN
  -- Get current balance with row lock
  SELECT credit_balance INTO current_balance
  FROM user_api_keys
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if user has enough credits
  IF current_balance IS NULL OR current_balance < p_credits THEN
    RETURN false;
  END IF;
  
  -- Deduct credits
  UPDATE user_api_keys
  SET credit_balance = credit_balance - p_credits,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO credit_transactions (user_id, transaction_type, credits_amount, description)
  VALUES (p_user_id, 'deduction', -p_credits, p_description);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id uuid,
  p_credits integer,
  p_stripe_payment_intent_id text DEFAULT NULL,
  p_stripe_session_id text DEFAULT NULL,
  p_description text DEFAULT 'Credit purchase'
)
RETURNS void AS $$
BEGIN
  -- Add credits to user balance
  INSERT INTO user_api_keys (user_id, credit_balance, created_at, updated_at)
  VALUES (p_user_id, p_credits, now(), now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    credit_balance = user_api_keys.credit_balance + p_credits,
    updated_at = now();
  
  -- Log transaction
  INSERT INTO credit_transactions (
    user_id, 
    transaction_type, 
    credits_amount, 
    stripe_payment_intent_id,
    stripe_session_id,
    description
  )
  VALUES (
    p_user_id, 
    'purchase', 
    p_credits, 
    p_stripe_payment_intent_id,
    p_stripe_session_id,
    p_description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user credit balance
CREATE OR REPLACE FUNCTION get_user_credits(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  balance integer;
BEGIN
  SELECT COALESCE(credit_balance, 0) INTO balance
  FROM user_api_keys
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);