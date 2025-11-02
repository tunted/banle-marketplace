'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
}

type LoadingState = 'loading' | 'no-session' | 'error' | 'success'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [email, setEmail] = useState<string>('')
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [avatarError, setAvatarError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      try {
        // Step 1: Check session first
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        // Handle session errors
        if (sessionError) {
          console.error('Session error:', sessionError)
          setLoadingState('error')
          setErrorMessage('Không thể xác thực phiên đăng nhập. Vui lòng đăng nhập lại.')
          return
        }

        // No session - show login required message
        if (!session) {
          setLoadingState('no-session')
          return
        }

        // Session exists but no user - generic error
        if (!session.user) {
          setLoadingState('error')
          setErrorMessage('Thông tin người dùng không hợp lệ.')
          return
        }

        // Step 2: Set email from session
        setEmail(session.user.email || '')

        // Step 3: Fetch user profile
        const { data, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url, phone')
          .eq('id', session.user.id)
          .single()

        // Handle profile fetch errors
        if (profileError) {
          console.error('Profile fetch error:', profileError)

          // If profile doesn't exist (PGRST116 = no rows returned), create one
          if (profileError.code === 'PGRST116' || profileError.message.includes('No rows')) {
            try {
              // Create profile on-the-fly
              const { data: newProfile, error: createError } = await supabase
                .from('user_profiles')
                .insert({
                  id: session.user.id,
                  full_name: session.user.user_metadata?.full_name || null,
                  avatar_url: null,
                  phone: null,
                })
                .select()
                .single()

              if (createError) {
                console.error('Profile creation error:', createError)
                setLoadingState('error')
                setErrorMessage('Không thể tạo hồ sơ người dùng. Vui lòng thử lại sau.')
                return
              }

              setProfile(newProfile)
              setLoadingState('success')
            } catch (createErr: any) {
              console.error('Error creating profile:', createErr)
              setLoadingState('error')
              setErrorMessage('Không thể tạo hồ sơ người dùng. Vui lòng thử lại sau.')
            }
          } else {
            // Other database errors
            setLoadingState('error')
            setErrorMessage('Không thể tải thông tin người dùng từ cơ sở dữ liệu.')
          }
        } else if (data) {
          // Success - profile found
          setProfile(data)
          setLoadingState('success')
        }
      } catch (err: any) {
        console.error('Unexpected error loading profile:', err)
        setLoadingState('error')
        setErrorMessage('Đã xảy ra lỗi không mong đợi. Vui lòng thử lại.')
      }
    }

    loadProfile()
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Clear previous messages
    setError(null)
    setSuccess(null)

    // Validate file type - only allow jpg, png, webp
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']

    if (!allowedTypes.includes(file.type) && !(fileExtension && allowedExtensions.includes(fileExtension))) {
      setError('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, hoặc WEBP).')
      setTimeout(() => setError(null), 5000)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      setError('Kích thước ảnh không được vượt quá 2MB. Vui lòng chọn ảnh nhỏ hơn.')
      setTimeout(() => setError(null), 5000)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // Step 1: Check session before upload
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session || !session.user) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        setUploading(false)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
        return
      }

      const user = session.user

      // Step 2: Determine file extension (prefer actual extension from filename)
      let fileExt = fileExtension || 'jpg'
      if (!allowedExtensions.includes(fileExt)) {
        // Fallback to jpg if extension is invalid
        fileExt = 'jpg'
      }

      // Step 3: Generate unique filename: ${userId}_${Date.now()}.${extension}
      const fileName = `${user.id}_${Date.now()}.${fileExt}`
      const filePath = fileName // Upload to root of avatars bucket

      // Step 4: Delete old avatar if exists (optional cleanup)
      if (profile?.avatar_url) {
        try {
          const oldFileName = profile.avatar_url.split('/').pop()?.split('?')[0]
          if (oldFileName) {
            await supabase.storage.from('avatars').remove([oldFileName])
            // Ignore errors - old file might not exist
          }
        } catch (cleanupError) {
          console.warn('Could not delete old avatar:', cleanupError)
          // Continue anyway
        }
      }

      // Step 5: Upload directly to Supabase Storage (assume bucket exists)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Allow overwriting if same filename
          contentType: file.type,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        
        // Handle upload errors - focus on RLS/permission issues
        let errorMessage = 'Không thể tải ảnh lên. Vui lòng thử lại.'
        
        const statusCode = uploadError.statusCode
        const errorMsg = uploadError.message?.toLowerCase() || ''
        
        // Handle RLS/permission errors (403 or 400 often indicates RLS issue)
        if (statusCode === 403 || statusCode === 400 || errorMsg.includes('permission') || errorMsg.includes('forbidden') || errorMsg.includes('unauthorized') || errorMsg.includes('policy')) {
          errorMessage = 'Không có quyền tải ảnh. Vui lòng liên hệ hỗ trợ.'
        } else if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('failed to fetch') || errorMsg.includes('connection')) {
          errorMessage = 'Không thể tải ảnh lên. Lỗi mạng, vui lòng thử lại.'
        } else if (statusCode === 413 || errorMsg.includes('too large')) {
          errorMessage = 'Không thể tải ảnh lên. File quá lớn (tối đa 2MB).'
        } else if (statusCode === 404 || errorMsg.includes('not found')) {
          errorMessage = 'Không thể tải ảnh lên. Không tìm thấy thư mục lưu trữ.'
        }
        
        setError(errorMessage)
        setUploading(false)
        setTimeout(() => setError(null), 5000)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Step 6: Get public URL after successful upload
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      if (!publicUrl) {
        setError('Không thể tạo đường dẫn ảnh. Vui lòng thử lại.')
        setUploading(false)
        setTimeout(() => setError(null), 5000)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Step 7: Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        
        let errorMessage = 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.'
        if (updateError.message?.includes('permission') || updateError.message?.includes('RLS')) {
          errorMessage = 'Bạn không có quyền cập nhật hồ sơ. Vui lòng liên hệ quản trị viên.'
        }
        
        setError(errorMessage)
        setUploading(false)
        setTimeout(() => setError(null), 5000)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Step 8: Success - Update local state and show success message
      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null))
      setAvatarError(false) // Reset avatar error state
      setSuccess('Ảnh đại diện đã được cập nhật!')
      
      // Refresh the page to update header menu
      router.refresh()
      
      // Clear success message after 4 seconds
      setTimeout(() => setSuccess(null), 4000)
    } catch (err: any) {
      console.error('Unexpected error uploading avatar:', err)
      setError('Đã xảy ra lỗi không mong đợi. Vui lòng thử lại.')
      setTimeout(() => setError(null), 5000)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Loading state
  if (loadingState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  // No session state
  if (loadingState === 'no-session') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Yêu cầu đăng nhập</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để xem trang cá nhân.</p>
          <div className="space-y-3">
            <Link
              href="/login"
              className="block bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              Đăng nhập
            </Link>
            <Link
              href="/"
              className="block text-green-600 hover:text-green-700 hover:underline font-medium text-sm"
            >
              ← Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (loadingState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-gray-600 mb-6">{errorMessage || 'Không thể tải thông tin người dùng.'}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setLoadingState('loading')
                setErrorMessage('')
                window.location.reload()
              }}
              className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              Thử lại
            </button>
            <Link
              href="/"
              className="block text-green-600 hover:text-green-700 hover:underline font-medium text-sm"
            >
              ← Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state - show profile
  if (loadingState === 'success' && profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Trang cá nhân</h1>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-20 h-20 rounded-full border-2 border-green-500 overflow-hidden bg-gray-100 flex items-center justify-center">
                {profile.avatar_url && !avatarError ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User avatar'}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    onError={() => {
                      setAvatarError(true)
                    }}
                  />
                ) : (
                  <span className="text-4xl">🧑</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md hover:shadow-lg"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Đang tải lên...
                  </span>
                ) : (
                  'Thay đổi ảnh đại diện'
                )}
              </button>
            </div>

            {/* Profile Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900 font-medium">
                    {profile.full_name || 'Người dùng'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900">{email || 'Chưa có email'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900">
                    {profile.phone || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </div>

            {/* Back to Home Link */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                href="/"
                className="block text-center text-green-600 hover:text-green-700 hover:underline font-medium"
              >
                ← Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback - should not reach here
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-6 text-center">
        <p className="text-gray-600 mb-4">Không thể hiển thị thông tin.</p>
        <Link
          href="/"
          className="text-green-600 hover:text-green-700 hover:underline font-medium"
        >
          ← Về trang chủ
        </Link>
      </div>
    </div>
  )
}
