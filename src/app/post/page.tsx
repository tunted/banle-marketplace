'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { validatePhoneNumber, compressImage } from '@/lib/utils'
import { checkRateLimit, recordPostAttempt, getRemainingTimeMinutes } from '@/lib/rateLimit'
import { categories } from '@/lib/categories'
import LocationFilter from '@/components/LocationFilter'

export default function PostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    phone: '',
    location: '',
    description: '',
    category: '',
    province_code: '',
    ward_code: '',
  })
  const [images, setImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [locationName, setLocationName] = useState<string>('Chọn khu vực')

  // Check rate limit on mount
  useEffect(() => {
    const rateLimit = checkRateLimit()
    if (!rateLimit.allowed && rateLimit.remainingTime) {
      const minutes = getRemainingTimeMinutes(rateLimit.remainingTime)
      setRateLimitError(
        `Bạn đã đăng quá nhiều tin trong 1 giờ. Vui lòng đợi ${minutes} phút nữa.`
      )
    }
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Validate phone number in real-time
    if (name === 'phone') {
      if (value && !validatePhoneNumber(value)) {
        setPhoneError('Số điện thoại không hợp lệ. Ví dụ: 0912345678 hoặc +84912345678')
      } else {
        setPhoneError(null)
      }
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 5) {
      alert('Bạn chỉ có thể tải lên tối đa 5 hình ảnh')
      return
    }
    setImages(files)
    
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file))
    setImagePreviewUrls(urls)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newUrls = imagePreviewUrls.filter((_, i) => i !== index)
    setImages(newImages)
    setImagePreviewUrls(newUrls)
    
    // Revoke object URLs to free memory
    URL.revokeObjectURL(imagePreviewUrls[index])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setRateLimitError(null)

    try {
      // Check rate limit
      const rateLimit = checkRateLimit()
      if (!rateLimit.allowed) {
        if (rateLimit.remainingTime) {
          const minutes = getRemainingTimeMinutes(rateLimit.remainingTime)
          setRateLimitError(
            `Bạn đã đăng quá nhiều tin trong 1 giờ. Vui lòng đợi ${minutes} phút nữa.`
          )
        } else {
          setRateLimitError('Bạn đã đăng quá nhiều tin trong 1 giờ. Vui lòng thử lại sau.')
        }
        setLoading(false)
        return
      }

      // Validate required fields
      if (!formData.title || !formData.price || !formData.phone || !formData.location) {
        alert('Vui lòng điền đầy đủ các trường bắt buộc')
        setLoading(false)
        return
      }

      // Validate phone number
      if (!validatePhoneNumber(formData.phone)) {
        setPhoneError('Số điện thoại không hợp lệ. Ví dụ: 0912345678 hoặc +84912345678')
        setLoading(false)
        return
      }

      // Upload images to Supabase Storage
      const imageUrls: string[] = []

      for (let i = 0; i < images.length; i++) {
        const originalFile = images[i]
        
        // Compress image before upload (reduces storage costs and improves load times)
        let fileToUpload: Blob | File = originalFile
        
        try {
          // Only compress if file is larger than 500KB
          if (originalFile.size > 500 * 1024) {
            const compressedBlob = await compressImage(originalFile, 1920, 1920, 0.85)
            fileToUpload = new File([compressedBlob], originalFile.name, {
              type: originalFile.type,
              lastModified: originalFile.lastModified,
            })
          }
        } catch (compressError) {
          console.warn('Image compression failed, uploading original:', compressError)
          // Fallback to original file if compression fails
        }

        const fileExt = originalFile.name.split('.').pop()
        const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError, data } = await supabase.storage
          .from('listings')
          .upload(fileName, fileToUpload)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          alert(`Lỗi khi tải lên hình ảnh: ${uploadError.message}`)
          setLoading(false)
          return
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('listings')
          .getPublicUrl(data.path)

        imageUrls.push(urlData.publicUrl)
      }

      // Insert listing into database
      const { error: insertError } = await supabase.from('listings').insert({
        title: formData.title,
        price: parseFloat(formData.price),
        phone: formData.phone,
        location: formData.location,
        description: formData.description || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        category: formData.category || null,
        province_code: formData.province_code || null,
        ward_code: formData.ward_code || null,
      })

      if (insertError) {
        console.error('Insert error:', insertError)
        alert(`Lỗi khi tạo tin đăng: ${insertError.message}`)
        setLoading(false)
        return
      }

      // Record successful post for rate limiting
      recordPostAttempt()

      // Clean up preview URLs
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url))

      alert('Đăng tin thành công!')
      router.push('/')
    } catch (error) {
      console.error('Error:', error)
      alert('Đã xảy ra lỗi. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="text-green-500 hover:text-green-600 mb-4 inline-flex items-center gap-2"
      >
        <span>←</span>
        <span>Quay lại</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Đăng tin mới</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {rateLimitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">{rateLimitError}</p>
            </div>
          )}
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Nhập tiêu đề tin đăng"
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Giá (VND) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              required
              min="0"
              step="1000"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Nhập giá"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Nhập số điện thoại (VD: 0912345678)"
            />
            {phoneError && (
              <p className="mt-1 text-sm text-red-600">{phoneError}</p>
            )}
            {!phoneError && formData.phone && (
              <p className="mt-1 text-sm text-green-600">✓ Số điện thoại hợp lệ</p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Địa điểm <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-left hover:bg-gray-50 transition-colors"
              >
                {locationName}
              </button>
              <input
                type="text"
                id="location"
                name="location"
                required
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nhập địa chỉ chi tiết (số nhà, tên đường...)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              <option value="">Chọn danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Nhập mô tả chi tiết"
            />
          </div>

          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh (Tối đa 5 ảnh)
            </label>
            <input
              type="file"
              id="images"
              name="images"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600"
            />
            {imagePreviewUrls.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-300">
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-shadow"
          >
            {loading ? 'Đang đăng tin...' : 'Đăng tin'}
          </button>
        </form>

        {/* Location Filter Modal */}
        <LocationFilter
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onApply={(provinceCode, wardCode, name) => {
            setFormData((prev) => ({
              ...prev,
              province_code: provinceCode || '',
              ward_code: wardCode || '',
            }))
            setLocationName(name)
          }}
          currentLocation={locationName}
        />
      </div>
    </div>
  )
}

