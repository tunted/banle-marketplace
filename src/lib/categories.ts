/**
 * Category definitions for Bán Lẹ platform
 * 16 categories total: 2 rows × 8 columns
 */

export interface Category {
  id: string
  name: string
  icon: string
  slug: string
}

export const categories: Category[] = [
  { id: '1', name: 'Bất động sản', icon: '🏠', slug: 'bat-dong-san' },
  { id: '2', name: 'Xe cộ', icon: '🚗', slug: 'xe-co' },
  { id: '3', name: 'Điện thoại', icon: '📱', slug: 'dien-thoai' },
  { id: '4', name: 'Máy tính', icon: '💻', slug: 'may-tinh' },
  { id: '5', name: 'Đồ điện tử', icon: '📺', slug: 'do-dien-tu' },
  { id: '6', name: 'Đồ gia dụng', icon: '🏡', slug: 'do-gia-dung' },
  { id: '7', name: 'Thời trang', icon: '👕', slug: 'thoi-trang' },
  { id: '8', name: 'Đồ thể thao', icon: '⚽', slug: 'do-the-thao' },
  { id: '9', name: 'Sách vở', icon: '📚', slug: 'sach-vo' },
  { id: '10', name: 'Đồ chơi', icon: '🎮', slug: 'do-choi' },
  { id: '11', name: 'Thú cưng', icon: '🐾', slug: 'thu-cung' },
  { id: '12', name: 'Dịch vụ', icon: '🔧', slug: 'dich-vu' },
  { id: '13', name: 'Việc làm', icon: '💼', slug: 'viec-lam' },
  { id: '14', name: 'Du lịch', icon: '✈️', slug: 'du-lich' },
  { id: '15', name: 'Đồ ăn', icon: '🍔', slug: 'do-an' },
  { id: '16', name: 'Khác', icon: '📦', slug: 'khac' },
]

