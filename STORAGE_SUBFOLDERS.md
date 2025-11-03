# Storage Subfolders Implementation

## 📁 Changes Made

The codebase has been updated to store images in subfolders within storage buckets:

### Post Images
- **Bucket**: `posts`
- **Subfolder**: `images/`
- **Path Format**: `images/${timestamp}-${index}-${filename}`
- **Database Storage**: Path stored as `images/filename.jpg` (not full URL)

### Avatar Images
- **Bucket**: `avatars`
- **Subfolder**: `avatars/`
- **Path Format**: `avatars/${userId}_${timestamp}.${ext}`
- **Database Storage**: Path stored as `avatars/filename.jpg` (not full URL)

## 🔧 Code Changes

### Upload Changes

1. **Post Upload** (`src/app/post/page.tsx`):
   - Changed upload path from `fileName` to `images/${fileName}`
   - Stores path in database: `imageUrls.push(data.path)` instead of full URL

2. **Avatar Upload** (`src/app/profile/page.tsx`):
   - Changed upload path from `fileName` to `avatars/${fileName}`
   - Stores path in database: `avatar_url: avatarPath` instead of full URL
   - Updated old avatar deletion to handle subfolder paths

### Display Changes

3. **Utility Functions** (`src/lib/utils.ts`):
   - Added `getPostImageUrl(path)`: Converts post image paths to public URLs
   - Added `getAvatarUrl(path)`: Converts avatar paths to public URLs
   - Both functions handle:
     - Full URLs (returns as-is)
     - Relative paths starting with `/` (returns as-is)
     - Storage paths (converts using `supabase.storage.getPublicUrl()`)

4. **Components Updated**:
   - `PostCard.tsx`: Uses `getPostImageUrl()` utility
   - `UserMenu.tsx`: Uses `getAvatarUrl()` utility
   - `ContactSection.tsx`: Uses `getAvatarUrl()` utility
   - `MessageBubble.tsx`: Uses `getAvatarUrl()` utility
   - `NotificationItem.tsx`: Uses `getAvatarUrl()` utility
   - `src/app/messages/page.tsx`: Uses `getAvatarUrl()` utility
   - `src/app/messages/[id]/page.tsx`: Uses `getAvatarUrl()` utility

## 📊 Benefits

1. **Better Organization**: Images are organized in subfolders for easier management
2. **Smaller Database**: Storing paths instead of full URLs saves space
3. **Flexibility**: Easy to migrate or change storage providers
4. **Backward Compatible**: Utility functions handle both paths and full URLs

## 🔄 Migration Notes

- **Existing Data**: Old full URLs in database will still work (utility functions handle them)
- **New Uploads**: All new uploads will use subfolder paths
- **No Migration Required**: The code handles both formats automatically

## 📝 Example Paths

### Post Images
- Database: `images/1699123456789-0-image.jpg`
- Public URL: `https://[project].supabase.co/storage/v1/object/public/posts/images/1699123456789-0-image.jpg`

### Avatar Images
- Database: `avatars/user-id-123_1699123456789.jpg`
- Public URL: `https://[project].supabase.co/storage/v1/object/public/avatars/avatars/user-id-123_1699123456789.jpg`

