-- Migration: Create Students Table
-- Comprehensive student management with all fields

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(15) UNIQUE NOT NULL, -- KSC24-0001 format
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Personal Information (Optional - Student completes)
  date_of_birth DATE,
  gender VARCHAR(20), -- 'Male', 'Female', 'Other'
  address TEXT,
  aadhar_number VARCHAR(12),
  
  -- Documents (Optional - Student uploads)
  student_photo_url TEXT,
  aadhar_card_url TEXT,
  
  -- Karate Information
  current_belt VARCHAR(50) DEFAULT 'White', -- 'White', 'Yellow', 'Orange', etc.
  
  -- Parent/Guardian Information (Optional)
  parent_name VARCHAR(100),
  parent_email VARCHAR(255),
  parent_phone VARCHAR(20),
  parent_relation VARCHAR(50), -- 'Father', 'Mother', 'Guardian', 'Other'
  
  -- Emergency Contact (Optional)
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(50),
  
  -- Medical & Notes (Optional)
  medical_conditions TEXT,
  notes TEXT,
  
  -- System Fields
  profile_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  password_hash VARCHAR(255), -- Hashed password (backup)
  created_by_id UUID, -- Admin who created the student
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS students_student_id_idx ON students(student_id);
CREATE INDEX IF NOT EXISTS students_email_idx ON students(email);
CREATE INDEX IF NOT EXISTS students_branch_id_idx ON students(branch_id);
CREATE INDEX IF NOT EXISTS students_user_id_idx ON students(user_id);
CREATE INDEX IF NOT EXISTS students_is_active_idx ON students(is_active);
CREATE INDEX IF NOT EXISTS students_profile_completed_idx ON students(profile_completed);
CREATE INDEX IF NOT EXISTS students_current_belt_idx ON students(current_belt);
CREATE INDEX IF NOT EXISTS students_created_at_idx ON students(created_at);

-- Enable RLS on students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students
-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Super admins full access to students" ON students;
DROP POLICY IF EXISTS "Branch admins can manage own branch students" ON students;
DROP POLICY IF EXISTS "Students can read own profile" ON students;
DROP POLICY IF EXISTS "Students can update own profile" ON students;
DROP POLICY IF EXISTS "Service role full access to students" ON students;

-- Super admins can do everything
CREATE POLICY "Super admins full access to students"
  ON students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Branch admins can manage students in their branch
CREATE POLICY "Branch admins can manage own branch students"
  ON students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.branch_id = students.branch_id
    )
  );

-- Students can read their own profile
CREATE POLICY "Students can read own profile"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'student'
      AND profiles.user_id = students.user_id
    )
  );

-- Students can update their own profile
CREATE POLICY "Students can update own profile"
  ON students FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'student'
      AND profiles.user_id = students.user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'student'
      AND profiles.user_id = students.user_id
    )
  );

-- Service role can do everything (for server-side operations)
CREATE POLICY "Service role full access to students"
  ON students FOR ALL
  USING (auth.role() = 'service_role');

