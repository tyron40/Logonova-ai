/*
  # Create increment_credits function

  1. Functions
    - `increment_credits(p_user_id, p_amount)` - Safely increments user credit balance
      - Creates user_api_keys record if it doesn't exist
      - Increments credit_balance by specified amount
      - Uses upsert to handle race conditions
  
  2. Purpose
    - Enables atomic credit additions for purchases and bonuses
    - Ensures user always has a credit balance record
*/

-- Function to increment user credits safely
CREATE OR REPLACE FUNCTION increment_credits(
  p_user_id uuid,
  p_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update the user's credit balance
  INSERT INTO user_api_keys (user_id, credit_balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET credit_balance = user_api_keys.credit_balance + p_amount;
END;
$$;