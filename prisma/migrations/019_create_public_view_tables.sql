-- Migration: Create Public View Tables
-- Tables for public-facing content: instructors and public gallery

-- ============================================
-- 1. Create instructors table
-- ============================================
CREATE TABLE IF NOT EXISTS instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  title VARCHAR(100), -- "Chief Instructor", "Shihan", "Instructor"
  belt_rank VARCHAR(50), -- "3rd Dan", "5th Dan", "1st Dan"
  description TEXT,
  profile_image_url TEXT,
  gallery_urls TEXT[], -- Array of image URLs
  video_urls TEXT[], -- Array of video URLs
  experience_years INTEGER,
  specialization VARCHAR(255),
  is_featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS instructors_is_featured_idx ON instructors(is_featured);
CREATE INDEX IF NOT EXISTS instructors_order_index_idx ON instructors(order_index);
CREATE INDEX IF NOT EXISTS instructors_name_idx ON instructors(name);

-- Enable RLS on instructors
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public can view instructors" ON instructors;
DROP POLICY IF EXISTS "Admins can manage instructors" ON instructors;
DROP POLICY IF EXISTS "Service role full access to instructors" ON instructors;

-- Public can view instructors (no authentication required)
CREATE POLICY "Public can view instructors"
  ON instructors FOR SELECT
  USING (true);

-- Admins can insert, update, delete instructors
CREATE POLICY "Admins can manage instructors"
  ON instructors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Service role has full access
CREATE POLICY "Service role full access to instructors"
  ON instructors FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 2. Create public_gallery table
-- ============================================
CREATE TABLE IF NOT EXISTS public_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
  title VARCHAR(255),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT, -- For videos, generate thumbnail
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false, -- Show in main gallery preview
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS public_gallery_active_idx ON public_gallery(is_active, order_index);
CREATE INDEX IF NOT EXISTS public_gallery_featured_idx ON public_gallery(is_featured, is_active);
CREATE INDEX IF NOT EXISTS public_gallery_media_type_idx ON public_gallery(media_type);
CREATE INDEX IF NOT EXISTS public_gallery_uploaded_by_idx ON public_gallery(uploaded_by);

-- Enable RLS on public_gallery
ALTER TABLE public_gallery ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public can view gallery" ON public_gallery;
DROP POLICY IF EXISTS "Admins can manage gallery" ON public_gallery;
DROP POLICY IF EXISTS "Service role full access to gallery" ON public_gallery;

-- Public can view active gallery items (no authentication required)
CREATE POLICY "Public can view gallery"
  ON public_gallery FOR SELECT
  USING (is_active = true);

-- Admins can insert, update, delete gallery items
CREATE POLICY "Admins can manage gallery"
  ON public_gallery FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Service role has full access
CREATE POLICY "Service role full access to gallery"
  ON public_gallery FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 3. Add updated_at trigger for instructors
-- ============================================
CREATE OR REPLACE FUNCTION update_instructors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS instructors_updated_at_trigger ON instructors;
CREATE TRIGGER instructors_updated_at_trigger
  BEFORE UPDATE ON instructors
  FOR EACH ROW
  EXECUTE FUNCTION update_instructors_updated_at();

-- ============================================
-- 4. Add updated_at trigger for public_gallery
-- ============================================
CREATE OR REPLACE FUNCTION update_public_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS public_gallery_updated_at_trigger ON public_gallery;
CREATE TRIGGER public_gallery_updated_at_trigger
  BEFORE UPDATE ON public_gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_public_gallery_updated_at();

