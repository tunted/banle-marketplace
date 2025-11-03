-- Fix RLS policy for UPDATE to ensure it works correctly
-- The policy needs to allow UPDATE when user owns the post

-- Drop existing policy
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;

-- Create updated policy with both USING and WITH CHECK
-- USING: determines which rows can be updated (existing rows matching condition)
-- WITH CHECK: validates the updated values (can use same condition for our case)
CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'posts' AND policyname = 'Users can update their own posts';

