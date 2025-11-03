# Bán Lẹ - Features Implementation Guide

This document provides an overview of the 4 main features implemented for the "Bán Lẹ" marketplace app.

## 📋 Table of Contents

1. [SQL Schema Setup](#sql-schema-setup)
2. [Features Overview](#features-overview)
3. [Component Structure](#component-structure)
4. [File Locations](#file-locations)
5. [Usage Guide](#usage-guide)

---

## 🔧 SQL Schema Setup

**File:** `supabase-features-schema.sql`

Run this SQL script in your Supabase SQL Editor to create all necessary tables and RLS policies:

```sql
-- Creates:
-- 1. saved_posts table
-- 2. conversations table (with unique constraint for user pairs)
-- 3. messages table
-- 4. notifications table
-- 5. All RLS policies
-- 6. Automatic notification triggers
```

### Key Features:
- **Row Level Security (RLS)** enabled on all tables
- **Automatic notifications** via triggers when:
  - Someone saves your post → creates 'like' notification
  - New message received → creates 'new_message' notification
- **Unique constraints** to prevent duplicate conversations

---

## ✨ Features Overview

### 1. 📄 Tin đã đăng (My Posts) - `/my-posts`

**File:** `src/app/my-posts/page.tsx`

- Fetches all posts where `user_id = auth.uid()`
- Displays in responsive grid (1 col mobile, 2 cols tablet, 4 cols desktop)
- Uses reusable `PostCard` component
- Includes edit and delete actions
- Clicking a post navigates to `/posts/[id]`

**Database Query:**
```typescript
supabase
  .from('posts')
  .select('id, title, price, location, images, image_url, created_at, status')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

---

### 2. ❤️ Tin đã lưu (Saved Posts) - `/saved-posts`

**File:** `src/app/saved-posts/page.tsx`

- Joins `saved_posts` with `posts` table
- Displays saved posts in responsive grid (4 cols desktop)
- Uses reusable `PostCard` component
- Includes "unsave" functionality (hover to reveal button)
- Empty state with link to browse posts

**Database Query:**
```typescript
supabase
  .from('saved_posts')
  .select(`
    id,
    post_id,
    created_at,
    posts (*)
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

**Save/Unsave Functionality:**
- Save button appears on post detail pages (`SavePostButton` component)
- Automatically creates 'like' notification for post owner

---

### 3. 💬 Trò chuyện (Chat) - `/messages`

**Files:**
- `src/app/messages/page.tsx` - Conversation list
- `src/app/messages/[id]/page.tsx` - Individual conversation view

**Features:**
- **Conversation List**: Shows all conversations with other user's name, avatar, and last message
- **Real-time updates**: Uses Supabase real-time subscriptions
- **Message Thread**: Chronological messages with sender avatars
- **Auto-scroll**: Automatically scrolls to bottom when new messages arrive
- **Chat Button**: On post detail pages, opens/create conversation with seller

**Key Functionality:**
1. **Create Conversation**: Automatically created when user clicks "Chat" button or uses quick chat suggestions
2. **Find Existing**: Checks for existing conversation before creating new one
3. **Real-time**: Subscribes to new message events for instant updates

**Database Schema:**
- `conversations` table with unique constraint on user pairs
- `messages` table with `conversation_id`, `sender_id`, `content`, `sent_at`

---

### 4. 🔔 Thông báo (Notifications) - `/notifications`

**File:** `src/app/notifications/page.tsx`

**Features:**
- Displays all notifications for current user
- Shows unread count badge on header icon (red badge)
- Two notification types:
  - `like`: When someone saves your post
  - `new_message`: When you receive a new message
- Click notification → marks as read and navigates to relevant page
- "Mark all as read" button
- Real-time updates when new notifications arrive

**Database Query:**
```typescript
supabase
  .from('notifications')
  .select(`
    id,
    type,
    from_user_id,
    post_id,
    is_read,
    created_at,
    from_user:user_profiles (*),
    post:posts (id, title)
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

**Navigation:**
- `like` notifications → `/posts/[post_id]`
- `new_message` notifications → `/messages?userId=[from_user_id]`

---

## 🧩 Component Structure

### Reusable Components

1. **PostCard** (`src/components/PostCard.tsx`)
   - Displays post with image, title, price, location, status
   - Handles both `images` array and `image_url` path formats
   - Uses `supabase.storage.from('posts').getPublicUrl()` for image paths
   - Supports optional actions (edit/delete)

2. **MessageBubble** (`src/components/MessageBubble.tsx`)
   - Individual message display
   - Shows sender avatar, name, message content, timestamp
   - Different styling for own messages vs received messages

3. **NotificationItem** (`src/components/NotificationItem.tsx`)
   - Displays single notification
   - Shows sender avatar, notification message, timestamp
   - Unread indicator (blue dot)
   - Handles click to mark as read and navigate

4. **SavePostButton** (`src/components/SavePostButton.tsx`)
   - Toggle save/unsave functionality
   - Shows saved state with filled heart icon
   - Handles authentication check

5. **HeaderIcons** (`src/components/HeaderIcons.tsx`)
   - Updated to show real notification count (unread)
   - Shows saved posts count badge
   - Real-time updates for both counts

---

## 📁 File Locations

### Pages
- `/my-posts` → `src/app/my-posts/page.tsx`
- `/saved-posts` → `src/app/saved-posts/page.tsx`
- `/messages` → `src/app/messages/page.tsx`
- `/messages/[id]` → `src/app/messages/[id]/page.tsx`
- `/notifications` → `src/app/notifications/page.tsx`

### Components
- `src/components/PostCard.tsx`
- `src/components/MessageBubble.tsx`
- `src/components/NotificationItem.tsx`
- `src/components/SavePostButton.tsx`
- `src/components/ContactSection.tsx` (updated with save button and functional chat)
- `src/components/QuickChatSuggestions.tsx` (updated to send actual messages)

### Database Schema
- `supabase-features-schema.sql` - Complete SQL setup

---

## 🚀 Usage Guide

### 1. Initial Setup

1. **Run SQL Script:**
   ```sql
   -- Copy and paste contents of supabase-features-schema.sql
   -- into Supabase SQL Editor and execute
   ```

2. **Verify RLS Policies:**
   - Check that all tables have RLS enabled
   - Verify policies allow appropriate access

3. **Test Features:**
   - Save a post → Check notifications
   - Send a message → Check notifications
   - Create conversation → Send messages → Verify real-time updates

### 2. Image Storage

**Important:** Store image paths (not full URLs) in database:
- Path format: `"path/to/image.jpg"` or `"filename.jpg"`
- Component automatically converts using `supabase.storage.from('posts').getPublicUrl(path)`
- Supports both legacy `images` array and new `image_url` field

### 3. Real-time Subscriptions

All features use Supabase real-time subscriptions:
- **Messages**: Updates when new messages arrive
- **Notifications**: Updates when new notifications are created
- **Header Badges**: Updates when counts change

---

## 🔒 Security Notes

1. **RLS Policies**: All tables have RLS enabled with proper policies
2. **User Scoping**: All queries filter by `auth.uid()` to ensure data isolation
3. **Validation**: Client-side validation with server-side enforcement
4. **Error Handling**: Comprehensive error handling for all operations

---

## 📱 Responsive Design

All pages are fully responsive:
- **Mobile**: 1 column layout
- **Tablet**: 2 columns
- **Desktop**: 3-4 columns (depending on feature)

---

## 🐛 Troubleshooting

### Notifications not appearing
- Check triggers are enabled in Supabase
- Verify RLS policies allow inserts
- Check browser console for errors

### Real-time not working
- Ensure Supabase real-time is enabled in project settings
- Check network tab for WebSocket connections
- Verify subscription cleanup in useEffect cleanup functions

### Images not loading
- Check image paths are correct (relative paths, not full URLs)
- Verify `posts` storage bucket exists and is public
- Check browser console for image errors

---

## ✅ Features Checklist

- [x] My Posts page with edit/delete
- [x] Saved Posts page with unsave
- [x] Chat list and conversation views
- [x] Real-time messaging
- [x] Notifications with unread badges
- [x] Save/unsave post functionality
- [x] Functional chat buttons
- [x] Quick chat suggestions that send messages
- [x] Header icons with real counts
- [x] All RLS policies configured
- [x] Automatic notification triggers
- [x] Responsive design
- [x] Error handling
- [x] Loading states
- [x] Empty states

---

## 📝 Next Steps (Optional Enhancements)

1. **Message Status**: Read receipts, delivery status
2. **Push Notifications**: Browser/device push notifications
3. **Image Optimization**: Automatic image compression on upload
4. **Search in Messages**: Search message history
5. **Notification Preferences**: User settings for notification types
6. **Group Conversations**: Support for multi-user chats

