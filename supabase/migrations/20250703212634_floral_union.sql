/*
  # Create saved_logos table

  1. New Tables
    - `saved_logos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `company_name` (text)
      - `industry` (text)
      - `style` (text)
      - `color_scheme` (text)
      - `description` (text)
      - `keywords` (text array)
      - `generated_logos` (jsonb array)
      - `selected_logo` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `saved_logos` table
    - Add policies for authenticated users to manage their own logos

  3. Indexes
    - Add index on user_id for faster queries
    - Add index on created_at for ordering
*/

CREATE TABLE IF NOT EXISTS saved_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  industry text NOT NULL,
  style text NOT NULL,
  color_scheme text NOT NULL,
  description text DEFAULT '',
  keywords text[] DEFAULT '{}',
  generated_logos jsonb DEFAULT '[]',
  selected_logo jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_logos ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_logos
CREATE POLICY "Users can read own logos"
  ON saved_logos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logos"
  ON saved_logos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logos"
  ON saved_logos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own logos"
  ON saved_logos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_logos_user_id ON saved_logos(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_logos_created_at ON saved_logos(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_logos_updated_at ON saved_logos(updated_at);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_saved_logos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_logos_updated_at
  BEFORE UPDATE ON saved_logos
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_logos_updated_at();