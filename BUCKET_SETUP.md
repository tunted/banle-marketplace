# Storage Bucket Setup Guide

## ⚠️ Error: "Hệ thống đang cập nhật. Vui lòng thử lại sau."

This error occurs when the `posts` storage bucket doesn't exist in Supabase.

## 🔧 Fix: Create the "posts" Bucket

### Step 1: Create Bucket in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** button
4. Fill in:
   - **Name**: `posts` (exactly this name, lowercase)
   - **Public bucket**: ✅ **Check this box** (important!)
   - **File size limit**: Leave default or set to 5MB
   - **Allowed MIME types**: Leave empty or set to `image/jpeg,image/png,image/webp`
5. Click **"Create bucket"**

### Step 2: Apply RLS Policies

After creating the bucket, run the SQL script:

1. Go to **SQL Editor** in Supabase Dashboard
2. Open the file `create-posts-bucket.sql`
3. Copy and paste the entire SQL script
4. Click **"Run"** to execute

This will create the necessary RLS policies to:
- Allow public read access
- Allow authenticated users to upload
- Allow authenticated users to update/delete their own files

### Step 3: Verify

After setup, try posting again. The error should be resolved.

## 📝 Alternative: If You Have an Old "listings" Bucket

If you previously had a `listings` bucket and want to rename it:

1. The bucket cannot be renamed directly in Supabase
2. Option 1: Create new `posts` bucket and migrate files
3. Option 2: Update code to use `listings` bucket (not recommended since we renamed everything to "posts")

## 🔍 Troubleshooting

### Still getting errors?

1. **Check bucket exists**: Go to Storage > Buckets, verify "posts" bucket exists
2. **Check bucket is public**: Bucket settings should show "Public bucket: Yes"
3. **Check RLS policies**: Go to Storage > Policies, verify policies for "posts" bucket exist
4. **Check browser console**: Look for specific error messages
5. **Check Supabase logs**: Go to Logs > API logs to see detailed error information

### Permission Errors?

If you see "Không có quyền tải ảnh lên":
- Verify RLS policies are correctly applied
- Check that user is authenticated
- Ensure bucket is set to public

