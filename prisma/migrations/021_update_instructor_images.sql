-- Migration: Update Instructor Profile Image URLs
-- Run this after uploading profile images to Supabase Storage
-- Replace the placeholder URLs below with your actual Supabase Storage public URLs

-- IMPORTANT: Before running this script:
-- 1. Upload profile.jpeg to each instructor folder in public-assets bucket
-- 2. Get the public URL for each image from Supabase Storage
-- 3. Replace 'YOUR_PUBLIC_URL_HERE' with the actual URLs below

-- Update Rajesh B Yaragatti
UPDATE instructors 
SET profile_image_url = 'https://xbqsjvceqagbtijyfrpj.supabase.co/storage/v1/object/public/public-assets/instructors/rajesh-yaragatti/profile.jpeg'
WHERE name = 'Rajesh B Yaragatti';

-- Update Pradeep Kumar
UPDATE instructors 
SET profile_image_url = 'https://xbqsjvceqagbtijyfrpj.supabase.co/storage/v1/object/public/public-assets/instructors/pradeep-kumar/hero-image.jpeg'
WHERE name = 'Pradeep Kumar';

-- Update Chinmayee R. Yaragatti
UPDATE instructors 
SET profile_image_url = 'https://xbqsjvceqagbtijyfrpj.supabase.co/storage/v1/object/public/public-assets/instructors/chinmayee-yaragatti/profile.jpeg'
WHERE name = 'Chinmayee R. Yaragatti';

-- Update Munaf S. Kanwar
UPDATE instructors 
SET profile_image_url = 'https://xbqsjvceqagbtijyfrpj.supabase.co/storage/v1/object/public/public-assets/instructors/munaf-kanwar/profile.jpeg'
WHERE name = 'Munaf S. Kanwar';

-- Verify the updates
SELECT 
  name, 
  title,
  profile_image_url,
  CASE 
    WHEN profile_image_url IS NULL THEN '❌ Missing'
    WHEN profile_image_url = 'YOUR_PUBLIC_URL_HERE' THEN '⚠️ Not Updated'
    ELSE '✅ Set'
  END as status
FROM instructors 
ORDER BY order_index;

