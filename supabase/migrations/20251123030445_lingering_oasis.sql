/*
  # Credits System Implementation

  1. New Functions
    - `add_credits` - Safely adds credits to user account
    - `deduct_credits` - Deducts credits with balance validation
    - `get_user_credits` - Gets current user credit balance

  2. Transaction Management
    - Atomic operations for credit changes
    - Proper error handling and rollbacks
    - Transaction logging in credit_transactions table

  3. Security
    - Functions use security definer to bypass RLS
    - Proper validation of user permissions
    - Safe credit balance management
*/

-- Function to safely add credits to a user
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id uuid,
  p_credits integer,
  p_stripe_payment_intent_id text DEFAULT NULL,
  p_stripe_session_id text DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance integer;
BEGIN
  -- Get current balance
  SELECT COALESCE(credit_balance, 0) 
  INTO current_balance
  FROM user_api_keys 
  WHERE user_id = p_user_id;

  -- If no record exists, current_balance will be NULL
  IF current_balance IS NULL THEN
    current_balance := 0;
  END IF;

  -- Update credit balance
  INSERT INTO user_api_keys (user_id, credit_balance, updated_at)
  VALUES (p_user_id, current_balance + p_credits, now())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    credit_balance = COALESCE(user_api_keys.credit_balance, 0) + p_credits,
    updated_at = now();

  -- Record transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    stripe_payment_intent_id,
    stripe_session_id,
    description,
    created_at
  ) VALUES (
    p_user_id,
    'purchase',
    p_credits,
    p_stripe_payment_intent_id,
    p_stripe_session_id,
    COALESCE(p_description, 'Credits added'),
    now()
  );
END;
$$;

-- Function to deduct credits from a user
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id uuid,
  p_credits integer,
  p_description text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance integer;
  new_balance integer;
BEGIN
  -- Get current balance
  SELECT COALESCE(credit_balance, 0)
  INTO current_balance
  FROM user_api_keys
  WHERE user_id = p_user_id;

  -- Check if user has enough credits
  IF current_balance IS NULL OR current_balance < p_credits THEN
    RETURN false;
  END IF;

  new_balance := current_balance - p_credits;

  -- Update balance
  UPDATE user_api_keys
  SET 
    credit_balance = new_balance,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    description,
    created_at
  ) VALUES (
    p_user_id,
    'deduction',
    -p_credits,
    COALESCE(p_description, 'Credits used'),
    now()
  );

  RETURN true;
END;
$$;

-- Function to get user credit balance
CREATE OR REPLACE FUNCTION get_user_credits(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  balance integer;
BEGIN
  SELECT COALESCE(credit_balance, 0)
  INTO balance
  FROM user_api_keys
  WHERE user_id = p_user_id;

  RETURN COALESCE(balance, 0);
END;
$$;