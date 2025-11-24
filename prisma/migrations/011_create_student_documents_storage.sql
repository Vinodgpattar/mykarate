-- Create Supabase Storage bucket for student documents
-- Run this in Supabase Dashboard → SQL Editor
-- This creates the storage bucket and RLS policies for student photo and Aadhar card uploads

-- ============================================
-- 1. Create storage bucket for student documents
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-documents', 'student-documents', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. Drop existing policies (for idempotency)
-- ============================================
DROP POLICY IF EXISTS "Students can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can read student documents" ON storage.objects;
DROP POLICY IF EXISTS "Students can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete their own documents" ON storage.objects;

-- ============================================
-- 3. Storage Policies
-- ============================================

-- Policy 1: Allow authenticated users (students) to upload their own documents
CREATE POLICY "Students can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-documents' AND
  auth.role() = 'authenticated'
);

-- Policy 2: Public read access (so admins can view documents)
CREATE POLICY "Public can read student documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'student-documents');

-- Policy 3: Allow students to update their own documents
CREATE POLICY "Students can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'student-documents' AND
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'student-documents' AND
  auth.role() = 'authenticated'
);

-- Policy 4: Allow students to delete their own documents
CREATE POLICY "Students can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-documents' AND
  auth.role() = 'authenticated'
);

-- ============================================
-- Migration Complete
-- ============================================
-- Next steps:
-- 1. Verify bucket was created in Supabase Dashboard → Storage
-- 2. Bucket should be set to "Public" for easy access
-- 3. File size limit: Recommended 5MB
-- 4. Allowed MIME types: image/jpeg, image/png, image/jpg


