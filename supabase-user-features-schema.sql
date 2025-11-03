-- ============================================
-- BÁN LẸ - User Features Schema
-- Rating System, CCCD Verification, Posts Updates
-- ============================================

-- 1. Update user_profiles table with rating and CCCD fields
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS cccd_front_url TEXT,
ADD COLUMN IF NOT EXISTS cccd_back_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Add index for rating
CREATE INDEX IF NOT EXISTS idx_user_profiles_rating ON user_profiles(rating);

-- 2. Create user_ratings table
CREATE TABLE IF NOT EXISTS user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT no_self_rating CHECK (reviewer_id != target_user_id),
  CONSTRAINT unique_rating UNIQUE (reviewer_id, target_user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_ratings_target_user ON user_ratings(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_reviewer ON user_ratings(reviewer_id);

-- 3. Enable RLS on user_ratings
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_ratings
DROP POLICY IF EXISTS "Anyone can view ratings" ON user_ratings;
CREATE POLICY "Anyone can view ratings"
  ON user_ratings FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Users can create ratings" ON user_ratings;
CREATE POLICY "Users can create ratings"
  ON user_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id AND auth.uid() != target_user_id);

DROP POLICY IF EXISTS "Users can update their own ratings" ON user_ratings;
CREATE POLICY "Users can update their own ratings"
  ON user_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- 4. Function to calculate and update user rating
CREATE OR REPLACE FUNCTION update_user_rating(target_user_uuid UUID)
RETURNS void AS $$
DECLARE
  avg_rating DECIMAL(3,1);
BEGIN
  -- Calculate average rating (rounded to 1 decimal)
  SELECT ROUND(AVG(rating)::numeric, 1)::DECIMAL(3,1)
  INTO avg_rating
  FROM user_ratings
  WHERE target_user_id = target_user_uuid;

  -- Update user profile with calculated rating (or 0.0 if no ratings)
  UPDATE user_profiles
  SET rating = COALESCE(avg_rating, 0.0)
  WHERE id = target_user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger to update rating when rating is inserted/updated/deleted
CREATE OR REPLACE FUNCTION trigger_update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_user_rating(OLD.target_user_id);
    RETURN OLD;
  ELSE
    PERFORM update_user_rating(NEW.target_user_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_rating_update ON user_ratings;
CREATE TRIGGER trigger_user_rating_update
  AFTER INSERT OR UPDATE OR DELETE ON user_ratings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_rating();

-- 6. Add province and district columns to posts table (if not exists)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS district TEXT;

-- Create indexes for location filtering
CREATE INDEX IF NOT EXISTS idx_posts_province ON posts(province);
CREATE INDEX IF NOT EXISTS idx_posts_district ON posts(district);
CREATE INDEX IF NOT EXISTS idx_posts_province_district ON posts(province, district);

-- 7. Add phone column to user_profiles (for storing user's phone)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 8. Update posts table - remove phone requirement (phone will come from user_profiles)
-- Note: Keep phone column in posts for backward compatibility, but it's optional now
-- Posts will use user_id to get phone from user_profiles when needed

-- 9. Create storage bucket for CCCD (if not exists via Supabase Dashboard)
-- Run this in Supabase Dashboard > Storage > Create bucket named 'cccd'
-- Then set public read access and authenticated upload access

-- RLS Policies for CCCD storage (run after bucket is created)
-- Allow authenticated users to upload their own CCCD
-- CREATE POLICY "Users can upload their own CCCD"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     bucket_id = 'cccd' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );

-- Allow authenticated users to read their own CCCD
-- CREATE POLICY "Users can read their own CCCD"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (
--     bucket_id = 'cccd' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );

-- Allow admins to read all CCCD (for verification)
-- Note: This requires admin role or service role
-- CREATE POLICY "Admins can read all CCCD"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (
--     bucket_id = 'cccd' AND
--     EXISTS (
--       SELECT 1 FROM user_profiles
--       WHERE id::text = (storage.foldername(name))[1]
--       AND is_verified = true
--     )
--   );

