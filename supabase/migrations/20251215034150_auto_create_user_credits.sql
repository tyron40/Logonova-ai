/*
  # Auto-create user credits on signup

  1. Functions
    - `handle_new_user()` - Automatically creates user_api_keys record with 100 credits for new users
  
  2. Triggers
    - Runs after user signup to ensure every user has a credit balance
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_api_keys (user_id, credit_balance)
  VALUES (NEW.id, 100)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();