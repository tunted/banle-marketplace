-- Enable Row Level Security on listings table
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read (SELECT) listings
CREATE POLICY "Allow anonymous read access on listings"
ON listings
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy to allow anyone to insert listings (anonymous posting)
CREATE POLICY "Allow anonymous insert access on listings"
ON listings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy to allow anyone to read public storage bucket
-- First, make sure the storage bucket exists and is public
-- Then run this for the storage policies (if needed):

-- Allow public read access to listings bucket
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listings');

-- Allow anonymous uploads to listings bucket
CREATE POLICY "Allow anonymous uploads"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'listings');

