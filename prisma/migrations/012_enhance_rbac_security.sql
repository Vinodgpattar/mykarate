-- Enhance RBAC Security
-- This migration adds role validation, role change protection, and audit logging

-- ============================================
-- 1. Add role validation constraint (if not exists)
-- ============================================
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_role_check'
  ) THEN
    -- Add CHECK constraint for role validation
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('super_admin', 'admin', 'student'));
    
    RAISE NOTICE 'Added role validation constraint';
  ELSE
    RAISE NOTICE 'Role validation constraint already exists';
  END IF;
END $$;

-- ============================================
-- 2. Drop and recreate role update policy
-- ============================================
DROP POLICY IF EXISTS "Only service role can update role" ON profiles;

-- Only service role can update role field (prevent privilege escalation)
CREATE POLICY "Only service role can update role"
  ON profiles FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 3. Create audit log table for role changes
-- ============================================
CREATE TABLE IF NOT EXISTS role_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  old_role VARCHAR(20),
  new_role VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS role_audit_logs_user_id_idx ON role_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS role_audit_logs_changed_at_idx ON role_audit_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS role_audit_logs_changed_by_idx ON role_audit_logs(changed_by);

-- Enable RLS
ALTER TABLE role_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (for idempotency)
DROP POLICY IF EXISTS "Super admins can read role audit logs" ON role_audit_logs;
DROP POLICY IF EXISTS "Service role full access to role audit logs" ON role_audit_logs;

-- Super admins can read all role audit logs
CREATE POLICY "Super admins can read role audit logs"
  ON role_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Service role can do everything
CREATE POLICY "Service role full access to role audit logs"
  ON role_audit_logs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 4. Create function to log role changes
-- ============================================
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO role_audit_logs (
      user_id,
      old_role,
      new_role,
      changed_by,
      changed_at
    ) VALUES (
      NEW.user_id,
      OLD.role,
      NEW.role,
      auth.uid(), -- Current user making the change (if available)
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS role_change_audit_trigger ON profiles;

-- Create trigger
CREATE TRIGGER role_change_audit_trigger
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_role_change();

-- ============================================
-- 5. Create function to update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON profiles;
CREATE TRIGGER update_profiles_updated_at_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================
-- Migration Complete
-- ============================================
-- Summary:
-- 1. Added role validation constraint
-- 2. Added role change protection policy
-- 3. Created role audit log table
-- 4. Created trigger to log role changes
-- 5. Added updated_at trigger for profiles


