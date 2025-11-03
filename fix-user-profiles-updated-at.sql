-- ============================================
-- FIX: Add updated_at column to user_profiles table
-- This resolves the "record 'new' has no field 'updated_at'" error
-- ============================================

-- Add updated_at column to user_profiles if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- Create trigger to automatically update updated_at on any update
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have current timestamp (optional)
-- UPDATE user_profiles SET updated_at = NOW() WHERE updated_at IS NULL;
