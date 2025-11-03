-- ============================================
-- BÁN LẸ - Categories and Subcategories Schema
-- ============================================

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY, -- Using slug as primary key (e.g. "bat-dong-san")
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id TEXT PRIMARY KEY, -- Using slug as primary key (e.g. "mua-ban-nha-dat")
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);

-- 4. Enable RLS on both tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for categories
DROP POLICY IF EXISTS "Allow public read access on categories" ON categories;
CREATE POLICY "Allow public read access on categories"
  ON categories FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on categories" ON categories;
CREATE POLICY "Allow authenticated insert on categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on categories" ON categories;
CREATE POLICY "Allow authenticated update on categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true);

-- 6. RLS Policies for subcategories
DROP POLICY IF EXISTS "Allow public read access on subcategories" ON subcategories;
CREATE POLICY "Allow public read access on subcategories"
  ON subcategories FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on subcategories" ON subcategories;
CREATE POLICY "Allow authenticated insert on subcategories"
  ON subcategories FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on subcategories" ON subcategories;
CREATE POLICY "Allow authenticated update on subcategories"
  ON subcategories FOR UPDATE
  TO authenticated
  USING (true);

-- 7. Update posts table to add category_id and subcategory_id
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES categories(id),
ADD COLUMN IF NOT EXISTS subcategory_id TEXT REFERENCES subcategories(id);

-- 8. Create indexes for posts filtering
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_subcategory_id ON posts(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_subcategory ON posts(category_id, subcategory_id);

-- 9. Insert categories
INSERT INTO categories (id, name, image_url) VALUES
  ('bat-dong-san', 'Bất Động Sản', NULL),
  ('xe-co', 'Xe Cộ', NULL),
  ('dien-tu-cong-nghe', 'Đồ Điện Tử & Công Nghệ', NULL),
  ('gia-dung-noi-that', 'Đồ Gia Dụng & Nội Thất', NULL),
  ('thoi-trang-phu-kien', 'Thời Trang & Phụ Kiện', NULL),
  ('suc-khoe-lam-dep', 'Sức Khỏe & Làm Đẹp', NULL),
  ('me-be', 'Mẹ & Bé', NULL),
  ('thu-cung', 'Thú Cưng & Động Vật', NULL),
  ('viec-lam-dich-vu', 'Việc Làm & Dịch Vụ', NULL),
  ('khac', 'Khác', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 10. Insert subcategories for bat-dong-san
INSERT INTO subcategories (id, name, category_id) VALUES
  ('mua-ban-nha-dat', 'Mua bán nhà đất', 'bat-dong-san'),
  ('cho-thue-nha-dat', 'Cho thuê nhà đất', 'bat-dong-san'),
  ('can-ho-chung-cu', 'Căn hộ, chung cư', 'bat-dong-san'),
  ('nha-rieng', 'Nhà riêng', 'bat-dong-san'),
  ('dat-nen-du-an', 'Đất nền, dự án', 'bat-dong-san'),
  ('van-phong-mat-bang', 'Văn phòng, mặt bằng', 'bat-dong-san')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- 11. Insert subcategories for xe-co
INSERT INTO subcategories (id, name, category_id) VALUES
  ('xe-may', 'Xe máy', 'xe-co'),
  ('xe-o-to', 'Ô tô', 'xe-co'),
  ('xe-dap', 'Xe đạp', 'xe-co'),
  ('phu-tung-xe', 'Phụ tùng xe', 'xe-co'),
  ('xe-dien', 'Xe điện', 'xe-co'),
  ('xe-tai-xe-khach', 'Xe tải, xe khách', 'xe-co')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- 12. Insert subcategories for dien-tu-cong-nghe
INSERT INTO subcategories (id, name, category_id) VALUES
  ('dien-thoai', 'Điện thoại', 'dien-tu-cong-nghe'),
  ('may-tinh-laptop', 'Máy tính, Laptop', 'dien-tu-cong-nghe'),
  ('tablet', 'Tablet', 'dien-tu-cong-nghe'),
  ('may-anh-may-quay', 'Máy ảnh, máy quay', 'dien-tu-cong-nghe'),
  ('tivi-loa-am-thanh', 'TV, Loa, Âm thanh', 'dien-tu-cong-nghe'),
  ('phu-kien-dien-tu', 'Phụ kiện điện tử', 'dien-tu-cong-nghe')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- 13. Insert subcategories for gia-dung-noi-that
INSERT INTO subcategories (id, name, category_id) VALUES
  ('noi-that-phong-khach', 'Nội thất phòng khách', 'gia-dung-noi-that'),
  ('noi-that-phong-ngu', 'Nội thất phòng ngủ', 'gia-dung-noi-that'),
  ('do-gia-dung-bep', 'Đồ gia dụng bếp', 'gia-dung-noi-that'),
  ('may-lanh-quat', 'Máy lạnh, quạt', 'gia-dung-noi-that'),
  ('may-giat-may-say', 'Máy giặt, máy sấy', 'gia-dung-noi-that'),
  ('do-trang-tri', 'Đồ trang trí', 'gia-dung-noi-that')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- 14. Insert subcategories for thoi-trang-phu-kien
INSERT INTO subcategories (id, name, category_id) VALUES
  ('quan-ao-nam', 'Quần áo nam', 'thoi-trang-phu-kien'),
  ('quan-ao-nu', 'Quần áo nữ', 'thoi-trang-phu-kien'),
  ('quan-ao-tre-em', 'Quần áo trẻ em', 'thoi-trang-phu-kien'),
  ('giay-dep', 'Giày dép', 'thoi-trang-phu-kien'),
  ('tui-vi', 'Túi xách, ví', 'thoi-trang-phu-kien'),
  ('dong-ho-trang-suc', 'Đồng hồ, trang sức', 'thoi-trang-phu-kien')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- 15. Insert subcategories for suc-khoe-lam-dep
INSERT INTO subcategories (id, name, category_id) VALUES
  ('my-pham', 'Mỹ phẩm', 'suc-khoe-lam-dep'),
  ('cham-soc-da', 'Chăm sóc da', 'suc-khoe-lam-dep'),
  ('thuc-pham-chuc-nang', 'Thực phẩm chức năng', 'suc-khoe-lam-dep'),
  ('dung-cu-lam-dep', 'Dụng cụ làm đẹp', 'suc-khoe-lam-dep'),
  ('thiet-bi-y-te', 'Thiết bị y tế', 'suc-khoe-lam-dep'),
  ('dich-vu-spa', 'Dịch vụ spa, làm đẹp', 'suc-khoe-lam-dep')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- 16. Insert subcategories for me-be
INSERT INTO subcategories (id, name, category_id) VALUES
  ('quan-ao-be', 'Quần áo bé', 'me-be'),
  ('do-choi-tre-em', 'Đồ chơi trẻ em', 'me-be'),
  ('xe-day-xe-dap-tre-em', 'Xe đẩy, xe đạp trẻ em', 'me-be'),
  ('do-dung-cho-be', 'Đồ dùng cho bé', 'me-be'),
  ('sua-binh-sua', 'Sữa, bình sữa', 'me-be'),
  ('do-choi-giao-duc', 'Đồ chơi giáo dục', 'me-be')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- 17. Insert subcategories for thu-cung
INSERT INTO subcategories (id, name, category_id) VALUES
  ('cho', 'Chó', 'thu-cung'),
  ('meo', 'Mèo', 'thu-cung'),
  ('cho-canh', 'Chó cảnh', 'thu-cung'),
  ('thuc-an-cho-dong-vat', 'Thức ăn cho động vật', 'thu-cung'),
  ('do-choi-cho-dong-vat', 'Đồ chơi cho động vật', 'thu-cung'),
  ('dich-vu-thu-y', 'Dịch vụ thú y', 'thu-cung')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- 18. Insert subcategories for viec-lam-dich-vu
INSERT INTO subcategories (id, name, category_id) VALUES
  ('tuyen-dung', 'Tuyển dụng', 'viec-lam-dich-vu'),
  ('tim-viec', 'Tìm việc', 'viec-lam-dich-vu'),
  ('dich-vu-du-lich', 'Dịch vụ du lịch', 'viec-lam-dich-vu'),
  ('dich-vu-sua-chua', 'Dịch vụ sửa chữa', 'viec-lam-dich-vu'),
  ('dich-vu-giao-hang', 'Dịch vụ giao hàng', 'viec-lam-dich-vu'),
  ('dich-vu-khac', 'Dịch vụ khác', 'viec-lam-dich-vu')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- 19. Insert subcategories for khac
INSERT INTO subcategories (id, name, category_id) VALUES
  ('sach-bao-tap-chi', 'Sách, báo, tạp chí', 'khac'),
  ('do-the-thao', 'Đồ thể thao', 'khac'),
  ('do-co-vat', 'Đồ cổ, vật phẩm', 'khac'),
  ('khac', 'Khác', 'khac')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

