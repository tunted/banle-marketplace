# Chat Feature Setup Guide

## Quick Start

1. **Open Supabase Dashboard** → Go to SQL Editor
2. **Copy and paste** the entire contents of `supabase-chat-setup.sql`
3. **Click "Run"** to execute all SQL commands
4. **Verify setup** (see verification section below)

## What Gets Created

### Tables:
- ✅ `conversations` - Stores chat conversations between users
- ✅ `messages` - Stores individual messages in conversations
- ✅ `user_profiles` - Stores user profile information (if not exists)

### Security (RLS):
- ✅ Row Level Security enabled on all tables
- ✅ Policies allow users to view/create their own conversations
- ✅ Policies allow users to send/receive messages in their conversations
- ✅ Public read access to user profiles (for displaying seller info)

### Features:
- ✅ Real-time subscriptions enabled for instant message updates
- ✅ Auto-updating timestamps (`updated_at`)
- ✅ Indexes for fast queries

## Verification

After running the SQL, verify everything is set up correctly:

### 1. Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages', 'user_profiles');
```
Should return 3 rows.

### 2. Check RLS is Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages', 'user_profiles');
```
All should show `rowsecurity = true`.

### 3. Check Policies
```sql
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages', 'user_profiles')
ORDER BY tablename, cmd;
```
Should show policies for SELECT, INSERT, UPDATE on all three tables.

### 4. Check Real-time is Enabled
Go to **Supabase Dashboard** → **Database** → **Replication**
- Make sure `conversations` and `messages` tables show as "Enabled" for replication

## Enable Real-time (If Not Automatic)

If real-time doesn't work automatically:

1. Go to **Supabase Dashboard** → **Database** → **Replication**
2. Find `conversations` table
3. Toggle **Enable** if it's off
4. Find `messages` table
5. Toggle **Enable** if it's off

Or run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

## Common Issues

### Issue 1: "Permission denied" when creating conversation
**Solution:** Make sure RLS policies are created. Re-run the SQL setup script.

### Issue 2: Messages not appearing in real-time
**Solution:** 
1. Check Realtime is enabled (see above)
2. Verify policies allow SELECT on messages
3. Make sure user is authenticated (`auth.uid()` must not be null)

### Issue 3: Can't see other user's profile
**Solution:** Verify the "Anyone can view user profiles" policy exists:
```sql
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

### Issue 4: Error "relation does not exist"
**Solution:** The tables weren't created. Re-run the SQL setup script.

### Issue 5: Chat button still disabled
**Solution:** 
1. Check if `user_profiles` table exists
2. Verify RLS allows public SELECT on `user_profiles`
3. Check browser console for errors
4. Make sure the post has a `user_id` set

## Testing the Chat Feature

### Test 1: Create a Conversation
1. Login as User A
2. Go to a post created by User B
3. Click the "Chat" button
4. Should create a new conversation and navigate to chat page

### Test 2: Send a Message
1. Type a message in the chat input
2. Press Enter or click Send
3. Message should appear immediately (optimistic update)
4. Should sync with server

### Test 3: Real-time Updates
1. Open chat as User A in Browser 1
2. Open chat as User B in Browser 2 (different account)
3. Send message from Browser 2
4. Message should appear in Browser 1 without refresh

### Test 4: Conversations List
1. Go to `/messages` page
2. Should show list of all conversations
3. Most recent conversation should be at top
4. Should show last message preview

## Database Schema Reference

### conversations table
```sql
- id: UUID (primary key)
- user1_id: UUID (foreign key to auth.users)
- user2_id: UUID (foreign key to auth.users)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### messages table
```sql
- id: UUID (primary key)
- conversation_id: UUID (foreign key to conversations)
- sender_id: UUID (foreign key to auth.users)
- content: TEXT (not null)
- sent_at: TIMESTAMP
- read_at: TIMESTAMP (nullable)
```

### user_profiles table
```sql
- id: UUID (primary key, foreign key to auth.users)
- full_name: TEXT (nullable)
- avatar_url: TEXT (nullable)
- phone: TEXT (nullable)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Next Steps

After setup is complete:
1. ✅ Test creating a conversation
2. ✅ Test sending messages
3. ✅ Test real-time updates
4. ✅ Verify chat button works on post pages

If you encounter any issues, check:
- Browser console for errors
- Supabase logs in Dashboard
- Network tab for failed API calls
- RLS policies are correctly set up

