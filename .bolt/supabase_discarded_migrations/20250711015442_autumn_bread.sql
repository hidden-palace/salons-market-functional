/*
  # Branding Storage Setup

  1. Storage Buckets
    - Create logos bucket for company logo uploads
    - Create employee_avatars bucket for AI employee profile pictures
  
  2. Security
    - Enable RLS on storage buckets
    - Allow authenticated uploads and public reads
  
  3. Performance
    - Add proper bucket configurations
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('logos', 'logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/svg+xml']),
  ('employee_avatars', 'employee_avatars', true, 1048576, ARRAY['image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Logos bucket policies
DROP POLICY IF EXISTS "Allow authenticated uploads to logos" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'logos');

DROP POLICY IF EXISTS "Allow public reads from logos" ON storage.objects;
CREATE POLICY "Allow public reads from logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Allow authenticated updates to logos" ON storage.objects;
CREATE POLICY "Allow authenticated updates to logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Allow authenticated deletes from logos" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'logos');

-- Employee avatars bucket policies
DROP POLICY IF EXISTS "Allow authenticated uploads to employee_avatars" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to employee_avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'employee_avatars');

DROP POLICY IF EXISTS "Allow public reads from employee_avatars" ON storage.objects;
CREATE POLICY "Allow public reads from employee_avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'employee_avatars');

DROP POLICY IF EXISTS "Allow authenticated updates to employee_avatars" ON storage.objects;
CREATE POLICY "Allow authenticated updates to employee_avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'employee_avatars');

DROP POLICY IF EXISTS "Allow authenticated deletes from employee_avatars" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from employee_avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'employee_avatars');