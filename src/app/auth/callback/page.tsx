'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get the hash from URL (Supabase email verification uses hash)
        const hash = window.location.hash
        const hashParams = new URLSearchParams(hash.substring(1)) // Remove '#'
        
        // Also check query params as fallback
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')
        const type = hashParams.get('type') || searchParams.get('type')
        const error = hashParams.get('error') || searchParams.get('error')
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description')

        // Handle errors
        if (error) {
          console.error('Auth callback error:', error, errorDescription)
          setStatus('error')
          setMessage(errorDescription || 'Xác minh email thất bại. Vui lòng thử lại.')
          setTimeout(() => {
            router.push('/login?error=email_verification_failed')
          }, 3000)
          return
        }

        // If we have tokens, exchange them for a session
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('Error setting session:', sessionError)
            setStatus('error')
            setMessage('Lỗi xác minh phiên đăng nhập. Vui lòng thử lại.')
            setTimeout(() => {
              router.push('/login?error=session_error')
            }, 3000)
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

            setStatus('success')
            setMessage('Email đã được xác minh thành công! Đang chuyển hướng...')
            
            // Redirect to homepage or login
            setTimeout(() => {
              router.push('/?verified=success')
            }, 2000)
            return
          }
        }

        // Check if this is an email verification type
        if (type === 'email') {
          // Try to get the current session
          const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession()
          
          if (sessionCheckError || !session) {
            // No session yet - might need to handle differently
            // Supabase might have already confirmed the email, try to sign in
            setStatus('error')
            setMessage('Vui lòng đăng nhập để hoàn tất xác minh email.')
            setTimeout(() => {
              router.push('/login?verified=email_verified_please_login')
            }, 3000)
            return
          }

          // Session exists - user is verified
          const userMetadata = session.user.user_metadata || {}
          const fullName = userMetadata.full_name || null
          const phone = userMetadata.phone || null

          // Create or update user profile
          try {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .upsert({
                id: session.user.id,
                full_name: fullName,
                phone: phone,
                avatar_url: null,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'id',
              })

            if (profileError) {
              console.warn('Error creating/updating profile:', profileError)
            }
          } catch (profileErr) {
            console.error('Error creating/updating profile:', profileErr)
          }

          setStatus('success')
          setMessage('Email đã được xác minh thành công! Đang chuyển hướng...')
          
          setTimeout(() => {
            router.push('/?verified=success')
          }, 2000)
          return
        }

        // If we reach here, something unexpected happened
        setStatus('error')
        setMessage('Không thể xác minh email. Vui lòng thử lại.')
        setTimeout(() => {
          router.push('/login?error=verification_failed')
        }, 3000)
      } catch (err) {
        console.error('Error in auth callback:', err)
        setStatus('error')
        setMessage('Đã xảy ra lỗi. Vui lòng thử lại.')
        setTimeout(() => {
          router.push('/login?error=callback_error')
        }, 3000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Đang xác minh email...</h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
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
            <h2 className="text-xl font-bold text-gray-900 mb-2">Xác minh thành công!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Xác minh thất bại</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  )
}

