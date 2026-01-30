/*
  # Remove automatic 100 credit allocation for new users

  1. Changes
    - Update `handle_new_user()` function to give 0 credits instead of 100
    - New users will now start with 0 credits
    - Existing users keep their current credit balance
  
  2. Security
    - Function maintains SECURITY DEFINER for proper privilege escalation
    - No changes to RLS policies
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_api_keys (user_id, credit_balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
