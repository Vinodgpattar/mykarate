-- Migration: Add profile_image_url to profiles table
-- This allows admins to upload their profile pictures

-- Add profile_image_url column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_profile_image_url_idx ON profiles(profile_image_url) WHERE profile_image_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.profile_image_url IS 'Profile image URL for admins (stored in Supabase Storage)';

