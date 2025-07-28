/*
  # Create Storage Buckets for File Uploads

  1. Storage Buckets
    - `logos` bucket for company logo uploads
    - `employee-avatars` bucket for employee profile pictures
  
  2. Security
    - Enable public access for both buckets
    - Set up proper RLS policies for file access
    - Configure appropriate file size and type restrictions
*/

-- Create logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Create employee-avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-avatars',
  'employee-avatars',
  true,
  1048576, -- 1MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for logos bucket - allow public read and authenticated upload
CREATE POLICY "Public can view logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Authenticated users can update logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can delete logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'logos');

-- Policy for employee-avatars bucket - allow public read and authenticated upload
CREATE POLICY "Public can view employee avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'employee-avatars');

CREATE POLICY "Authenticated users can upload employee avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'employee-avatars');

CREATE POLICY "Authenticated users can update employee avatars"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'employee-avatars');

CREATE POLICY "Authenticated users can delete employee avatars"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'employee-avatars');