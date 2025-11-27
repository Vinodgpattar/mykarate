-- Migration: Create storage bucket for admin profile images
-- Run this in Supabase Dashboard → SQL Editor

-- Create storage bucket for admin profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-profiles', 'admin-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow authenticated admins to upload
DROP POLICY IF EXISTS "Admins can upload profile images" ON storage.objects;
CREATE POLICY "Admins can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-profiles' AND
  auth.role() = 'authenticated'
);

-- Storage policy: Public read access (so images can be displayed)
DROP POLICY IF EXISTS "Public can read admin profile images" ON storage.objects;
CREATE POLICY "Public can read admin profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'admin-profiles');

-- Storage policy: Allow admins to update their own images
DROP POLICY IF EXISTS "Admins can update profile images" ON storage.objects;
CREATE POLICY "Admins can update profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'admin-profiles' AND
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'admin-profiles' AND
  auth.role() = 'authenticated'
);

-- Storage policy: Allow admins to delete their own images
DROP POLICY IF EXISTS "Admins can delete profile images" ON storage.objects;
CREATE POLICY "Admins can delete profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'admin-profiles' AND
  auth.role() = 'authenticated'
);

