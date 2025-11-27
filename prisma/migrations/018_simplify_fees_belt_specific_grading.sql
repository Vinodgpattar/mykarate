-- Migration: Simplify Fees - Global Only + Belt-Specific Grading
-- Remove branch-wise fees, add belt-specific grading fees

-- ============================================
-- 1. Add belt_level column for grading fees
-- ============================================
ALTER TABLE fee_configurations
ADD COLUMN IF NOT EXISTS belt_level VARCHAR(50);

-- ============================================
-- 2. Update fee_configuration_history to include belt_level
-- ============================================
ALTER TABLE fee_configuration_history
ADD COLUMN IF NOT EXISTS belt_level VARCHAR(50);

-- ============================================
-- 3. Drop old unique constraint
-- ============================================
DROP INDEX IF EXISTS unique_active_fee_per_branch;

-- ============================================
-- 4. Create new unique constraints
-- ============================================
-- For non-grading fees: one active global fee per type
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_global_fee 
  ON fee_configurations(fee_type)
  WHERE is_active = true 
    AND fee_type != 'grading' 
    AND branch_id IS NULL
    AND belt_level IS NULL;

-- For grading fees: one active fee per belt level (global only)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_grading_fee_per_belt 
  ON fee_configurations(fee_type, belt_level)
  WHERE is_active = true 
    AND fee_type = 'grading' 
    AND branch_id IS NULL
    AND belt_level IS NOT NULL;

-- ============================================
-- 5. Add constraint to ensure grading fees have belt_level
-- ============================================
ALTER TABLE fee_configurations
DROP CONSTRAINT IF EXISTS check_grading_has_belt_level;

ALTER TABLE fee_configurations
ADD CONSTRAINT check_grading_has_belt_level
CHECK (
  (fee_type = 'grading' AND belt_level IS NOT NULL) OR
  (fee_type != 'grading' AND belt_level IS NULL)
);

-- ============================================
-- 6. Add constraint to ensure all fees are global (branch_id is NULL)
-- ============================================
ALTER TABLE fee_configurations
DROP CONSTRAINT IF EXISTS check_all_fees_global;

ALTER TABLE fee_configurations
ADD CONSTRAINT check_all_fees_global
CHECK (branch_id IS NULL);

-- ============================================
-- 7. Update indexes
-- ============================================
CREATE INDEX IF NOT EXISTS fee_configurations_belt_level_idx 
  ON fee_configurations(belt_level) 
  WHERE belt_level IS NOT NULL;

-- ============================================
-- 8. Update existing data: Set all branch_id to NULL (make all fees global)
-- ============================================
UPDATE fee_configurations
SET branch_id = NULL
WHERE branch_id IS NOT NULL;

-- ============================================
-- Migration Complete
-- ============================================
-- Summary:
-- 1. Added belt_level column for grading fees
-- 2. Removed branch_id requirement (all fees are global now)
-- 3. Updated unique constraints for global fees and belt-specific grading
-- 4. Added constraint to ensure grading fees have belt_level
-- 5. Added constraint to ensure all fees are global (branch_id = NULL)
-- 6. Updated existing data to be global
