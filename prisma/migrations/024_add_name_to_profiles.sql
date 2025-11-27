-- Migration: Add name field to profiles table
-- This allows admins to set their display name

-- Add name column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_name_idx ON profiles(name) WHERE name IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.name IS 'Display name for admins (e.g., "John Doe")';

