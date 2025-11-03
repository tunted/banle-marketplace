'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import LoginPrompt from './LoginPrompt'

interface SavePostButtonProps {
  postId: string
}

export default function SavePostButton({ postId }: SavePostButtonProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // Check auth status
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function checkSavedStatus() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setIsSaved(false)
          setLoading(false)
          return
        }

        // Use maybeSingle() instead of single() to handle case where no row exists
        // This prevents 406 errors when no saved post is found
        const { data, error } = await supabase
          .from('saved_posts')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .maybeSingle()

        if (error) {
          // Handle various error codes
          // Check if status exists (some error types may have it)
          const errorStatus = (error as any).status as number | undefined
          if (
            error.code === 'PGRST116' || 
            error.code === '42P01' || // Table doesn't exist
            error.message?.includes('No rows') ||
            error.message?.includes('Not Acceptable') ||
            errorStatus === 406
          ) {
            // No rows found or query format issue - post is not saved (this is fine)
            setIsSaved(false)
          } else {
            // Log unexpected errors but don't block UI
            console.warn('Error checking saved status:', error.code, error.message)
            setIsSaved(false)
          }
        } else {
          setIsSaved(!!data)
        }
      } catch (err: any) {
        // Catch network errors and other exceptions
        console.warn('Error checking saved status:', err?.message || err)
        setIsSaved(false)
      } finally {
        setLoading(false)
      }
    }

    checkSavedStatus()
  }, [postId])

  const handleToggleSave = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setShowLoginPrompt(true)
        return
      }

      setSaving(true)

      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId)

        if (error) {
          console.error('Error unsaving post:', error)
          // Check if it's a permission/RLS error
          // Check if status exists (some error types may have it)
          const errorStatus = (error as any).status as number | undefined
          if (error.code === '42501' || errorStatus === 403 || errorStatus === 406) {
            alert('Không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.')
          } else {
            alert('Không thể bỏ lưu. Vui lòng thử lại.')
          }
        } else {
          setIsSaved(false)
        }
      } else {
        // Save - insert new saved post
        const { error } = await supabase.from('saved_posts').insert({
          user_id: user.id,
          post_id: postId,
        })

        if (error) {
          console.error('Error saving post:', error)
          // Check if it's a duplicate or permission error
          // Check if status exists (some error types may have it)
          const errorStatus = (error as any).status as number | undefined
          if (error.code === '23505') {
            // Unique constraint violation - already saved (shouldn't happen due to state, but handle gracefully)
            setIsSaved(true)
          } else if (error.code === '42501' || errorStatus === 403 || errorStatus === 406) {
            alert('Không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.')
          } else {
            alert('Không thể lưu bài đăng. Vui lòng thử lại.')
          }
        } else {
          setIsSaved(true)
        }
      }
    } catch (err) {
      console.error('Error toggling save:', err)
      alert('Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
      >
        <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span>Đang tải...</span>
      </button>
    )
  }

  return (
    <>
      {showLoginPrompt && (
        <LoginPrompt
          message="Vui lòng đăng nhập để lưu bài đăng"
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
      <button
        onClick={handleToggleSave}
        disabled={saving}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isSaved
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
      <svg
        className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`}
        fill={isSaved ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{isSaved ? 'Đã lưu' : 'Lưu bài đăng'}</span>
    </button>
    </>
  )
}

