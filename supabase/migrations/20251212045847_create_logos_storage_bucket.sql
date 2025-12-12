/*
  # Create Supabase Storage Bucket for Logos

  1. New Storage Bucket
    - `logos` bucket for storing generated logo images permanently
    - Public access enabled so users can view/download their logos anytime
    
  2. Security
    - Authenticated users can upload logos
    - Anyone can view logos (public bucket)
    - Users can only delete their own logos
    
  3. Notes
    - Images stored here never expire
    - Provides permanent URLs for user galleries
    - Supports downloadable logos
*/

-- Create the logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload logos'
  ) THEN
    CREATE POLICY "Authenticated users can upload logos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'logos');
  END IF;
END $$;

-- Allow anyone to view logos (public bucket)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view logos'
  ) THEN
    CREATE POLICY "Anyone can view logos"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'logos');
  END IF;
END $$;

-- Allow users to delete their own logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own logos'
  ) THEN
    CREATE POLICY "Users can delete their own logos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;