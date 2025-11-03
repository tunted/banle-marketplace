'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if there's a valid session (user clicked the reset link)
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // No valid session, redirect to login
        router.push('/login?error=invalid_reset_link')
      }
    }
    checkSession()
  }, [router])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Validate passwords
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu mới')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password.trim(),
      })

      if (updateError) {
        setError(updateError.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.')
        setLoading(false)
        return
      }

      // Success
      setSuccess(true)
      setLoading(false)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?success=password_reset')
      }, 2000)
    } catch (err: any) {
      setError(err?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
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
            <h2 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h2>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
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

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                  disabled={loading}
                />
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
                {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900">Mật khẩu đã được đặt lại!</h3>
              <p className="text-gray-600">
                Mật khẩu của bạn đã được cập nhật thành công. Bạn sẽ được chuyển đến trang đăng nhập trong giây lát...
              </p>
            </div>
          )}

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-green-600 font-semibold hover:text-green-700 hover:underline transition-colors"
            >
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

