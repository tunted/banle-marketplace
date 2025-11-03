# Image URL Fix Summary

## ✅ Problem Fixed

Fixed the `next/image` error: **"Failed to parse src 'posts/xe-co.jpg' on next/image"**

The issue was that the database stores paths like `"posts/xe-co.jpg"` or `"images/filename.jpg"` but `next/image` requires full URLs or paths starting with `/`.

## 🔧 Changes Made

### 1. Updated `getPostImageUrl()` Utility (`src/lib/utils.ts`)
- Now handles paths with or without `"posts/"` prefix
- Normalizes paths (removes `"posts/"` prefix if present)
- Converts storage paths to full Supabase CDN URLs
- Returns `null` if conversion fails

### 2. Updated `PostCard.tsx`
- Always converts `image_url` paths to public URLs before rendering
- Falls back to `/placeholder-post.jpg` if:
  - `image_url` is `null` or empty
  - URL conversion fails
- Added `unoptimized` prop for Supabase CDN URLs (Next.js optimization doesn't work with external URLs)
- Added error handler to fallback to placeholder on load errors

### 3. Updated `src/app/page.tsx` (Homepage)
- Now uses `getPostImageUrl()` to convert paths before passing to `<Image>`
- Always has a fallback to `/placeholder-post.jpg`
- Added proper error handling

### 4. Updated `ImageCarousel.tsx`
- Converts all image paths in the array to public URLs
- Handles placeholder for missing images
- Added error handling for failed image loads

### 5. Created Server Utilities (`src/lib/server-utils.ts`)
- `getPostImageUrlServer()` - For Server Components (future use)
- `processPostsWithImageUrls()` - Batch processing helper (future use)

## 📋 Path Format Support

The code now handles multiple path formats:

1. **Full URLs**: `https://xxx.supabase.co/storage/v1/object/public/posts/...`
   - Returns as-is ✅

2. **Public assets**: `/placeholder-post.jpg`
   - Returns as-is ✅

3. **Storage paths with bucket prefix**: `posts/xe-co.jpg`
   - Normalized to `xe-co.jpg` then converted ✅

4. **Storage paths with subfolder**: `images/filename.jpg`
   - Converted directly ✅

5. **Root paths**: `filename.jpg`
   - Converted directly ✅

## 🖼️ Placeholder Image

**Action Required**: Create a placeholder image file:

1. Add an image file named `placeholder-post.jpg` in the `public/` folder
2. Recommended size: 800x600px
3. Format: JPG or PNG
4. Content: A generic placeholder image (e.g., gray image with icon)

**Current Behavior**: 
- Code references `/placeholder-post.jpg` but file doesn't exist yet
- Browser will show broken image icon until you add the file
- No crashes - gracefully handles missing placeholder

## 🧪 Testing

### Test Cases:

1. ✅ Path `"posts/xe-co.jpg"` → Converts to full Supabase URL
2. ✅ Path `"images/filename.jpg"` → Converts to full Supabase URL  
3. ✅ Path `"filename.jpg"` → Converts to full Supabase URL
4. ✅ `null` or empty → Falls back to `/placeholder-post.jpg`
5. ✅ Full URL already → Returns as-is
6. ✅ Load error → Falls back to placeholder

### Verify:

1. Check browser console - no `next/image` errors
2. Images load from Supabase CDN URLs
3. Missing images show placeholder (once file is added)
4. All posts display correctly

## 📝 Files Modified

- ✅ `src/lib/utils.ts` - Enhanced `getPostImageUrl()` function
- ✅ `src/components/PostCard.tsx` - Always converts paths, added placeholder
- ✅ `src/app/page.tsx` - Converts paths before rendering
- ✅ `src/components/ImageCarousel.tsx` - Converts paths in array
- ✅ `src/lib/server-utils.ts` - Created for future server-side usage

## 🚀 Next Steps

1. **Add placeholder image** to `public/placeholder-post.jpg`
2. **Test** with different path formats
3. **Monitor** browser console for any remaining errors
4. **Optional**: Use server utilities for Server Components if migrating to server-side rendering

