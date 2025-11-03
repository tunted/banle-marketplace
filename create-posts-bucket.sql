-- ============================================
-- Create "posts" Storage Bucket and Policies
-- ============================================
-- IMPORTANT: You must create the bucket manually in Supabase Dashboard first:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: "posts"
-- 4. Make it PUBLIC (check "Public bucket")
-- 5. Click "Create bucket"
-- 
-- Then run this SQL script to apply RLS policies
-- ============================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to posts bucket
DROP POLICY IF EXISTS "Allow public read access to posts" ON storage.objects;
CREATE POLICY "Allow public read access to posts"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'posts');

-- Allow authenticated users to upload to posts bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to posts" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to posts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posts');

-- Allow authenticated users to update their own uploads
DROP POLICY IF EXISTS "Allow authenticated updates to posts" ON storage.objects;
CREATE POLICY "Allow authenticated updates to posts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'posts')
WITH CHECK (bucket_id = 'posts');

-- Allow authenticated users to delete their own uploads
DROP POLICY IF EXISTS "Allow authenticated deletes to posts" ON storage.objects;
CREATE POLICY "Allow authenticated deletes to posts"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'posts');

