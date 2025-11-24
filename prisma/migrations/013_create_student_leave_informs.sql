-- Migration: Create Student Leave Informs Table
-- Simple leave informing system with approval (no rejection)

-- Create student_leave_informs table
CREATE TABLE IF NOT EXISTS student_leave_informs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (LENGTH(message) >= 10),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  approved_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS student_leave_informs_student_id_idx 
  ON student_leave_informs(student_id);
CREATE INDEX IF NOT EXISTS student_leave_informs_status_idx 
  ON student_leave_informs(status);
CREATE INDEX IF NOT EXISTS student_leave_informs_created_at_idx 
  ON student_leave_informs(created_at DESC);
CREATE INDEX IF NOT EXISTS student_leave_informs_approved_by_idx 
  ON student_leave_informs(approved_by);

-- Enable RLS
ALTER TABLE student_leave_informs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Students can insert their own informs
CREATE POLICY "Students can insert own leave informs"
  ON student_leave_informs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'student'
      AND EXISTS (
        SELECT 1 FROM students
        WHERE students.id = student_leave_informs.student_id
        AND students.user_id = profiles.user_id
      )
    )
  );

-- Students can select their own informs
CREATE POLICY "Students can select own leave informs"
  ON student_leave_informs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'student'
      AND EXISTS (
        SELECT 1 FROM students
        WHERE students.id = student_leave_informs.student_id
        AND students.user_id = profiles.user_id
      )
    )
  );

-- Super admins can select all informs
CREATE POLICY "Super admins can select all leave informs"
  ON student_leave_informs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Super admins can update (approve) informs
CREATE POLICY "Super admins can update leave informs"
  ON student_leave_informs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to leave informs"
  ON student_leave_informs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- Migration Complete
-- ============================================
-- Summary:
-- 1. Created student_leave_informs table
-- 2. Added status field (pending/approved only, no rejection)
-- 3. Added approval tracking (approved_by, approved_at)
-- 4. Set up RLS policies for students and super admins
-- 5. Created indexes for performance

