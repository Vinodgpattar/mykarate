-- Migration: Create Fees and Payment System
-- Comprehensive fee management for karate dojo

-- ============================================
-- 1. Fee Configurations Table
-- ============================================
-- Stores fee amounts (branch-specific or global)
CREATE TABLE IF NOT EXISTS fee_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type VARCHAR(50) NOT NULL CHECK (fee_type IN ('registration', 'monthly', 'yearly', 'grading')),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE, -- NULL = global/default
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  is_active BOOLEAN DEFAULT true,
  created_by_id UUID, -- Admin who set this
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure one active fee per type per branch (using unique index with WHERE clause)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_fee_per_branch 
  ON fee_configurations(fee_type, COALESCE(branch_id::text, ''))
  WHERE is_active = true;

-- Indexes for fee_configurations
CREATE INDEX IF NOT EXISTS fee_configurations_fee_type_idx ON fee_configurations(fee_type);
CREATE INDEX IF NOT EXISTS fee_configurations_branch_id_idx ON fee_configurations(branch_id);
CREATE INDEX IF NOT EXISTS fee_configurations_is_active_idx ON fee_configurations(is_active);
CREATE INDEX IF NOT EXISTS fee_configurations_fee_type_branch_idx ON fee_configurations(fee_type, branch_id, is_active);

-- ============================================
-- 2. Student Payment Preferences Table
-- ============================================
-- Tracks whether student pays monthly or yearly
CREATE TABLE IF NOT EXISTS student_payment_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('monthly', 'yearly')),
  started_from DATE NOT NULL, -- When this preference started
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for student_payment_preferences
CREATE INDEX IF NOT EXISTS student_payment_preferences_student_id_idx ON student_payment_preferences(student_id);
CREATE INDEX IF NOT EXISTS student_payment_preferences_payment_type_idx ON student_payment_preferences(payment_type);

-- ============================================
-- 3. Student Fees Table
-- ============================================
-- Tracks fees assigned to students
CREATE TABLE IF NOT EXISTS student_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_type VARCHAR(50) NOT NULL CHECK (fee_type IN ('registration', 'monthly', 'yearly', 'grading')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_amount DECIMAL(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50), -- 'cash', 'bank_transfer', etc.
  receipt_number VARCHAR(50),
  notes TEXT,
  
  -- For monthly/yearly fees: track which period
  period_start_date DATE,
  period_end_date DATE,
  
  -- For grading fees: link to belt upgrade
  belt_grading_id UUID, -- Will reference belt_gradings table
  
  -- Reminder tracking
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  overdue_notification_sent_at TIMESTAMP WITH TIME ZONE,
  
  recorded_by_id UUID, -- Admin who recorded payment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for student_fees
CREATE INDEX IF NOT EXISTS student_fees_student_id_idx ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS student_fees_fee_type_idx ON student_fees(fee_type);
CREATE INDEX IF NOT EXISTS student_fees_status_idx ON student_fees(status);
CREATE INDEX IF NOT EXISTS student_fees_due_date_idx ON student_fees(due_date);
CREATE INDEX IF NOT EXISTS student_fees_student_status_idx ON student_fees(student_id, status);
CREATE INDEX IF NOT EXISTS student_fees_due_date_status_idx ON student_fees(due_date, status);
CREATE INDEX IF NOT EXISTS student_fees_belt_grading_id_idx ON student_fees(belt_grading_id);

-- ============================================
-- 4. Belt Gradings Table
-- ============================================
-- Tracks belt promotions (for grading fees)
CREATE TABLE IF NOT EXISTS belt_gradings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  from_belt VARCHAR(50) NOT NULL,
  to_belt VARCHAR(50) NOT NULL,
  grading_date DATE NOT NULL,
  fee_amount DECIMAL(10,2), -- Amount at time of grading
  student_fee_id UUID REFERENCES student_fees(id) ON DELETE SET NULL,
  created_by_id UUID, -- Admin who recorded grading
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for belt_gradings
CREATE INDEX IF NOT EXISTS belt_gradings_student_id_idx ON belt_gradings(student_id);
CREATE INDEX IF NOT EXISTS belt_gradings_grading_date_idx ON belt_gradings(grading_date DESC);
CREATE INDEX IF NOT EXISTS belt_gradings_student_fee_id_idx ON belt_gradings(student_fee_id);

-- ============================================
-- 5. Fee Configuration History Table
-- ============================================
-- Tracks when fee amounts changed (for audit)
CREATE TABLE IF NOT EXISTS fee_configuration_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_configuration_id UUID NOT NULL REFERENCES fee_configurations(id) ON DELETE CASCADE,
  fee_type VARCHAR(50) NOT NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  old_amount DECIMAL(10,2),
  new_amount DECIMAL(10,2),
  changed_by_id UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Indexes for fee_configuration_history
CREATE INDEX IF NOT EXISTS fee_configuration_history_fee_config_id_idx ON fee_configuration_history(fee_configuration_id);
CREATE INDEX IF NOT EXISTS fee_configuration_history_fee_type_idx ON fee_configuration_history(fee_type);
CREATE INDEX IF NOT EXISTS fee_configuration_history_changed_at_idx ON fee_configuration_history(changed_at DESC);

-- ============================================
-- 6. Enable RLS
-- ============================================
ALTER TABLE fee_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_payment_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE belt_gradings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_configuration_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS Policies for fee_configurations
-- ============================================
DROP POLICY IF EXISTS "Super admins full access to fee configurations" ON fee_configurations;
DROP POLICY IF EXISTS "Branch admins can view branch fee configurations" ON fee_configurations;
DROP POLICY IF EXISTS "Students can view fee configurations" ON fee_configurations;
DROP POLICY IF EXISTS "Service role full access to fee configurations" ON fee_configurations;

-- Super admins can do everything
CREATE POLICY "Super admins full access to fee configurations"
  ON fee_configurations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Branch admins can view fee configurations (for their branch and global)
CREATE POLICY "Branch admins can view branch fee configurations"
  ON fee_configurations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND (fee_configurations.branch_id IS NULL OR fee_configurations.branch_id = profiles.branch_id)
    )
  );

-- Students can view fee configurations
CREATE POLICY "Students can view fee configurations"
  ON fee_configurations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'student'
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to fee configurations"
  ON fee_configurations FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 8. RLS Policies for student_payment_preferences
-- ============================================
DROP POLICY IF EXISTS "Students can view own payment preference" ON student_payment_preferences;
DROP POLICY IF EXISTS "Admins can view all payment preferences" ON student_payment_preferences;
DROP POLICY IF EXISTS "Admins can update payment preferences" ON student_payment_preferences;
DROP POLICY IF EXISTS "Service role full access to payment preferences" ON student_payment_preferences;

-- Students can view their own preference
CREATE POLICY "Students can view own payment preference"
  ON student_payment_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'student'
      AND EXISTS (
        SELECT 1 FROM students
        WHERE students.id = student_payment_preferences.student_id
        AND students.user_id = profiles.user_id
      )
    )
  );

-- Admins can view all preferences
CREATE POLICY "Admins can view all payment preferences"
  ON student_payment_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Admins can update preferences
CREATE POLICY "Admins can update payment preferences"
  ON student_payment_preferences FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to payment preferences"
  ON student_payment_preferences FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 9. RLS Policies for student_fees
-- ============================================
DROP POLICY IF EXISTS "Students can view own fees" ON student_fees;
DROP POLICY IF EXISTS "Super admins full access to student fees" ON student_fees;
DROP POLICY IF EXISTS "Branch admins can view branch student fees" ON student_fees;
DROP POLICY IF EXISTS "Admins can update student fees" ON student_fees;
DROP POLICY IF EXISTS "Service role full access to student fees" ON student_fees;

-- Students can view their own fees
CREATE POLICY "Students can view own fees"
  ON student_fees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'student'
      AND EXISTS (
        SELECT 1 FROM students
        WHERE students.id = student_fees.student_id
        AND students.user_id = profiles.user_id
      )
    )
  );

-- Super admins can do everything
CREATE POLICY "Super admins full access to student fees"
  ON student_fees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Branch admins can view fees for their branch students
CREATE POLICY "Branch admins can view branch student fees"
  ON student_fees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND EXISTS (
        SELECT 1 FROM students
        WHERE students.id = student_fees.student_id
        AND students.branch_id = profiles.branch_id
      )
    )
  );

-- Admins can update fees (for payment recording)
CREATE POLICY "Admins can update student fees"
  ON student_fees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to student fees"
  ON student_fees FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 10. RLS Policies for belt_gradings
-- ============================================
DROP POLICY IF EXISTS "Students can view own belt gradings" ON belt_gradings;
DROP POLICY IF EXISTS "Super admins full access to belt gradings" ON belt_gradings;
DROP POLICY IF EXISTS "Branch admins can view branch belt gradings" ON belt_gradings;
DROP POLICY IF EXISTS "Admins can manage belt gradings" ON belt_gradings;
DROP POLICY IF EXISTS "Service role full access to belt gradings" ON belt_gradings;

-- Students can view their own gradings
CREATE POLICY "Students can view own belt gradings"
  ON belt_gradings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'student'
      AND EXISTS (
        SELECT 1 FROM students
        WHERE students.id = belt_gradings.student_id
        AND students.user_id = profiles.user_id
      )
    )
  );

-- Super admins can do everything
CREATE POLICY "Super admins full access to belt gradings"
  ON belt_gradings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Branch admins can view gradings for their branch students
CREATE POLICY "Branch admins can view branch belt gradings"
  ON belt_gradings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND EXISTS (
        SELECT 1 FROM students
        WHERE students.id = belt_gradings.student_id
        AND students.branch_id = profiles.branch_id
      )
    )
  );

-- Admins can manage gradings
CREATE POLICY "Admins can manage belt gradings"
  ON belt_gradings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to belt gradings"
  ON belt_gradings FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 11. RLS Policies for fee_configuration_history
-- ============================================
DROP POLICY IF EXISTS "Admins can view fee history" ON fee_configuration_history;
DROP POLICY IF EXISTS "Service role full access to fee history" ON fee_configuration_history;

-- Admins can view history
CREATE POLICY "Admins can view fee history"
  ON fee_configuration_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to fee history"
  ON fee_configuration_history FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 12. Create updated_at triggers
-- ============================================
-- Function for fee_configurations
CREATE OR REPLACE FUNCTION update_fee_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fee_configurations_updated_at_trigger ON fee_configurations;
CREATE TRIGGER update_fee_configurations_updated_at_trigger
  BEFORE UPDATE ON fee_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_fee_configurations_updated_at();

-- Function for student_payment_preferences
CREATE OR REPLACE FUNCTION update_payment_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_preferences_updated_at_trigger ON student_payment_preferences;
CREATE TRIGGER update_payment_preferences_updated_at_trigger
  BEFORE UPDATE ON student_payment_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_preferences_updated_at();

-- Function for student_fees
CREATE OR REPLACE FUNCTION update_student_fees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_student_fees_updated_at_trigger ON student_fees;
CREATE TRIGGER update_student_fees_updated_at_trigger
  BEFORE UPDATE ON student_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_student_fees_updated_at();

-- Function for belt_gradings
CREATE OR REPLACE FUNCTION update_belt_gradings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_belt_gradings_updated_at_trigger ON belt_gradings;
CREATE TRIGGER update_belt_gradings_updated_at_trigger
  BEFORE UPDATE ON belt_gradings
  FOR EACH ROW
  EXECUTE FUNCTION update_belt_gradings_updated_at();

-- ============================================
-- Migration Complete
-- ============================================
-- Summary:
-- 1. Created fee_configurations table (fee amounts by type and branch)
-- 2. Created student_payment_preferences table (monthly/yearly tracking)
-- 3. Created student_fees table (all fees assigned to students)
-- 4. Created belt_gradings table (belt promotion tracking)
-- 5. Created fee_configuration_history table (audit trail)
-- 6. Set up RLS policies for all tables
-- 7. Created indexes for performance
-- 8. Added updated_at triggers for all tables

