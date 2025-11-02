-- Create listings bucket (if not exists)
-- Note: This should be run in Supabase SQL Editor
-- The bucket must be created in Supabase Dashboard first (Storage > New bucket > name: "listings" > Public bucket)

-- If bucket already exists, these policies will be applied
-- If bucket doesn't exist, create it in Dashboard first, then run this SQL

-- Allow public read access to listings bucket
CREATE POLICY IF NOT EXISTS "Allow public read access to listings"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listings');

-- Allow authenticated users to upload to listings bucket
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads to listings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings');

-- Allow authenticated users to update their own uploads (optional)
CREATE POLICY IF NOT EXISTS "Allow authenticated updates to listings"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'listings')
WITH CHECK (bucket_id = 'listings');

-- Allow authenticated users to delete their own uploads (optional)
CREATE POLICY IF NOT EXISTS "Allow authenticated deletes to listings"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'listings');

