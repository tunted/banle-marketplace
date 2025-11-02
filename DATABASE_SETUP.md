# Database Setup - Vietnamese Administrative Units

This guide explains how to import the Vietnamese provinces and wards dataset into your Supabase database.

## Source

The dataset is from: https://github.com/thanglequoc/vietnamese-provinces-database

## Step 1: Create Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Create provinces table
CREATE TABLE IF NOT EXISTS provinces (
  code VARCHAR(20) PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  full_name TEXT,
  full_name_en TEXT,
  code_name TEXT,
  administrative_unit_id INTEGER
);

-- Create wards table
CREATE TABLE IF NOT EXISTS wards (
  code VARCHAR(20) PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  full_name TEXT,
  full_name_en TEXT,
  code_name TEXT,
  province_code VARCHAR(20) REFERENCES provinces(code) ON DELETE CASCADE,
  administrative_unit_id INTEGER
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wards_province_code ON wards(province_code);
CREATE INDEX IF NOT EXISTS idx_provinces_name ON provinces(name);
CREATE INDEX IF NOT EXISTS idx_wards_name ON wards(name);
```

## Step 2: Import Data

### Option A: Using Supabase Dashboard

1. Go to **Table Editor** in Supabase
2. Select the `provinces` table
3. Click **Import data** and upload a CSV file
4. Repeat for `wards` table

### Option B: Using SQL (if you have the data)

1. Download the data from the GitHub repository
2. Convert to SQL INSERT statements or CSV format
3. Run the INSERT statements in SQL Editor

### Option C: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Import data
supabase db import your-data-file.sql
```

## Step 3: Update Listings Table

Add province_code and ward_code columns to your listings table:

```sql
-- Add location code columns to listings
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS province_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS ward_code VARCHAR(20);

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_listings_province_code ON listings(province_code);
CREATE INDEX IF NOT EXISTS idx_listings_ward_code ON listings(ward_code);
```

## Step 4: Enable RLS Policies (if needed)

```sql
-- Allow public read access to provinces
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on provinces"
ON provinces FOR SELECT TO anon, authenticated USING (true);

-- Allow public read access to wards
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on wards"
ON wards FOR SELECT TO anon, authenticated USING (true);
```

## Step 5: Verify Data

Check that data was imported correctly:

```sql
-- Count provinces
SELECT COUNT(*) FROM provinces;

-- Count wards
SELECT COUNT(*) FROM wards;

-- Check sample data
SELECT * FROM provinces LIMIT 5;
SELECT * FROM wards WHERE province_code = '79' LIMIT 5; -- Ho Chi Minh City
```

## Expected Results

- **Provinces**: ~63 provinces/cities
- **Wards**: ~11,000+ wards/districts/communes

## Migration Strategy

If you have existing listings without province_code/ward_code:

1. **Option 1**: Manually update through the UI (location modal)
2. **Option 2**: Write a migration script to parse location text and match to codes
3. **Option 3**: Leave null and let new listings populate the codes

## Notes

- The `code` field in provinces and wards should match the official Vietnamese administrative unit codes
- The `province_code` in wards references the `code` in provinces
- Both tables include English names (`name_en`, `full_name_en`) for international support

