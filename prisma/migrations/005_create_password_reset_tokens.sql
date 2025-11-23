-- Migration: Create Password Reset Tokens Table
-- For password reset functionality

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS password_reset_tokens_token_idx ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS password_reset_tokens_used_idx ON password_reset_tokens(used);

-- Enable RLS on password_reset_tokens
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for password_reset_tokens
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role full access to password_reset_tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Users can read own reset tokens" ON password_reset_tokens;

-- Service role can do everything (for server-side operations)
CREATE POLICY "Service role full access to password_reset_tokens"
  ON password_reset_tokens FOR ALL
  USING (auth.role() = 'service_role');

-- Users can read their own reset tokens (for validation)
CREATE POLICY "Users can read own reset tokens"
  ON password_reset_tokens FOR SELECT
  USING (user_id = auth.uid());

-- Function to cleanup expired tokens (optional, can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() OR (used = true AND used_at < NOW() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql;

