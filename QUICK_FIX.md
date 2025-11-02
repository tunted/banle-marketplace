# Quick Fix: Location Dropdown Not Working

## Problem
The location dropdown shows no options when clicked.

## Solution

The `provinces` and `wards` tables don't exist in your Supabase database yet.

### Step 1: Create Tables

Run this SQL in Supabase SQL Editor:

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

-- Enable RLS
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on provinces"
ON provinces FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on wards"
ON wards FOR SELECT TO anon, authenticated USING (true);
```

### Step 2: Test with Sample Data (Optional)

To test immediately, add a few sample provinces:

```sql
INSERT INTO provinces (code, name, full_name, administrative_unit_id) VALUES
('79', 'Thành phố Hồ Chí Minh', 'Thành phố Hồ Chí Minh', 1),
('01', 'Thành phố Hà Nội', 'Thành phố Hà Nội', 1),
('48', 'Thành phố Đà Nẵng', 'Thành phố Đà Nẵng', 1);

INSERT INTO wards (code, name, full_name, province_code, administrative_unit_id) VALUES
('760', 'Quận Gò Vấp', 'Quận Gò Vấp', '79', 2),
('761', 'Quận 1', 'Quận 1', '79', 2),
('762', 'Quận 2', 'Quận 2', '79', 2),
('763', 'Quận 3', 'Quận 3', '79', 2);
```

### Step 3: Import Full Dataset

For production, import the full dataset from:
https://github.com/thanglequoc/vietnamese-provinces-database

See `DATABASE_SETUP.md` for detailed instructions.

## After Setup

1. Refresh the page
2. Click the location button again
3. You should now see provinces in the dropdown!

