-- Create products table in Supabase
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON products
  FOR SELECT
  USING (true);

-- Optional: Create policy for authenticated users to insert/update/delete
-- Uncomment if you want to allow authenticated users to manage products
-- CREATE POLICY "Allow authenticated users to manage products" ON products
--   FOR ALL
--   USING (auth.role() = 'authenticated');

-- Insert sample products (optional)
INSERT INTO products (name, price, image, description) VALUES
  ('Premium Headphones', 199.99, 'https://via.placeholder.com/300x300?text=Headphones', 'High-quality wireless headphones with noise cancellation'),
  ('Wireless Mouse', 49.99, 'https://via.placeholder.com/300x300?text=Mouse', 'Ergonomic wireless mouse with precision tracking'),
  ('Mechanical Keyboard', 149.99, 'https://via.placeholder.com/300x300?text=Keyboard', 'RGB mechanical keyboard with cherry switches'),
  ('USB-C Hub', 79.99, 'https://via.placeholder.com/300x300?text=USB+Hub', 'Multi-port USB-C hub with HDMI and SD card reader');

