/*
  # Fix RPC Functions - Drop and Recreate
  
  1. Drop existing conflicting functions
  2. Recreate with correct signatures
  3. Add proper credit management functions
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS add_credits(uuid, integer, text, text, text);
DROP FUNCTION IF EXISTS add_credits(uuid, integer, text);
DROP FUNCTION IF EXISTS deduct_credits(uuid, integer, text);
DROP FUNCTION IF EXISTS get_user_credits(uuid);

-- Create add_credits function
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id uuid,
  p_credits integer,
  p_description text DEFAULT 'Credit addition'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user's credit balance
  INSERT INTO user_api_keys (user_id, credit_balance, updated_at)
  VALUES (p_user_id, p_credits, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    credit_balance = COALESCE(user_api_keys.credit_balance, 0) + p_credits,
    updated_at = now();
  
  -- Record the transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    description,
    created_at
  )
  VALUES (
    p_user_id,
    'purchase',
    p_credits,
    p_description,
    now()
  );
  
  RETURN true;
END;
$$;

-- Create deduct_credits function
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id uuid,
  p_credits integer,
  p_description text DEFAULT 'Credit deduction'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance integer;
BEGIN
  -- Get current balance
  SELECT COALESCE(credit_balance, 0) INTO current_balance
  FROM user_api_keys
  WHERE user_id = p_user_id;
  
  -- Check if user has enough credits
  IF current_balance < p_credits THEN
    RETURN false;
  END IF;
  
  -- Deduct credits
  UPDATE user_api_keys
  SET 
    credit_balance = credit_balance - p_credits,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record the transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    description,
    created_at
  )
  VALUES (
    p_user_id,
    'deduction',
    p_credits,
    p_description,
    now()
  );
  
  RETURN true;
END;
$$;

-- Create get_user_credits function
CREATE OR REPLACE FUNCTION get_user_credits(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_balance integer;
BEGIN
  SELECT COALESCE(credit_balance, 0) INTO user_balance
  FROM user_api_keys
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(user_balance, 0);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_credits(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_credits(uuid) TO authenticated;