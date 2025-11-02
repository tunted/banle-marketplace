-- Create categories table for dynamic category carousel
-- This table stores category information with image URLs and sort order

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
ON categories
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert (for admin panel later)
CREATE POLICY "Allow authenticated insert"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update"
ON categories
FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete"
ON categories
FOR DELETE
TO authenticated
USING (true);

-- Insert sample categories (update image_urls with your actual image URLs)
INSERT INTO categories (name, image_url, slug, sort_order) VALUES
  ('Bất động sản', 'https://your-cdn.com/images/categories/bat-dong-san.jpg', 'bat-dong-san', 1),
  ('Xe cộ', 'https://your-cdn.com/images/categories/xe-co.jpg', 'xe-co', 2),
  ('Điện thoại', 'https://your-cdn.com/images/categories/dien-thoai.jpg', 'dien-thoai', 3),
  ('Máy tính', 'https://your-cdn.com/images/categories/may-tinh.jpg', 'may-tinh', 4),
  ('Đồ điện tử', 'https://your-cdn.com/images/categories/do-dien-tu.jpg', 'do-dien-tu', 5),
  ('Đồ gia dụng', 'https://your-cdn.com/images/categories/do-gia-dung.jpg', 'do-gia-dung', 6),
  ('Thời trang', 'https://your-cdn.com/images/categories/thoi-trang.jpg', 'thoi-trang', 7),
  ('Đồ thể thao', 'https://your-cdn.com/images/categories/do-the-thao.jpg', 'do-the-thao', 8),
  ('Sách vở', 'https://your-cdn.com/images/categories/sach-vo.jpg', 'sach-vo', 9),
  ('Đồ chơi', 'https://your-cdn.com/images/categories/do-choi.jpg', 'do-choi', 10),
  ('Thú cưng', 'https://your-cdn.com/images/categories/thu-cung.jpg', 'thu-cung', 11),
  ('Dịch vụ', 'https://your-cdn.com/images/categories/dich-vu.jpg', 'dich-vu', 12),
  ('Việc làm', 'https://your-cdn.com/images/categories/viec-lam.jpg', 'viec-lam', 13),
  ('Du lịch', 'https://your-cdn.com/images/categories/du-lich.jpg', 'du-lich', 14),
  ('Đồ ăn', 'https://your-cdn.com/images/categories/do-an.jpg', 'do-an', 15),
  ('Khác', 'https://your-cdn.com/images/categories/khac.jpg', 'khac', 16)
ON CONFLICT (slug) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

