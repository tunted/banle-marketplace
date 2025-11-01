import Link from "next/link";

// Mock data for classified ads
const mockAds = [
  {
    id: 1,
    title: "iPhone 15 Pro Max 256GB - Hàng chính hãng",
    price: 28900000,
    location: "Quận 1, TP.HCM",
  },
  {
    id: 2,
    title: "Xe máy Honda Wave RSX 2023 - Còn mới 99%",
    price: 18500000,
    location: "Quận 7, TP.HCM",
  },
  {
    id: 3,
    title: "Laptop Dell XPS 15 - Core i7, 16GB RAM",
    price: 32500000,
    location: "Quận 2, TP.HCM",
  },
  {
    id: 4,
    title: "Bàn ghế gỗ tự nhiên - Bộ 6 món đẹp",
    price: 8500000,
    location: "Quận 3, TP.HCM",
  },
  {
    id: 5,
    title: "Tủ lạnh Samsung Inverter 550L - Mới 100%",
    price: 14900000,
    location: "Quận 10, TP.HCM",
  },
  {
    id: 6,
    title: "Xe đạp thể thao Giant - Đã sử dụng tốt",
    price: 3200000,
    location: "Quận Bình Thạnh, TP.HCM",
  },
];

// Format price with Vietnamese currency
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("vi-VN").format(price) + " đ";
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Title */}
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Rao vặt miễn phí – Bán nhanh, mua lẹ!
          </h1>
        </div>

        {/* Ads Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {mockAds.map((ad) => (
            <Link
              key={ad.id}
              href={`/listing/${ad.id}`}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group block"
            >
              {/* Image Placeholder */}
              <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-gray-400"
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

              {/* Card Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                  {ad.title}
                </h3>
                <p className="text-lg sm:text-xl font-bold text-green-600 mb-2">
                  {formatPrice(ad.price)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
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
                  {ad.location}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
