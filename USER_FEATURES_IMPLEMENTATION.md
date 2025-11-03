# User Features Implementation Guide

## Overview
This document describes the implementation of authentication-based UI, user ratings, CCCD verification, and location filtering features for the "Bán Lẹ" classifieds app.

## Features Implemented

### 1. Conditional UI Based on Auth Status ✅
- **Header Icons**: Chat, Notifications, Liked Posts, My Posts, and Profile icon are now hidden when user is not logged in
- **"Đăng tin" Button**: Redirects to `/login` if user is not logged in
- **Implementation**: Updated `src/app/layout.tsx` and `src/components/HeaderIcons.tsx`

### 2. Posting Flow for Logged-in Users ✅
- **Removed Phone Field**: Phone number is now fetched from `user_profiles.phone`
- **User ID**: Posts are saved with `user_id = session.user.id`
- **Validation**: Users without phone in profile are redirected to profile settings
- **Implementation**: Updated `src/app/post/page.tsx`

### 3. Public Access Restrictions ✅
- **Phone Number**: Hidden for non-logged-in users, shows masked version
- **Actions Blocked**: 
  - Viewing full phone number
  - Liking/saving posts
  - Chatting
  - Commenting (if implemented)
- **Login Prompt**: Friendly modal shows "Vui lòng đăng nhập để liên hệ người bán"
- **Components Updated**:
  - `src/components/ContactSection.tsx`
  - `src/components/SavePostButton.tsx`
  - `src/components/MobileContactButton.tsx`
  - `src/components/LoginPrompt.tsx` (new)

### 4. User Rating System ✅
- **Database Schema**: 
  - `user_ratings` table with `reviewer_id`, `target_user_id`, `rating` (1.0-5.0, step 0.1)
  - `user_profiles.rating` stores average (rounded to 1 decimal)
  - Prevents self-rating
- **RPC Function**: `update_user_rating()` automatically calculates average
- **Trigger**: Updates `user_profiles.rating` on insert/update/delete
- **UI Component**: `src/components/UserRating.tsx`
  - Displays current rating with stars
  - Allows logged-in users to rate (except themselves)
  - Shows hover preview when rating
- **SQL**: `supabase-user-features-schema.sql`

### 5. CCCD Verification ✅
- **Database Schema**:
  - `user_profiles.cccd_front_url TEXT`
  - `user_profiles.cccd_back_url TEXT`
  - `user_profiles.is_verified BOOLEAN DEFAULT false`
- **Storage**: Supabase Storage bucket `cccd/{user_id}/front.jpg` and `back.jpg`
- **UI Component**: `src/components/CCCDUpload.tsx`
  - Upload front and back images
  - Image compression (max 5MB, auto-compress if >500KB)
  - Preview before upload
  - Status display (verified, pending)
- **Profile Page**: Integrated into `src/app/profile/page.tsx`
- **Admin Review**: Manual verification by admin (set `is_verified = true` in database)

### 6. Location Filter After Subcategory Selection ⚠️ (Partial)
- **Database Schema**: 
  - `posts.province TEXT`
  - `posts.district TEXT`
  - Indexes created for filtering
- **Post Creation**: Updated to save both `province_code`/`ward_code` and `province`/`district` text
- **Homepage Filters**: 
  - **TODO**: Add location dropdowns below search bar when subcategory is selected
  - Location data structure exists but UI filters need to be implemented in `src/app/page.tsx`

## SQL Schema Changes

Run `supabase-user-features-schema.sql` in Supabase SQL Editor:

1. Updates `user_profiles` table:
   - Adds `rating DECIMAL(3,1)`
   - Adds `cccd_front_url TEXT`
   - Adds `cccd_back_url TEXT`
   - Adds `is_verified BOOLEAN`
   - Adds `phone TEXT`

2. Creates `user_ratings` table with RLS policies

3. Creates `update_user_rating()` function and trigger

4. Adds `province` and `district` columns to `posts` table

5. Creates indexes for location filtering

## Storage Bucket Setup

### CCCD Storage Bucket
1. Go to Supabase Dashboard > Storage
2. Create new bucket named `cccd`
3. Set as **public** (for admin access) or configure RLS policies:
   ```sql
   -- Allow authenticated users to upload their own CCCD
   CREATE POLICY "Users can upload their own CCCD"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (
       bucket_id = 'cccd' AND
       (storage.foldername(name))[1] = auth.uid()::text
     );
   ```

## Components Created

1. **`src/components/LoginPrompt.tsx`**: Modal for login prompts
2. **`src/components/UserRating.tsx`**: Rating display and input component
3. **`src/components/CCCDUpload.tsx`**: CCCD upload component

## Files Modified

1. **`src/app/layout.tsx`**: Conditional header icons
2. **`src/app/post/page.tsx`**: Removed phone field, uses profile phone, saves province/district text
3. **`src/app/profile/page.tsx`**: Added rating display and CCCD upload
4. **`src/components/ContactSection.tsx`**: Auth checks, login prompts
5. **`src/components/SavePostButton.tsx`**: Auth checks, login prompts
6. **`src/components/MobileContactButton.tsx`**: Auth checks, login prompts

## Testing Checklist

- [x] Header icons hidden when logged out
- [x] "Đăng tin" redirects to login when logged out
- [x] Phone field removed from post creation
- [x] Posts use phone from user profile
- [x] Phone hidden for non-logged-in users
- [x] Save post button shows login prompt for non-logged-in users
- [x] Chat button shows login prompt for non-logged-in users
- [x] Rating system allows rating other users
- [x] Rating system prevents self-rating
- [x] Rating average updates automatically
- [x] CCCD upload saves to storage
- [x] CCCD upload updates user profile
- [ ] Location filters on homepage (TODO)

## Next Steps

1. **Location Filters on Homepage**:
   - Add province/district dropdowns in `src/app/page.tsx`
   - Show only when subcategory is selected
   - Filter posts by `province` and `district` in `fetchPosts()`
   - Update URL params to include location filters

2. **Admin Verification Dashboard** (Optional):
   - Create admin page to review CCCD uploads
   - Toggle `is_verified` status

3. **Rating Display in Post Details** (Optional):
   - Show seller rating in `ContactSection`
   - Link to seller profile with full rating history

