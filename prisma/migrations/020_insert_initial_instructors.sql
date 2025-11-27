-- Migration: Insert Initial Instructors Data
-- Insert the 4 instructors for the public view
-- Note: Update profile_image_url after uploading images to Supabase Storage

-- Insert Rajesh B Yaragatti (Chief Instructor, 3rd Dan)
INSERT INTO instructors (name, title, belt_rank, description, is_featured, order_index)
VALUES (
  'Rajesh B Yaragatti',
  'Chief Instructor',
  '3rd Dan',
  'Chief Instructor with extensive experience in Shotokan Karate. Dedicated to teaching and developing students.',
  true,
  1
)
ON CONFLICT DO NOTHING;

-- Insert Pradeep Kumar (Shihan, 5th Dan)
INSERT INTO instructors (name, title, belt_rank, description, is_featured, order_index)
VALUES (
  'Pradeep Kumar',
  'Shihan',
  '5th Dan',
  'Shihan Pradeep Kumar - Master instructor with decades of experience in Shotokan Karate.',
  true,
  2
)
ON CONFLICT DO NOTHING;

-- Insert Chinmayee R. Yaragatti (Instructor, 1st Dan)
INSERT INTO instructors (name, title, belt_rank, description, is_featured, order_index)
VALUES (
  'Chinmayee R. Yaragatti',
  'Instructor',
  '1st Dan',
  'Instructor specializing in training students of all levels.',
  true,
  3
)
ON CONFLICT DO NOTHING;

-- Insert Munaf S. Kanwar (Instructor, 1st Dan)
INSERT INTO instructors (name, title, belt_rank, description, is_featured, order_index)
VALUES (
  'Munaf S. Kanwar',
  'Instructor',
  '1st Dan',
  'Instructor committed to helping students achieve their karate goals.',
  true,
  4
)
ON CONFLICT DO NOTHING;

-- Note: After uploading images to Supabase Storage, update profile_image_url:
-- Note: Use migration 021_update_instructor_images.sql to update profile_image_url after uploading images

