import Link from "next/link";

// Extended mock data with full listing details
const listingData: Record<number, {
  id: number;
  title: string;
  price: number;
  location: string;
  phone: string;
  description: string;
}> = {
  1: {
    id: 1,
    title: "iPhone 15 Pro Max 256GB - Hàng chính hãng",
    price: 28900000,
    location: "Quận 1, TP.HCM",
    phone: "0901234567",
    description: `iPhone 15 Pro Max 256GB màu Titan tự nhiên, hàng chính hãng Apple Việt Nam. 
    
Máy mới 100%, chưa sử dụng, còn nguyên seal, full box phụ kiện. Bảo hành chính hãng 12 tháng tại Apple Store.

Thông số kỹ thuật:
- Màn hình: 6.7 inch Super Retina XDR OLED
- Chip: Apple A17 Pro
- RAM: 8GB
- Bộ nhớ: 256GB
- Camera: Camera chính 48MP, Tele 12MP, Ultra Wide 12MP
- Pin: Dùng cả ngày
- Hệ điều hành: iOS 17

Máy rất đẹp, còn nguyên tem, đầy đủ phụ kiện. Giá đã thấp nhất, không mặc cả. Liên hệ qua điện thoại để xem máy.`,
  },
  2: {
    id: 2,
    title: "Xe máy Honda Wave RSX 2023 - Còn mới 99%",
    price: 18500000,
    location: "Quận 7, TP.HCM",
    phone: "0912345678",
    description: `Xe máy Honda Wave RSX 2023, xe nhà sử dụng, đi kỹ lưỡng, rất cẩn thận.
    
Xe chạy được 3,500km, còn mới 99%, không có va chạm hay sửa chữa gì. Máy móc chạy êm, không tiếng kêu lạ.

Đặc điểm:
- Biển số: TP.HCM
- Màu: Đỏ đậm
- Động cơ: 110cc, tiết kiệm nhiên liệu
- Đầy đủ giấy tờ, sổ bảo hành
- Bảo hiểm còn hạn

Xe được bảo dưỡng định kỳ tại đại lý Honda. Giá đã bao gồm phí sang tên. Liên hệ xem xe tại nhà.`,
  },
  3: {
    id: 3,
    title: "Laptop Dell XPS 15 - Core i7, 16GB RAM",
    price: 32500000,
    location: "Quận 2, TP.HCM",
    phone: "0923456789",
    description: `Laptop Dell XPS 15 cao cấp, máy tính đồ họa chuyên nghiệp.
    
Laptop đã qua sử dụng nhưng còn rất mới, không có vết xước, màn hình đẹp như mới.

Cấu hình:
- CPU: Intel Core i7-11800H (8 cores, 16 threads)
- RAM: 16GB DDR4 3200MHz
- Ổ cứng: SSD 512GB NVMe
- Màn hình: 15.6 inch Full HD IPS, 60Hz
- Card đồ họa: NVIDIA GeForce RTX 3050 Ti 4GB
- Pin: 86Wh, sạc nhanh
- Hệ điều hành: Windows 11 Pro (bản quyền)

Máy phù hợp cho đồ họa, lập trình, gaming nhẹ. Đầy đủ phụ kiện gốc, adapter, sạc.`,
  },
  4: {
    id: 4,
    title: "Bàn ghế gỗ tự nhiên - Bộ 6 món đẹp",
    price: 8500000,
    location: "Quận 3, TP.HCM",
    phone: "0934567890",
    description: `Bộ bàn ghế gỗ tự nhiên 6 món, thiết kế hiện đại, sang trọng.
    
Bộ bàn ghế gỗ cao su tự nhiên, chắc chắn, bền đẹp. Phù hợp cho phòng khách hoặc phòng ăn.

Bao gồm:
- 1 bàn gỗ: 1.2m x 0.6m
- 4 ghế ăn
- 1 ghế bành (tùy chọn)

Gỗ được xử lý chống mối mọt, sơn bóng đẹp. Đã sử dụng 2 năm nhưng còn rất mới. Không bị nứt, mối mọt hay hư hỏng.

Giá đã bao gồm vận chuyển trong nội thành. Liên hệ để xem hàng và thương lượng.`,
  },
  5: {
    id: 5,
    title: "Tủ lạnh Samsung Inverter 550L - Mới 100%",
    price: 14900000,
    location: "Quận 10, TP.HCM",
    phone: "0945678901",
    description: `Tủ lạnh Samsung Inverter 550L, hàng mới 100%, chưa sử dụng.
    
Tủ lạnh được mua nhưng không cần dùng đến, còn nguyên seal, chưa bóc tem.

Thông tin sản phẩm:
- Dung tích: 550 lít
- Công nghệ: Inverter tiết kiệm điện
- Ngăn đông: Công nghệ No Frost, không đóng tuyết
- Ngăn mát: Đa luồng gió làm lạnh đều
- Màu: Bạc sang trọng
- Bảo hành: 12 tháng chính hãng Samsung

Giá rẻ hơn thị trường 2-3 triệu. Máy còn nguyên seal, chưa cắm điện. Liên hệ xem máy tại nhà.`,
  },
  6: {
    id: 6,
    title: "Xe đạp thể thao Giant - Đã sử dụng tốt",
    price: 3200000,
    location: "Quận Bình Thạnh, TP.HCM",
    phone: "0956789012",
    description: `Xe đạp thể thao Giant, đã qua sử dụng nhưng còn rất tốt.
    
Xe đạp thể thao Giant, size 26 inch, phù hợp cho người cao 1.65m - 1.80m. Xe chạy êm, không có tiếng kêu.

Thông số:
- Khung: Nhôm nhẹ, chắc chắn
- Phanh: Phanh đĩa cơ
- Tốc độ: 21 tốc độ, chuyển số mượt
- Lốp: 26x1.95, còn tốt
- Yên: Yên thể thao, có thể điều chỉnh

Xe được bảo dưỡng thường xuyên. Phù hợp cho đi làm, tập thể dục, hoặc đi dạo. Giá rẻ, không mặc cả.`,
  },
};

// Format price with Vietnamese currency
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("vi-VN").format(price) + " đ";
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params;
  const listingId = parseInt(id, 10);
  const listing = listingData[listingId];

  if (!listing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy tin đăng
          </h1>
          <Link
            href="/"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="font-medium">Quay lại trang chủ</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Area */}
          <div className="w-full">
            <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-32 h-32 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="w-full">
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600 mb-4 sm:mb-6">
              {listing.title}
            </h1>

            {/* Price */}
            <div className="mb-6 sm:mb-8">
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-red-600">
                {formatPrice(listing.price)}
              </p>
            </div>

            {/* Location Tag */}
            <div className="mb-6 sm:mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full">
                <svg
                  className="w-5 h-5 mr-2 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-gray-700 font-medium">
                  {listing.location}
                </span>
              </div>
            </div>

            {/* Contact Phone */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Liên hệ
              </h2>
              <a
                href={`tel:${listing.phone}`}
                className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {listing.phone}
              </a>
            </div>

            {/* Description */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Mô tả chi tiết
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-7 whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

