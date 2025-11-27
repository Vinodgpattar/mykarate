-- Migration: Fix Production Issues in Fees System
-- Critical fixes for production readiness

-- ============================================
-- 1. Add constraint to ensure paid_amount <= amount
-- ============================================
ALTER TABLE student_fees
DROP CONSTRAINT IF EXISTS check_paid_amount_not_exceed;

ALTER TABLE student_fees
ADD CONSTRAINT check_paid_amount_not_exceed
CHECK (paid_amount <= amount);

-- ============================================
-- 2. Add index for better performance on fee generation checks
-- ============================================
CREATE INDEX IF NOT EXISTS student_fees_student_type_period_idx 
  ON student_fees(student_id, fee_type, period_start_date, period_end_date, status)
  WHERE fee_type IN ('monthly', 'yearly');

-- ============================================
-- Migration Complete
-- ============================================
-- Summary:
-- 1. Added constraint to prevent paid_amount from exceeding amount
-- 2. Added index for faster duplicate fee detection

