'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { validatePhoneNumber, compressImage } from '@/lib/utils'
import { checkRateLimit, recordPostAttempt, getRemainingTimeMinutes } from '@/lib/rateLimit'

interface Province {
  code: string
  name: string
}

interface Ward {
  code: string
  name: string
  province_code: string
}

export default function PostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    phone: '',
    location: '',
    description: '',
    province_code: '',
    ward_code: '',
  })
  const [images, setImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [provinces, setProvinces] = useState<Province[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load provinces on mount
  useEffect(() => {
    async function loadProvinces() {
      setLoadingProvinces(true)
      try {
        const { data, error } = await supabase
          .from('provinces')
          .select('code, name')
          .order('name')

        if (error) {
          console.error('Error fetching provinces:', error)
        } else {
          setProvinces(data || [])
        }
      } catch (err) {
        console.error('Error loading provinces:', err)
      } finally {
        setLoadingProvinces(false)
      }
    }
    loadProvinces()
  }, [])

  // Load wards when province is selected
  useEffect(() => {
    async function loadWards() {
      if (!formData.province_code) {
        setWards([])
        setFormData((prev) => ({ ...prev, ward_code: '' }))
        return
      }

      setLoadingWards(true)
      try {
        const { data, error } = await supabase
          .from('wards')
          .select('code, name, province_code')
          .eq('province_code', formData.province_code)
          .order('name')

        if (error) {
          console.error('Error fetching wards:', error)
          setWards([])
        } else {
          setWards(data || [])
          // Reset ward_code when province changes
          setFormData((prev) => ({ ...prev, ward_code: '' }))
        }
      } catch (err) {
        console.error('Error loading wards:', err)
        setWards([])
      } finally {
        setLoadingWards(false)
      }
    }
    loadWards()
  }, [formData.province_code])

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
    setFormErrors((prev) => ({ ...prev, [name]: '' }))
    
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
    setUploadError(null)

    // Validate total count
    if (files.length + images.length > 5) {
      setUploadError('Bạn chỉ có thể tải lên tối đa 5 hình ảnh')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate each file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
    const maxSize = 2 * 1024 * 1024 // 2MB

    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach((file) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      // Check file type
      if (!allowedTypes.includes(file.type) && !(fileExtension && allowedExtensions.includes(fileExtension))) {
        errors.push(`File "${file.name}" không hợp lệ. Chỉ chấp nhận JPG, PNG, hoặc WEBP.`)
        return
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(`File "${file.name}" quá lớn. Kích thước tối đa là 2MB.`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      setUploadError(errors.join(' '))
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Add valid files to existing images
    const newImages = [...images, ...validFiles]
    setImages(newImages)
    
    // Create preview URLs using Object URLs (safe for <img> tags)
    const newUrls = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviewUrls([...imagePreviewUrls, ...newUrls])
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    // Revoke object URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index])
    
    const newImages = images.filter((_, i) => i !== index)
    const newUrls = imagePreviewUrls.filter((_, i) => i !== index)
    setImages(newImages)
    setImagePreviewUrls(newUrls)
    setUploadError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setRateLimitError(null)
    setUploadError(null)
    setFormErrors({})

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

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        alert('Bạn cần đăng nhập để đăng tin.')
        router.push('/login')
        setLoading(false)
        return
      }

      // Validate required fields
      const errors: Record<string, string> = {}
      if (!formData.title.trim()) {
        errors.title = 'Vui lòng nhập tiêu đề'
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        errors.price = 'Vui lòng nhập giá hợp lệ'
      }
      if (!formData.phone) {
        errors.phone = 'Vui lòng nhập số điện thoại'
      } else if (!validatePhoneNumber(formData.phone)) {
        errors.phone = 'Số điện thoại không hợp lệ'
      }
      if (!formData.location.trim()) {
        errors.location = 'Vui lòng nhập địa chỉ'
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        setLoading(false)
        return
      }

      // Upload images to Supabase Storage
      const imageUrls: string[] = []

      if (images.length > 0) {
        try {
          for (let i = 0; i < images.length; i++) {
            const originalFile = images[i]
            
            // Compress image before upload if needed
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

            // Generate unique filename: ${Date.now()}-${index}-${file.name}
            const fileName = `${Date.now()}-${i}-${originalFile.name}`

            const { error: uploadError, data } = await supabase.storage
              .from('listings')
              .upload(fileName, fileToUpload, {
                cacheControl: '3600',
                contentType: originalFile.type,
                upsert: false,
              })

            if (uploadError) {
              console.error('Upload error:', uploadError)
              
              // Handle specific errors
              const statusCode = uploadError.statusCode
              const errorMsg = uploadError.message?.toLowerCase() || ''
              
              if (statusCode === 404 || errorMsg.includes('not found') || errorMsg.includes('bucket')) {
                setUploadError('Hệ thống đang cập nhật. Vui lòng thử lại sau.')
              } else if (statusCode === 403 || statusCode === 400 || errorMsg.includes('permission') || errorMsg.includes('forbidden') || errorMsg.includes('policy')) {
                setUploadError('Không có quyền tải ảnh lên. Vui lòng liên hệ hỗ trợ.')
              } else if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('failed to fetch')) {
                setUploadError('Không thể tải ảnh lên. Vui lòng kiểm tra kết nối.')
              } else {
                setUploadError('Không thể tải ảnh lên. Vui lòng thử lại.')
              }
              
              setLoading(false)
              return
            }

            if (!data) {
              setUploadError('Không thể tải ảnh lên. Vui lòng thử lại.')
              setLoading(false)
              return
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('listings')
              .getPublicUrl(data.path)

            if (urlData?.publicUrl) {
              imageUrls.push(urlData.publicUrl)
            }
          }
        } catch (uploadException: any) {
          console.error('Exception during upload:', uploadException)
          setUploadError('Không thể tải ảnh lên. Vui lòng kiểm tra kết nối.')
          setLoading(false)
          return
        }
      }

      // Insert listing into database
      const { error: insertError } = await supabase.from('listings').insert({
        user_id: user.id,
        title: formData.title.trim(),
        price: parseFloat(formData.price),
        phone: formData.phone,
        location: formData.location.trim(),
        description: formData.description.trim() || null,
        images: imageUrls.length > 0 ? imageUrls : null,
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
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                formErrors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nhập tiêu đề tin đăng"
            />
            {formErrors.title && (
              <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
            )}
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
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                formErrors.price ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nhập giá"
            />
            {formErrors.price && (
              <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
            )}
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
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                formErrors.phone || phoneError ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nhập số điện thoại (VD: 0912345678)"
            />
            {phoneError && (
              <p className="mt-1 text-sm text-red-600">{phoneError}</p>
            )}
            {formErrors.phone && !phoneError && (
              <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
            )}
            {!phoneError && !formErrors.phone && formData.phone && (
              <p className="mt-1 text-sm text-green-600">✓ Số điện thoại hợp lệ</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khu vực
            </label>
            <div className="space-y-3">
              <div>
                <label htmlFor="province" className="block text-xs text-gray-500 mb-1">
                  Tỉnh/Thành phố
                </label>
                <select
                  id="province"
                  name="province_code"
                  value={formData.province_code}
                  onChange={handleInputChange}
                  disabled={loadingProvinces}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="">
                    {loadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
                  </option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ward" className="block text-xs text-gray-500 mb-1">
                  Quận/Huyện/Xã
                </label>
                <select
                  id="ward"
                  name="ward_code"
                  value={formData.ward_code}
                  onChange={handleInputChange}
                  disabled={!formData.province_code || loadingWards}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white disabled:bg-gray-50"
                >
                  <option value="">
                    {!formData.province_code
                      ? 'Chọn tỉnh/thành phố trước'
                      : loadingWards
                      ? 'Đang tải...'
                      : 'Chọn quận/huyện/xã'}
                  </option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ chi tiết <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              required
              value={formData.location}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                formErrors.location ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nhập địa chỉ chi tiết (số nhà, tên đường...)"
            />
            {formErrors.location && (
              <p className="mt-1 text-sm text-red-600">{formErrors.location}</p>
            )}
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
              Hình ảnh (Tối đa 5 ảnh, mỗi ảnh tối đa 2MB)
            </label>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                id="images"
                name="images"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleImageChange}
                disabled={loading || images.length >= 5}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || images.length >= 5}
                className={`px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors ${
                  loading || images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {images.length >= 5 ? 'Đã đạt giới hạn' : 'Chọn ảnh'}
              </button>
              
              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}
              
              {imagePreviewUrls.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {imagePreviewUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100 flex-shrink-0"
                    >
                      {/* Use <img> instead of next/image for previews */}
                      {url && url.startsWith('blob:') ? (
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={loading}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 shadow-md"
                        aria-label="Xóa ảnh"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {images.length === 0 && !loading && (
                <p className="text-sm text-gray-500">
                  Chọn tối đa 5 ảnh (JPG, PNG, WEBP - mỗi ảnh tối đa 2MB)
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-shadow"
          >
            {loading ? 'Đang đăng tin...' : 'Đăng tin miễn phí'}
          </button>
        </form>
      </div>
    </div>
  )
}
