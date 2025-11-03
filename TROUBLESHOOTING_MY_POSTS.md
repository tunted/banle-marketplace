# Troubleshooting: "Tin đã đăng" Not Showing Posts

## Common Issues and Solutions

### 1. RLS Policy Issue
**Problem**: Row Level Security policy might be blocking the query.

**Check**: Look for error in console like "permission denied" or "RLS policy violation"

**Solution**: Verify RLS policies in Supabase:
```sql
-- Check if policy exists
SELECT * FROM pg_policies WHERE tablename = 'posts';

-- Ensure this policy exists for SELECT:
CREATE POLICY "Users can view their own posts"
ON posts FOR SELECT
USING (auth.uid() = user_id);
```

### 2. User ID Mismatch
**Problem**: The user ID when posting might be different from the user ID when viewing.

**Check**: Compare console logs:
- When posting: `Creating post for user ID: [ID]`
- When viewing: `Loading posts for user ID: [ID]`
- These should be the SAME

**Solution**: Make sure you're logged in with the same account in both cases.

### 3. Posts Table Structure
**Problem**: `user_id` column might not exist or have wrong type.

**Check**: In Supabase SQL Editor:
```sql
-- Check column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' AND column_name = 'user_id';

-- Should return: user_id | uuid
```

### 4. Posts Actually Exist
**Problem**: Posts might not have been created successfully.

**Check**: In Supabase SQL Editor:
```sql
-- Check all posts
SELECT id, title, user_id, created_at 
FROM posts 
ORDER BY created_at DESC 
LIMIT 10;

-- Check your specific user's posts
SELECT id, title, user_id, created_at 
FROM posts 
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY created_at DESC;
```

### 5. Authentication State
**Problem**: Session might have expired or changed.

**Solution**: 
1. Log out completely
2. Log in again
3. Try viewing "Tin đã đăng" again

## Debug Steps

1. **Check Console Logs**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Navigate to "Tin đã đăng"
   - Look for:
     - `Loading posts for user ID: [ID]`
     - `Found X posts for user [ID]`
     - `Sample of all posts in database: [array]`

2. **Verify User ID**:
   - In console, run:
     ```javascript
     const { data } = await supabase.auth.getUser()
     console.log('Current user ID:', data.user?.id)
     ```

3. **Query Posts Directly**:
   - In console, run:
     ```javascript
     const { data: { user } } = await supabase.auth.getUser()
     const { data, error } = await supabase
       .from('posts')
       .select('*')
       .eq('user_id', user.id)
     console.log('Direct query result:', data, error)
     ```

4. **Check Database**:
   - Go to Supabase Dashboard → Table Editor → posts
   - Verify:
     - Posts exist in the table
     - `user_id` column has values
     - Your user's ID matches the `user_id` in posts

## Quick Fix Script

Run this in Supabase SQL Editor to check for issues:

```sql
-- 1. Check if user_id column exists and has correct type
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'posts' 
AND column_name = 'user_id';

-- 2. Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'posts';

-- 3. Count posts by user (replace with your user ID)
SELECT 
    user_id,
    COUNT(*) as post_count
FROM posts
GROUP BY user_id;

-- 4. Check recent posts
SELECT 
    id,
    title,
    user_id,
    created_at
FROM posts
ORDER BY created_at DESC
LIMIT 20;
```

