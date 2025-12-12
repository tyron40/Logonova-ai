/*
  # Add OpenAI API Key Column

  1. Changes
    - Add `openai_api_key` column to `user_api_keys` table
    - Allows users to store their own OpenAI API keys for AI-powered features
  
  2. Security
    - Column is nullable to support optional API key storage
    - RLS policies already protect access to user_api_keys table
*/

-- Add openai_api_key column to user_api_keys table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_api_keys' AND column_name = 'openai_api_key'
  ) THEN
    ALTER TABLE user_api_keys ADD COLUMN openai_api_key text;
  END IF;
END $$;