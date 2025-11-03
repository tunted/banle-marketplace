# Vercel Deployment Checklist for Chat Feature

## Required Environment Variables

Make sure these are set in **Vercel Dashboard → Settings → Environment Variables**:

1. ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
2. ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Supabase Setup Requirements

### 1. Run SQL Setup Script

Go to **Supabase Dashboard → SQL Editor** and run:
- `supabase-chat-setup.sql` (complete script)

### 2. Verify Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages', 'user_profiles');
```

Should return 3 rows.

### 3. Enable Real-time Replication

**Option A: Via Dashboard**
1. Go to **Database → Replication**
2. Enable replication for:
   - ✅ `conversations` table
   - ✅ `messages` table

**Option B: Via SQL**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### 4. Verify RLS Policies

```sql
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages', 'user_profiles')
ORDER BY tablename, cmd;
```

Should show policies for:
- `conversations`: SELECT, INSERT, UPDATE
- `messages`: SELECT, INSERT, UPDATE
- `user_profiles`: SELECT, INSERT, UPDATE

## Common Vercel Deployment Issues

### Issue 1: "Messages disappear after reload"

**Symptoms:**
- Messages show when sent
- Messages disappear after page refresh

**Causes:**
1. ❌ Messages not being saved (RLS policy blocking INSERT)
2. ❌ Messages query failing (RLS policy blocking SELECT)
3. ❌ Foreign key relationship issue

**Solutions:**
1. Check RLS policies allow INSERT on messages:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'messages' AND cmd = 'INSERT';
   ```
2. Check RLS policies allow SELECT on messages:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'messages' AND cmd = 'SELECT';
   ```
3. Verify user is authenticated: Check browser console for auth errors
4. Test direct insert in Supabase SQL Editor (while logged in):
   ```sql
   INSERT INTO messages (conversation_id, sender_id, content)
   VALUES ('your-conversation-id', 'your-user-id', 'Test message');
   ```

### Issue 2: "Conversation function doesn't work on Vercel"

**Symptoms:**
- Works locally but not on Vercel
- Chat button doesn't work
- Can't create conversations

**Causes:**
1. ❌ Environment variables not set in Vercel
2. ❌ RLS policies too restrictive
3. ❌ Missing Supabase setup

**Solutions:**
1. **Check Environment Variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - Make sure they're set for **Production** environment
   - Redeploy after adding variables

2. **Verify RLS Policies:**
   - Run verification queries above
   - Make sure policies allow INSERT for authenticated users

3. **Check Browser Console:**
   - Open deployed site
   - Open DevTools (F12) → Console
   - Look for Supabase errors
   - Common errors:
     - `"new row violates row-level security policy"` → RLS blocking
     - `"JWT expired"` → Auth issue
     - `"relation does not exist"` → Tables not created

### Issue 3: "Real-time not working"

**Symptoms:**
- Messages don't appear instantly
- Need to refresh to see new messages

**Solutions:**
1. Enable replication (see step 3 above)
2. Check Supabase Dashboard → Database → Replication
3. Verify tables show as "Enabled"

### Issue 4: "Permission denied errors"

**Symptoms:**
- `"permission denied for table messages"`
- `"new row violates row-level security policy"`

**Solutions:**
1. Make sure user is authenticated:
   ```javascript
   const { data: { user } } = await supabase.auth.getUser()
   console.log('User:', user?.id)
   ```

2. Check RLS policies match user's auth.uid():
   ```sql
   -- Test if user can see conversations
   SELECT * FROM conversations 
   WHERE user1_id = auth.uid() OR user2_id = auth.uid();
   ```

3. Verify policies use `auth.uid()` correctly:
   ```sql
   SELECT qual FROM pg_policies 
   WHERE tablename = 'messages' AND policyname = 'Users can send messages in their conversations';
   ```

## Testing Deployment

### 1. Test Message Creation
```bash
# In browser console on deployed site
const { data, error } = await supabase
  .from('messages')
  .insert({ conversation_id: 'test-id', sender_id: 'user-id', content: 'test' })
  .select()
  
console.log('Result:', data, error)
```

### 2. Test Message Loading
```bash
# In browser console
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', 'test-id')
  
console.log('Messages:', data, error)
```

### 3. Check Environment Variables
```bash
# In browser console
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20))
```

## Quick Fix SQL

If messages aren't saving, run this to check and fix RLS:

```sql
-- Check if INSERT policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'messages' AND cmd = 'INSERT';

-- If missing, create it:
CREATE POLICY "Users can send messages in their conversations"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );
```

## Debugging Steps

1. ✅ Check Vercel build logs for errors
2. ✅ Check browser console for JavaScript errors
3. ✅ Check Network tab for failed API calls
4. ✅ Verify Supabase logs (Dashboard → Logs)
5. ✅ Test with Supabase SQL Editor directly
6. ✅ Compare local vs production behavior

## Need Help?

If issues persist:
1. Check browser console errors
2. Check Vercel function logs
3. Check Supabase logs
4. Compare RLS policies with setup script
5. Verify environment variables are set correctly

