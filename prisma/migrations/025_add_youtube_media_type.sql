-- Migration: Add 'youtube' media type to public_gallery
-- This allows storing YouTube video links instead of uploading videos to storage

-- Update public_gallery to support 'youtube' media type
ALTER TABLE public_gallery 
DROP CONSTRAINT IF EXISTS public_gallery_media_type_check;

ALTER TABLE public_gallery 
ADD CONSTRAINT public_gallery_media_type_check 
CHECK (media_type IN ('image', 'video', 'youtube'));

-- Add comment to document the change
COMMENT ON COLUMN public_gallery.media_type IS 'Media type: image (uploaded), video (uploaded), or youtube (YouTube link)';



