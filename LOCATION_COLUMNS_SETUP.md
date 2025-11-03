# Location Columns Setup Guide

## Problem
The `posts` table is missing `province` and `district` columns, causing errors when fetching posts with location filtering.

## Solution

### Step 1: Run SQL Migration

Run the SQL script `add-posts-location-columns.sql` in your Supabase SQL Editor:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `add-posts-location-columns.sql`
4. Click **Run** (or press Ctrl/Cmd + Enter)

This will:
- Add `province TEXT` column to `posts` table
- Add `district TEXT` column to `posts` table
- Create indexes for efficient filtering
- **Keep all existing data intact** (using `ADD COLUMN IF NOT EXISTS`)

### Step 2: Verify Columns Were Added

Optional verification query:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('province', 'district');
```

You should see both columns listed.

### Step 3: Frontend Behavior

**Before running SQL:**
- The app will detect the missing columns error
- Automatically fall back to fetching posts without location columns
- Display a console warning message
- Location filters will not work, but the app won't crash

**After running SQL:**
- Location filters will work correctly
- Posts will be filtered by province and district
- No errors or warnings

### Step 4: Post Creation

The post creation form (`app/post/page.tsx`) **already saves** to `province` and `district` columns:
- When a user selects a province, it saves the province **name** (not code) to `posts.province`
- When a user selects a district/ward, it saves the district **name** (not code) to `posts.district`
- This happens in the `postData` object at lines 394-395

### Step 5: RLS (Row Level Security)

**Important:** Adding columns does **NOT** affect existing RLS policies.

- All existing RLS policies continue to work
- The new `province` and `district` columns are subject to the same RLS rules as other columns
- No need to update RLS policies unless you want to restrict access to location data

However, if you want to ensure location data follows the same access rules:
- **SELECT**: Same as other columns (already covered by existing policies)
- **INSERT**: Same as other columns (already covered by existing policies)
- **UPDATE**: Same as other columns (already covered by existing policies)

## Files Modified

1. **`add-posts-location-columns.sql`** - SQL migration script
2. **`src/app/page.tsx`** - Added graceful error handling for missing columns

## Testing

1. **Before migration**: App should work but location filters won't apply
2. **After migration**: Location filters should work correctly
3. **Create a new post**: Verify that `province` and `district` are saved correctly

## Notes

- The migration uses `IF NOT EXISTS` so it's safe to run multiple times
- Existing posts will have `NULL` values for `province` and `district` until they're updated
- New posts created after the migration will have proper location data
- Indexes are created for efficient filtering by location

