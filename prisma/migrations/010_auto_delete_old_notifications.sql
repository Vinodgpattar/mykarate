-- Auto-delete notifications older than 7 days
-- This migration sets up automatic cleanup of old notifications

-- ============================================
-- 1. Create function to delete old notifications
-- ============================================
CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete notifications older than 7 days
  -- This will cascade delete notification_recipients due to ON DELETE CASCADE
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the deletion (optional - you can remove this if you don't want logs)
  RAISE NOTICE 'Deleted % old notifications', deleted_count;
END;
$$;

-- ============================================
-- 2. Set up pg_cron to run daily
-- ============================================
-- Note: pg_cron extension must be enabled in Supabase
-- Check if pg_cron is available, if not, you'll need to enable it via Supabase Dashboard
-- or use a Supabase Edge Function with a cron trigger instead

-- Drop existing schedule if it exists (for idempotency)
DO $$
BEGIN
  -- Try to unschedule if it exists
  PERFORM cron.unschedule('delete-old-notifications-daily')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'delete-old-notifications-daily'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore if pg_cron is not available
    NULL;
END $$;

-- Schedule the cleanup to run daily at 2 AM UTC
-- Adjust time as needed: '0 2 * * *' = 2 AM daily
DO $$
BEGIN
  -- Only schedule if pg_cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'delete-old-notifications-daily',
      '0 2 * * *', -- 2 AM UTC daily
      'SELECT delete_old_notifications()'
    );
    RAISE NOTICE 'Scheduled daily cleanup of old notifications';
  ELSE
    RAISE NOTICE 'pg_cron extension not available. Please set up a Supabase Edge Function with cron trigger instead.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule cron job. Error: %', SQLERRM;
END $$;

-- ============================================
-- 3. Alternative: Manual trigger function
-- ============================================
-- If pg_cron is not available, you can call this function manually
-- or set up a Supabase Edge Function with a cron trigger

-- Example: Call manually to test
-- SELECT delete_old_notifications();

-- ============================================
-- Migration Complete
-- ============================================
-- Notes:
-- 1. This will automatically delete notifications older than 7 days
-- 2. Associated notification_recipients will be deleted automatically (CASCADE)
-- 3. Images in storage will NOT be deleted automatically (they remain in Supabase Storage)
-- 4. If pg_cron is not available, set up a Supabase Edge Function with cron trigger
-- 5. To test: SELECT delete_old_notifications();

