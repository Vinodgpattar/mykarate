-- Notification System Migration
-- Idempotent: Safe to run multiple times
-- Creates tables, RLS policies, indexes, and storage bucket for notifications

-- ============================================
-- 1. Create notifications table
-- ============================================
-- Drop tables only if they exist with wrong structure (missing created_by column)
DO $$
BEGIN
  -- Check if notifications table exists but is missing the created_by column
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'created_by'
  ) THEN
    -- Table exists but has wrong structure - drop it
    DROP TABLE IF EXISTS notification_recipients CASCADE;
    DROP TABLE IF EXISTS notifications CASCADE;
  END IF;
  
  -- Check if user_push_tokens exists but is missing token column
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_push_tokens'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_push_tokens' 
    AND column_name = 'token'
  ) THEN
    DROP TABLE IF EXISTS user_push_tokens CASCADE;
  END IF;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'alert', 'reminder', 'achievement', 'event', 'payment', 'class', 'system')),
  image_url TEXT, -- Supabase Storage URL
  created_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'branch', 'students')) DEFAULT 'all',
  target_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  target_student_ids JSONB, -- Array of student IDs: ["uuid1", "uuid2"]
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_count INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Create notification_recipients table
-- ============================================
CREATE TABLE IF NOT EXISTS notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- ============================================
-- 3. Create user_push_tokens table
-- ============================================
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform, device_id)
);

-- ============================================
-- 4. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS notifications_created_by_idx ON notifications(created_by);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);
CREATE INDEX IF NOT EXISTS notifications_target_type_idx ON notifications(target_type);
CREATE INDEX IF NOT EXISTS notifications_target_branch_id_idx ON notifications(target_branch_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_sent_at_idx ON notifications(sent_at DESC);

CREATE INDEX IF NOT EXISTS notification_recipients_notification_id_idx ON notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS notification_recipients_user_id_idx ON notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS notification_recipients_read_idx ON notification_recipients(read);
CREATE INDEX IF NOT EXISTS notification_recipients_user_read_idx ON notification_recipients(user_id, read);

CREATE INDEX IF NOT EXISTS user_push_tokens_user_id_idx ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS user_push_tokens_token_idx ON user_push_tokens(token);
CREATE INDEX IF NOT EXISTS user_push_tokens_platform_idx ON user_push_tokens(platform);

-- ============================================
-- 5. Enable Row Level Security
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. Drop existing policies (for idempotency)
-- ============================================
DROP POLICY IF EXISTS "Super admins full access to notifications" ON notifications;
DROP POLICY IF EXISTS "Students can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role full access to notifications" ON notifications;

DROP POLICY IF EXISTS "Users can read own notification recipients" ON notification_recipients;
DROP POLICY IF EXISTS "Users can update own notification recipients" ON notification_recipients;
DROP POLICY IF EXISTS "Super admins full access to notification recipients" ON notification_recipients;
DROP POLICY IF EXISTS "Service role full access to notification recipients" ON notification_recipients;

DROP POLICY IF EXISTS "Users can manage own push tokens" ON user_push_tokens;
DROP POLICY IF EXISTS "Service role full access to push tokens" ON user_push_tokens;

-- ============================================
-- 7. RLS Policies for notifications
-- ============================================

-- Super admins can do everything
CREATE POLICY "Super admins full access to notifications"
  ON notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Students can read notifications they are recipients of
CREATE POLICY "Students can read own notifications"
  ON notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notification_recipients
      WHERE notification_recipients.notification_id = notifications.id
      AND notification_recipients.user_id = auth.uid()
    )
  );

-- Service role can do everything
CREATE POLICY "Service role full access to notifications"
  ON notifications FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 8. RLS Policies for notification_recipients
-- ============================================

-- Users can read their own notification recipients
CREATE POLICY "Users can read own notification recipients"
  ON notification_recipients FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notification recipients (mark as read)
CREATE POLICY "Users can update own notification recipients"
  ON notification_recipients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Super admins can read all notification recipients
CREATE POLICY "Super admins full access to notification recipients"
  ON notification_recipients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Service role can do everything
CREATE POLICY "Service role full access to notification recipients"
  ON notification_recipients FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 9. RLS Policies for user_push_tokens
-- ============================================

-- Users can manage their own push tokens
CREATE POLICY "Users can manage own push tokens"
  ON user_push_tokens FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can do everything
CREATE POLICY "Service role full access to push tokens"
  ON user_push_tokens FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 10. Create function to update read_count
-- ============================================
CREATE OR REPLACE FUNCTION update_notification_read_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.read = false AND NEW.read = true THEN
    UPDATE notifications
    SET read_count = read_count + 1,
        updated_at = NOW()
    WHERE id = NEW.notification_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.read = true AND NEW.read = false THEN
    UPDATE notifications
    SET read_count = GREATEST(read_count - 1, 0),
        updated_at = NOW()
    WHERE id = NEW.notification_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS update_notification_read_count_trigger ON notification_recipients;

-- Create trigger
CREATE TRIGGER update_notification_read_count_trigger
  AFTER UPDATE OF read ON notification_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_count();

-- ============================================
-- 11. Create function to update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notifications_updated_at_trigger ON notifications;
CREATE TRIGGER update_notifications_updated_at_trigger
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

DROP TRIGGER IF EXISTS update_user_push_tokens_updated_at_trigger ON user_push_tokens;
CREATE TRIGGER update_user_push_tokens_updated_at_trigger
  BEFORE UPDATE ON user_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- ============================================
-- 12. Create Supabase Storage bucket (if not exists)
-- ============================================
-- Note: This requires running via Supabase Dashboard or API
-- Storage bucket creation cannot be done via SQL migration
-- Instructions: Go to Supabase Dashboard → Storage → Create bucket "notification-images"
-- Set bucket to public for easy image access

-- ============================================
-- Migration Complete
-- ============================================
-- Next steps:
-- 1. Create storage bucket "notification-images" in Supabase Dashboard
-- 2. Set bucket to public
-- 3. Update Prisma schema
-- 4. Run: npx prisma generate

