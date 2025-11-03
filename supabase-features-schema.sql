-- ============================================
-- BÁN LẸ - Features Schema & RLS Policies
-- ============================================

-- 1. Saved Posts Table
CREATE TABLE IF NOT EXISTS saved_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_posts (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_unique ON saved_posts (user_id, post_id);

-- 2. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT no_self_conversation CHECK (user1_id != user2_id)
);

-- Unique index for preventing duplicate conversations
-- Using LEAST/GREATEST to ensure order-independent uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_convo ON conversations (
  LEAST(user1_id, user2_id),
  GREATEST(user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS idx_convo_user1 ON conversations (user1_id);
CREATE INDEX IF NOT EXISTS idx_convo_user2 ON conversations (user2_id);

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_convo ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent ON messages (sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id);

-- 4. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'new_message')),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications (created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Ensure posts table has RLS enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Saved Posts Policies
-- ============================================
DROP POLICY IF EXISTS "Users can view their own saved posts" ON saved_posts;
CREATE POLICY "Users can view their own saved posts"
  ON saved_posts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own saved posts" ON saved_posts;
CREATE POLICY "Users can insert their own saved posts"
  ON saved_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved posts" ON saved_posts;
CREATE POLICY "Users can delete their own saved posts"
  ON saved_posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Conversations Policies
-- ============================================
DROP POLICY IF EXISTS "Users can view conversations they are part of" ON conversations;
CREATE POLICY "Users can view conversations they are part of"
  ON conversations FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================
-- Messages Policies
-- ============================================
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- ============================================
-- Notifications Policies
-- ============================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Allow inserts (typically from triggers/functions)

-- ============================================
-- Posts Policies (if not already set)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true); -- Public read access

DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
CREATE POLICY "Users can create their own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR AUTOMATIC NOTIFICATIONS
-- ============================================

-- Function to create notification when post is saved
CREATE OR REPLACE FUNCTION notify_post_saved()
RETURNS TRIGGER AS $$
BEGIN
  -- Get post owner
  INSERT INTO notifications (user_id, type, from_user_id, post_id)
  SELECT 
    p.user_id,
    'like',
    NEW.user_id,
    NEW.post_id
  FROM posts p
  WHERE p.id = NEW.post_id
  AND p.user_id != NEW.user_id; -- Don't notify if saving own post
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_post_saved ON saved_posts;
CREATE TRIGGER trigger_notify_post_saved
  AFTER INSERT ON saved_posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_saved();

-- Function to create notification when new message arrives
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  other_user_id UUID;
BEGIN
  -- Get the other user in the conversation
  SELECT CASE
    WHEN user1_id = NEW.sender_id THEN user2_id
    ELSE user1_id
  END INTO other_user_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Create notification for the recipient
  INSERT INTO notifications (user_id, type, from_user_id, created_at)
  VALUES (other_user_id, 'new_message', NEW.sender_id, NOW())
  ON CONFLICT DO NOTHING; -- Prevent duplicates
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

