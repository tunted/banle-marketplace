'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import LoginPrompt from './LoginPrompt'

interface UserRatingProps {
  targetUserId: string
  currentRating?: number | null
}

export default function UserRating({ targetUserId, currentRating }: UserRatingProps) {
  const [rating, setRating] = useState(currentRating || 0)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
      if (session?.user) {
        setCurrentUserId(session.user.id)
      }
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      if (session?.user) {
        setCurrentUserId(session.user.id)
      } else {
        setCurrentUserId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load current user's rating if logged in
  useEffect(() => {
    async function loadUserRating() {
      if (!isLoggedIn || !currentUserId || currentUserId === targetUserId) return

      try {
        const { data } = await supabase
          .from('user_ratings')
          .select('rating')
          .eq('reviewer_id', currentUserId)
          .eq('target_user_id', targetUserId)
          .maybeSingle()

        if (data) {
          setUserRating(data.rating)
        }
      } catch (error) {
        console.error('Error loading user rating:', error)
      }
    }
    loadUserRating()
  }, [isLoggedIn, currentUserId, targetUserId])

  // Refresh rating when currentRating prop changes
  useEffect(() => {
    if (currentRating !== null && currentRating !== undefined) {
      setRating(currentRating)
    }
  }, [currentRating])

  const handleRatingSubmit = async (newRating: number) => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true)
      return
    }

    if (!currentUserId || currentUserId === targetUserId) {
      alert('Bạn không thể đánh giá chính mình.')
      return
    }

    setIsSubmitting(true)

    try {
      // Upsert rating (insert or update)
      const { error } = await supabase
        .from('user_ratings')
        .upsert(
          {
            reviewer_id: currentUserId,
            target_user_id: targetUserId,
            rating: newRating,
          },
          {
            onConflict: 'reviewer_id,target_user_id',
          }
        )

      if (error) {
        console.error('Error submitting rating:', error)
        alert('Không thể gửi đánh giá. Vui lòng thử lại.')
      } else {
        setUserRating(newRating)
        // Refresh the displayed rating (will be updated by trigger)
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('rating')
          .eq('id', targetUserId)
          .single()

        if (profile?.rating) {
          setRating(profile.rating)
        }
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayRating = rating.toFixed(1)
  const canRate = isLoggedIn && currentUserId && currentUserId !== targetUserId

  return (
    <>
      {showLoginPrompt && (
        <LoginPrompt
          message="Vui lòng đăng nhập để đánh giá người dùng"
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
      
      <div className="flex items-center gap-2">
        {/* Display Stars */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-5 h-5 ${
                star <= Math.round(rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="font-semibold text-gray-900">{displayRating}</span>

        {/* Rating Input (if can rate) */}
        {canRate && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-600">Đánh giá:</span>
            <div className="flex items-center gap-1" onMouseLeave={() => setHoverValue(null)}>
              {[1, 2, 3, 4, 5].map((star) => {
                const value = star
                const isActive = hoverValue !== null ? value <= hoverValue : value <= (userRating || 0)
                return (
                  <button
                    key={star}
                    onClick={() => handleRatingSubmit(value)}
                    onMouseEnter={() => setHoverValue(value)}
                    disabled={isSubmitting}
                    className={`transition-colors ${
                      isActive ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={`${value}.0 sao`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                )
              })}
            </div>
            {userRating && (
              <span className="text-xs text-gray-500">({userRating.toFixed(1)} sao của bạn)</span>
            )}
          </div>
        )}
      </div>
    </>
  )
}

