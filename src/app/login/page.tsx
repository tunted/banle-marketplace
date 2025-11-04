'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { signIn, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  // Check for success/error messages from query params and handle email verification
  useEffect(() => {
    // Handle email verification callback from hash
    async function handleEmailVerification() {
      try {
        // Check if URL has hash (email verification callback from Supabase)
        const hash = window.location.hash
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1)) // Remove '#'
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          const type = hashParams.get('type')
          const error = hashParams.get('error')
          const errorDescription = hashParams.get('error_description')

          // Handle errors
          if (error) {
            console.error('Email verification error:', error, errorDescription)
            setError(errorDescription || 'Xác minh email thất bại. Vui lòng thử lại.')
            // Clear hash from URL
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
            return
          }

          // If we have tokens, exchange them for a session
          if (accessToken && refreshToken && (type === 'signup' || type === 'email')) {
            try {
              const { supabase } = await import('@/lib/supabase')
              const { data, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              })

              if (sessionError) {
                console.error('Error setting session:', sessionError)
                setError('Lỗi xác minh phiên đăng nhập. Vui lòng thử lại.')
                // Clear hash from URL
                window.history.replaceState(null, '', window.location.pathname + window.location.search)
                return
              }

              if (data?.user) {
                // User is now verified and authenticated
                // Get user metadata (full_name, phone) from the user object
                const userMetadata = data.user.user_metadata || {}
                const fullName = userMetadata.full_name || null
                const phone = userMetadata.phone || null

                // Create or update user profile
                try {
                  const { error: profileError } = await supabase
                    .from('user_profiles')
                    .upsert({
                      id: data.user.id,
                      full_name: fullName,
                      phone: phone,
                      avatar_url: null,
                      updated_at: new Date().toISOString(),
                    }, {
                      onConflict: 'id',
                    })

                  if (profileError) {
                    console.warn('Error creating/updating profile:', profileError)
                    // Continue anyway - profile might already exist
                  }
                } catch (profileErr) {
                  console.error('Error creating/updating profile:', profileErr)
                  // Continue anyway
                }

                // Clear hash from URL
                window.history.replaceState(null, '', window.location.pathname + window.location.search)
                
                // Show success message
                setSuccess('Email đã được xác nhận thành công! Đang chuyển hướng...')
                
                // Wait a moment for state to update, then redirect
                await new Promise(resolve => setTimeout(resolve, 1500))
                router.push('/')
                router.refresh()
                return
              }
            } catch (err) {
              console.error('Error in email verification:', err)
              setError('Đã xảy ra lỗi khi xác minh email. Vui lòng thử lại.')
              // Clear hash from URL
              window.history.replaceState(null, '', window.location.pathname + window.location.search)
              return
            }
          }
        }
      } catch (err) {
        console.error('Error handling email verification:', err)
      }
    }

    handleEmailVerification()

    // Handle query params (only if hash verification wasn't already processed)
    // Skip if we already handled email verification via hash
    if (!window.location.hash) {
      const errorParam = searchParams.get('error')
      const successParam = searchParams.get('success')

      if (errorParam === 'invalid_reset_link') {
        setError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.')
      } else if (errorParam === 'email_verification_failed' || errorParam === 'session_error' || errorParam === 'verification_failed' || errorParam === 'callback_error') {
        setError('Xác minh email thất bại. Vui lòng thử lại hoặc đăng nhập.')
      } else if (successParam === 'password_reset') {
        setSuccess('Mật khẩu của bạn đã được đặt lại thành công! Vui lòng đăng nhập với mật khẩu mới.')
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000)
      } else if (successParam === 'email_verified') {
        setSuccess('Email đã được xác nhận thành công! Bạn có thể đăng nhập ngay.')
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000)
      } else if (searchParams.get('verified') === 'email_verified_please_login') {
        setSuccess('Email đã được xác minh. Vui lòng đăng nhập để tiếp tục.')
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000)
      }
    }
  }, [searchParams, router, user])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: authError } = await signIn(email, password)

      if (authError) {
        setError(authError.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.')
        setLoading(false)
        return
      }

      // Success - redirect to homepage
      // The useAuth hook will handle the state update and router.refresh() is called automatically
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.'
      setError(errorMessage)
      setLoading(false)
    }
  }

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
            <h2 className="text-2xl font-bold text-gray-900">Đăng nhập vào Bán Lẹ</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
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

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(true)
                    setResetEmail(email) // Pre-fill with login email if available
                  }}
                  className="text-sm text-green-600 hover:text-green-700 hover:underline transition-colors"
                  disabled={loading}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                disabled={loading}
              />
            </div>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

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
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <Link
                href="/register"
                className="text-green-600 font-semibold hover:text-green-700 hover:underline transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => {
            if (!resetLoading && !resetSuccess) {
              setShowForgotPasswordModal(false)
              setResetError(null)
              setResetSuccess(false)
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {!resetSuccess ? (
              <>
                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Đặt lại mật khẩu
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Nhập email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
                </p>

                {/* Email Input */}
                <div className="mb-4">
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="resetEmail"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                    disabled={resetLoading}
                  />
                </div>

                {/* Error Message */}
                {resetError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-500 text-sm">{resetError}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleResetPassword}
                    disabled={resetLoading || !resetEmail.trim()}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
                  </button>
                  <button
                    onClick={() => {
                      setShowForgotPasswordModal(false)
                      setResetError(null)
                      setResetEmail('')
                    }}
                    disabled={resetLoading}
                    className="w-full text-gray-600 text-sm hover:text-gray-900 transition-colors disabled:opacity-50"
                  >
                    Hủy
                  </button>
                </div>
              </>
            ) : (
              <>
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

                {/* Success Message */}
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                  Email đã được gửi!
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  Chúng tôi đã gửi một liên kết đặt lại mật khẩu đến <strong className="text-gray-900">{resetEmail}</strong>
                </p>
                <p className="text-sm text-gray-500 text-center mb-6">
                  Vui lòng kiểm tra hộp thư đến (và cả thư mục spam) và nhấp vào liên kết để đặt lại mật khẩu của bạn.
                </p>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowForgotPasswordModal(false)
                    setResetSuccess(false)
                    setResetEmail('')
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                >
                  Đã hiểu
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )

  async function handleResetPassword() {
    if (!resetEmail.trim()) {
      setResetError('Vui lòng nhập email của bạn')
      return
    }

    setResetError(null)
    setResetLoading(true)

    try {
      // Import supabase for password reset (not part of useAuth hook)
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setResetError(error.message || 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.')
        setResetLoading(false)
        return
      }

      // Success
      setResetSuccess(true)
      setResetLoading(false)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.'
      setResetError(errorMessage)
      setResetLoading(false)
    }
  }

  // Handle ESC key to close modal
  useEffect(() => {
    if (!showForgotPasswordModal) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !resetLoading && !resetSuccess) {
        setShowForgotPasswordModal(false)
        setResetError(null)
        setResetSuccess(false)
        setResetEmail('')
      }
    }

    document.addEventListener('keydown', handleEscape)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showForgotPasswordModal, resetLoading, resetSuccess])
}

