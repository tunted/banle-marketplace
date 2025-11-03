'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/utils'

interface CCCDUploadProps {
  userId: string
  currentFrontUrl?: string | null
  currentBackUrl?: string | null
  isVerified?: boolean
}

export default function CCCDUpload({
  userId,
  currentFrontUrl,
  currentBackUrl,
  isVerified,
}: CCCDUploadProps) {
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(currentFrontUrl || null)
  const [backPreview, setBackPreview] = useState<string | null>(currentBackUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)

  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB')
      return
    }

    setFrontFile(file)
    setError(null)
    setSuccess(false)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setFrontPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB')
      return
    }

    setBackFile(file)
    setError(null)
    setSuccess(false)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setBackPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!frontFile || !backFile) {
      setError('Vui lòng tải lên cả mặt trước và mặt sau của CCCD')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      // Compress images if needed
      let frontToUpload = frontFile
      let backToUpload = backFile

      if (frontFile.size > 500 * 1024) {
        const compressed = await compressImage(frontFile, 1920, 1920, 0.85)
        frontToUpload = new File([compressed], frontFile.name, {
          type: frontFile.type,
          lastModified: frontFile.lastModified,
        })
      }

      if (backFile.size > 500 * 1024) {
        const compressed = await compressImage(backFile, 1920, 1920, 0.85)
        backToUpload = new File([compressed], backFile.name, {
          type: backFile.type,
          lastModified: backFile.lastModified,
        })
      }

      // Upload front image
      const frontFileName = `front-${Date.now()}.${frontFile.name.split('.').pop()}`
      const frontPath = `${userId}/${frontFileName}`

      const { error: frontError, data: frontData } = await supabase.storage
        .from('cccd')
        .upload(frontPath, frontToUpload, {
          cacheControl: '3600',
          contentType: frontFile.type,
          upsert: true,
        })

      if (frontError) {
        throw new Error(`Lỗi tải mặt trước: ${frontError.message}`)
      }

      // Upload back image
      const backFileName = `back-${Date.now()}.${backFile.name.split('.').pop()}`
      const backPath = `${userId}/${backFileName}`

      const { error: backError, data: backData } = await supabase.storage
        .from('cccd')
        .upload(backPath, backToUpload, {
          cacheControl: '3600',
          contentType: backFile.type,
          upsert: true,
        })

      if (backError) {
        throw new Error(`Lỗi tải mặt sau: ${backError.message}`)
      }

      // Get public URLs
      const { data: frontUrlData } = supabase.storage
        .from('cccd')
        .getPublicUrl(frontPath)

      const { data: backUrlData } = supabase.storage
        .from('cccd')
        .getPublicUrl(backPath)

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          cccd_front_url: frontUrlData.publicUrl,
          cccd_back_url: backUrlData.publicUrl,
          is_verified: false, // Reset to false, admin will verify
        })
        .eq('id', userId)

      if (updateError) {
        throw new Error(`Lỗi cập nhật: ${updateError.message}`)
      }

      setSuccess(true)
      setFrontFile(null)
      setBackFile(null)

      // Update previews with new URLs
      setFrontPreview(frontUrlData.publicUrl)
      setBackPreview(backUrlData.publicUrl)
    } catch (err: any) {
      console.error('Error uploading CCCD:', err)
      setError(err.message || 'Không thể tải lên CCCD. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác thực CCCD</h3>

      {isVerified && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-800">
            ✓ Tài khoản của bạn đã được xác thực CCCD
          </p>
        </div>
      )}

      {success && !isVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            CCCD đã được tải lên thành công. Đang chờ quản trị viên xác thực.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Front Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mặt trước CCCD <span className="text-red-500">*</span>
          </label>
          <input
            ref={frontInputRef}
            type="file"
            accept="image/*"
            onChange={handleFrontChange}
            className="hidden"
          />
          <div className="flex gap-4">
            {frontPreview && (
              <div className="relative w-32 h-48 rounded-lg overflow-hidden border-2 border-gray-300">
                <img
                  src={frontPreview}
                  alt="CCCD mặt trước"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => frontInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {frontFile ? 'Thay đổi' : 'Chọn ảnh'}
            </button>
          </div>
        </div>

        {/* Back Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mặt sau CCCD <span className="text-red-500">*</span>
          </label>
          <input
            ref={backInputRef}
            type="file"
            accept="image/*"
            onChange={handleBackChange}
            className="hidden"
          />
          <div className="flex gap-4">
            {backPreview && (
              <div className="relative w-32 h-48 rounded-lg overflow-hidden border-2 border-gray-300">
                <img
                  src={backPreview}
                  alt="CCCD mặt sau"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => backInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {backFile ? 'Thay đổi' : 'Chọn ảnh'}
            </button>
          </div>
        </div>

        {/* Upload Button */}
        {!isVerified && (
          <button
            onClick={handleUpload}
            disabled={uploading || !frontFile || !backFile}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-shadow"
          >
            {uploading ? 'Đang tải lên...' : 'Tải lên CCCD'}
          </button>
        )}

        <p className="text-xs text-gray-500">
          * Vui lòng tải lên ảnh rõ ràng, đầy đủ thông tin của cả mặt trước và mặt sau CCCD.
          Quản trị viên sẽ xác thực trong vòng 24-48 giờ.
        </p>
      </div>
    </div>
  )
}

