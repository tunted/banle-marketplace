"use client";

import { useState } from "react";
import Link from "next/link";

export default function PostAdPage() {
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    phone: "",
    area: "",
    description: "",
    images: [] as File[],
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLInputElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const selectedFiles = Array.from(files).slice(0, 5); // Max 5 images
      setFormData((prev) => ({
        ...prev,
        images: selectedFiles,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
    // You can add API call or navigation here
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
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

        {/* Form Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Đăng tin rao vặt miễn phí
          </h1>
          <p className="text-gray-600">
            Điền thông tin bên dưới để đăng tin của bạn
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          {/* Tiêu đề */}
          <div className="mb-6">
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Ví dụ: iPhone 15 Pro Max 256GB - Hàng chính hãng"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
            />
          </div>

          {/* Giá */}
          <div className="mb-6">
            <label
              htmlFor="price"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Giá <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="1000"
                placeholder="0"
                className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                VNĐ
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Nhập giá bán của sản phẩm/dịch vụ
            </p>
          </div>

          {/* Số điện thoại */}
          <div className="mb-6">
            <label
              htmlFor="phone"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder="0901234567"
              pattern="[0-9]{10,11}"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
            />
            <p className="mt-2 text-sm text-gray-500">
              Số điện thoại để người mua liên hệ
            </p>
          </div>

          {/* Khu vực */}
          <div className="mb-6">
            <label
              htmlFor="area"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Khu vực <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              required
              placeholder="Ví dụ: Quận 1, TP.HCM"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
            />
          </div>

          {/* Mô tả */}
          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={6}
              placeholder="Mô tả chi tiết về sản phẩm/dịch vụ của bạn..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-y"
            />
            <p className="mt-2 text-sm text-gray-500">
              Cung cấp thông tin chi tiết để tăng cơ hội bán được nhanh hơn
            </p>
          </div>

          {/* Upload ảnh */}
          <div className="mb-8">
            <label
              htmlFor="images"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Hình ảnh
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-green-400 transition-colors">
              <input
                type="file"
                id="images"
                name="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="images"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700 mb-1">
                  Chọn tối đa 5 ảnh
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG hoặc WEBP (tối đa 5MB mỗi ảnh)
                </span>
              </label>
            </div>
            {formData.images.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Đã chọn {formData.images.length} ảnh:
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.images.map((file, index) => (
                    <div
                      key={index}
                      className="px-3 py-1 bg-gray-100 rounded-md text-sm text-gray-700"
                    >
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
            <Link
              href="/"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-center"
            >
              Hủy
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              Đăng tin miễn phí
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

