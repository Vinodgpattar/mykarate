-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  address TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_by_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS branches_code_idx ON branches(code);
CREATE INDEX IF NOT EXISTS branches_status_idx ON branches(status);
CREATE INDEX IF NOT EXISTS branches_created_by_id_idx ON branches(created_by_id);

-- Update profiles table to add branch_id column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- Create index on branch_id
CREATE INDEX IF NOT EXISTS profiles_branch_id_idx ON profiles(branch_id);

-- Enable RLS on branches
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for branches
-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Super admins full access to branches" ON branches;
DROP POLICY IF EXISTS "Branch admins can read own branch" ON branches;
DROP POLICY IF EXISTS "Service role full access to branches" ON branches;

-- Super admins can do everything
CREATE POLICY "Super admins full access to branches"
  ON branches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Branch admins can read their own branch
CREATE POLICY "Branch admins can read own branch"
  ON branches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.branch_id = branches.id
      AND profiles.role = 'admin'
    )
  );

-- Service role can do everything
CREATE POLICY "Service role full access to branches"
  ON branches FOR ALL
  USING (auth.role() = 'service_role');

