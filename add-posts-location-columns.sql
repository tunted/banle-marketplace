-- ============================================
-- Add province and district columns to posts table
-- ============================================
-- This script adds location columns to the posts table for filtering
-- Run this in Supabase SQL Editor if the columns don't exist yet

-- Add province and district columns (safe to run multiple times)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS district TEXT;

-- Create indexes for efficient location filtering
CREATE INDEX IF NOT EXISTS idx_posts_province ON posts(province);
CREATE INDEX IF NOT EXISTS idx_posts_district ON posts(district);
CREATE INDEX IF NOT EXISTS idx_posts_province_district ON posts(province, district);

-- Note: RLS (Row Level Security) policies are not affected by adding columns
-- Existing RLS policies will continue to work on all columns including these new ones
-- No need to update RLS policies unless you want to restrict access to location data

-- Verify columns were added (optional check)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'posts' 
-- AND column_name IN ('province', 'district');

