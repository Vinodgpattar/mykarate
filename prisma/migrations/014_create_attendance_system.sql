-- Migration: Create Attendance System
-- Simple attendance tracking for karate classes

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
  marked_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One record per student per class date
  UNIQUE(student_id, class_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS attendance_records_student_id_idx 
  ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS attendance_records_class_date_idx 
  ON attendance_records(class_date DESC);
CREATE INDEX IF NOT EXISTS attendance_records_status_idx 
  ON attendance_records(status);
CREATE INDEX IF NOT EXISTS attendance_records_marked_by_idx 
  ON attendance_records(marked_by);
CREATE INDEX IF NOT EXISTS attendance_records_student_date_idx 
  ON attendance_records(student_id, class_date DESC);

-- Enable RLS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Students can select own attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Super admins can select all attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Branch admins can select branch attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Super admins can insert attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Branch admins can insert branch attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Super admins can update attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Branch admins can update branch attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Service role full access to attendance records" ON attendance_records;

-- Students can select their own attendance records
CREATE POLICY "Students can select own attendance records"
  ON attendance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'student'
      AND EXISTS (
        SELECT 1 FROM students
        WHERE students.id = attendance_records.student_id
        AND students.user_id = profiles.user_id
      )
    )
  );

-- Super admins can select all attendance records
CREATE POLICY "Super admins can select all attendance records"
  ON attendance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Branch admins can select attendance records for their branch students
CREATE POLICY "Branch admins can select branch attendance records"
  ON attendance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND EXISTS (
        SELECT 1 FROM students
        WHERE students.id = attendance_records.student_id
        AND students.branch_id = profiles.branch_id
      )
    )
  );

-- Super admins can insert attendance records
CREATE POLICY "Super admins can insert attendance records"
  ON attendance_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Branch admins can insert attendance records for their branch students
CREATE POLICY "Branch admins can insert branch attendance records"
  ON attendance_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND EXISTS (
        SELECT 1 FROM students
        WHERE students.id = attendance_records.student_id
        AND students.branch_id = profiles.branch_id
      )
    )
  );

-- Super admins can update attendance records
CREATE POLICY "Super admins can update attendance records"
  ON attendance_records FOR UPDATE
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

-- Branch admins can update attendance records for their branch students
CREATE POLICY "Branch admins can update branch attendance records"
  ON attendance_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND EXISTS (
        SELECT 1 FROM students
        WHERE students.id = attendance_records.student_id
        AND students.branch_id = profiles.branch_id
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND EXISTS (
        SELECT 1 FROM students
        WHERE students.id = attendance_records.student_id
        AND students.branch_id = profiles.branch_id
      )
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to attendance records"
  ON attendance_records FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 6. Create function to update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS update_attendance_updated_at_trigger ON attendance_records;

-- Create trigger
CREATE TRIGGER update_attendance_updated_at_trigger
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at();

-- ============================================
-- Migration Complete
-- ============================================
-- Summary:
-- 1. Created attendance_records table
-- 2. Added status field (present/absent/leave)
-- 3. Added unique constraint (one record per student per date)
-- 4. Set up RLS policies for students and admins
-- 5. Created indexes for performance
-- 6. Added updated_at trigger for automatic timestamp updates

