-- Migration: Enhance Branch Management System
-- Adds phone/email to branches, admin details to profiles, audit logs, and email logs

-- 1. Add phone and email to branches table
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create indexes for search
CREATE INDEX IF NOT EXISTS branches_phone_idx ON branches(phone);
CREATE INDEX IF NOT EXISTS branches_email_idx ON branches(email);

-- 2. Add admin detail fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS qualifications VARCHAR(200),
ADD COLUMN IF NOT EXISTS experience VARCHAR(100),
ADD COLUMN IF NOT EXISTS specialization VARCHAR(200);

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON profiles(phone);

-- 3. Create branch_audit_logs table
CREATE TABLE IF NOT EXISTS branch_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'admin_change'
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS branch_audit_logs_branch_id_idx ON branch_audit_logs(branch_id);
CREATE INDEX IF NOT EXISTS branch_audit_logs_changed_by_idx ON branch_audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS branch_audit_logs_created_at_idx ON branch_audit_logs(created_at);

-- Enable RLS on audit logs
ALTER TABLE branch_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit logs
DROP POLICY IF EXISTS "Super admins can read audit logs" ON branch_audit_logs;
DROP POLICY IF EXISTS "Service role full access to audit logs" ON branch_audit_logs;

CREATE POLICY "Super admins can read audit logs"
  ON branch_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Service role full access to audit logs"
  ON branch_audit_logs FOR ALL
  USING (auth.role() = 'service_role');

-- 4. Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT,
  email_type VARCHAR(50), -- 'admin_welcome', 'admin_removed', 'admin_assignment'
  status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS email_logs_recipient_idx ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS email_logs_status_idx ON email_logs(status);
CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON email_logs(created_at);

-- Enable RLS on email logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email logs
DROP POLICY IF EXISTS "Super admins can read email logs" ON email_logs;
DROP POLICY IF EXISTS "Service role full access to email logs" ON email_logs;

CREATE POLICY "Super admins can read email logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Service role full access to email logs"
  ON email_logs FOR ALL
  USING (auth.role() = 'service_role');

