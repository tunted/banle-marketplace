'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { validatePhoneNumber } from '@/lib/utils'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPhoneError(null)
    setLoading(true)

    // Validate phone number
    if (!phone.trim()) {
      setPhoneError('Vui lòng nhập số điện thoại')
      setLoading(false)
      return
    }

    const trimmedPhone = phone.trim()
    if (!validatePhoneNumber(trimmedPhone)) {
      setPhoneError('Số điện thoại không hợp lệ. Ví dụ: 0912345678, 0987654321 hoặc +84912345678')
      setLoading(false)
      return
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || null,
            phone: trimmedPhone,
          },
          emailRedirectTo: `${window.location.origin}/login?success=email_verified`,
        },
      })

      if (authError) {
        // Handle specific error messages
        if (authError.message.includes('already registered')) {
          setError('Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.')
        } else {
          setError(authError.message || 'Đăng ký thất bại. Vui lòng thử lại.')
        }
        setLoading(false)
        return
      }

      if (data?.user) {
        // Create user profile record with phone number
        try {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              full_name: fullName || null,
              phone: trimmedPhone,
              avatar_url: null,
            })

          if (profileError) {
            console.error('Error creating profile:', profileError)
            // Continue anyway - profile can be updated later
          }
        } catch (profileErr) {
          console.error('Error creating profile:', profileErr)
          // Continue anyway
        }

        // Show email confirmation modal instead of redirecting
        setShowEmailConfirmModal(true)
        setLoading(false)
      }
    } catch (err: any) {
      setError(err?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPhone(value)
    setPhoneError(null)
    
    // Real-time validation
    if (value && !validatePhoneNumber(value.trim())) {
      setPhoneError('Số điện thoại không hợp lệ. Ví dụ: 0912345678, 0987654321 hoặc +84912345678')
    } else {
      setPhoneError(null)
    }
  }

  const handleModalClose = () => {
    setShowEmailConfirmModal(false)
    router.push('/login')
  }

  // Handle ESC key to close modal
  useEffect(() => {
    if (!showEmailConfirmModal) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEmailConfirmModal(false)
        router.push('/login')
      }
    }

    document.addEventListener('keydown', handleEscape)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showEmailConfirmModal, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <span className="text-3xl">⚡</span>
              <h1 className="text-2xl font-black bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                Bán Lẹ
              </h1>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Tạo tài khoản Bán Lẹ</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Input (Optional) */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên <span className="text-gray-400 text-xs">(tùy chọn)</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                disabled={loading}
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                disabled={loading}
              />
            </div>

            {/* Phone Input */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={handlePhoneChange}
                placeholder="0912345678 hoặc +84912345678"
                className={`w-full p-3 rounded-lg border outline-none transition-colors ${
                  phoneError 
                    ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent' 
                    : 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent'
                }`}
                disabled={loading}
              />
              {phoneError && (
                <p className="mt-1 text-sm text-red-600">{phoneError}</p>
              )}
              {!phoneError && phone && validatePhoneNumber(phone.trim()) && (
                <p className="mt-1 text-sm text-green-600">✓ Số điện thoại hợp lệ</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Ví dụ: 0912345678, 0987654321 hoặc +84912345678</p>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Mật khẩu phải có ít nhất 6 ký tự</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link
                href="/login"
                className="text-green-600 font-semibold hover:text-green-700 hover:underline transition-colors"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Email Confirmation Modal */}
      {showEmailConfirmModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={handleModalClose}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Kiểm tra email của bạn
            </h3>

            {/* Message */}
            <p className="text-gray-600 text-center mb-6">
              Chúng tôi đã gửi một email xác nhận đến <strong className="text-gray-900">{email}</strong>
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              Vui lòng kiểm tra hộp thư đến (và cả thư mục spam) và nhấp vào liên kết xác nhận để kích hoạt tài khoản của bạn.
            </p>

            {/* Resend Email Button (Optional) */}
            <div className="space-y-3">
              <button
                onClick={handleModalClose}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
              >
                Đã hiểu, đăng nhập ngay
              </button>
              <button
                onClick={handleModalClose}
                className="w-full text-gray-600 text-sm hover:text-gray-900 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

