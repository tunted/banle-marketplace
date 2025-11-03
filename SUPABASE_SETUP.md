# Supabase Setup Guide for Chat Feature

This document outlines the required Supabase database tables and Row Level Security (RLS) policies needed for the chat feature to work properly.

## Required Tables

### 1. `conversations` Table

```sql
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
```

### 2. `messages` Table

```sql
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT messages_content_not_empty CHECK (char_length(content) > 0)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
```

### 3. `user_profiles` Table (should already exist)

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
```

## Required Row Level Security (RLS) Policies

### Enable RLS on all tables:

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

### `conversations` Table Policies:

```sql
-- Policy: Users can view conversations they are part of
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id
  );

-- Policy: Users can create conversations
CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = user1_id AND
    auth.uid() != user2_id
  );

-- Policy: Users can update their own conversations (for updated_at)
CREATE POLICY "Users can update their own conversations"
  ON conversations
  FOR UPDATE
  USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id
  );
```

### `messages` Table Policies:

```sql
-- Policy: Users can view messages in conversations they are part of
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- Policy: Users can send messages in conversations they are part of
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

-- Policy: Users can update their own messages (mark as read, etc.)
CREATE POLICY "Users can update messages in their conversations"
  ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );
```

### `user_profiles` Table Policies:

```sql
-- Policy: Anyone can view user profiles (for displaying seller info)
CREATE POLICY "Anyone can view user profiles"
  ON user_profiles
  FOR SELECT
  USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## Database Functions (Optional but Recommended)

### Function to update `updated_at` timestamp:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to conversations table
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to user_profiles table
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Verification Queries

After setting up, you can verify the setup:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages', 'user_profiles');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages', 'user_profiles');

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages', 'user_profiles');
```

## Common Issues and Solutions

### Issue 1: Chat button is disabled
**Solution**: 
- Check if `user_profiles` table has a policy allowing SELECT for all users
- Verify that `posts.user_id` is not null
- Check browser console for errors

### Issue 2: "Cannot create conversation" error
**Solution**:
- Verify `conversations` table has INSERT policy
- Check that both users exist in `auth.users`
- Verify unique constraint on (user1_id, user2_id) is working

### Issue 3: Messages not loading
**Solution**:
- Check `messages` table SELECT policy
- Verify `conversation_id` foreign key relationship
- Check that user is authenticated (`auth.uid()` is not null)

### Issue 4: "Permission denied" errors
**Solution**:
- Ensure RLS is enabled on all tables
- Verify user is authenticated before making requests
- Check that policies match the current user's `auth.uid()`

## Testing

To test the setup:

1. **Create a test conversation:**
```sql
-- As authenticated user, this should work if policies are correct
INSERT INTO conversations (user1_id, user2_id)
VALUES ('user1-uuid', 'user2-uuid');
```

2. **Send a test message:**
```sql
-- As authenticated user
INSERT INTO messages (conversation_id, sender_id, content)
VALUES ('conversation-uuid', 'user1-uuid', 'Test message');
```

3. **Check if messages are visible:**
```sql
-- Should only show messages from conversations the user is part of
SELECT * FROM messages WHERE conversation_id = 'conversation-uuid';
```

