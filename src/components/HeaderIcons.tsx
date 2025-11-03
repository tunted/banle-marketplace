'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface HeaderIconsProps {
  user: { id: string; full_name: string | null; avatar_url: string | null } | null
  isLoggedIn: boolean
}

export default function HeaderIcons({ user, isLoggedIn: initialIsLoggedIn }: HeaderIconsProps) {
  const [notificationCount, setNotificationCount] = useState(0)
  const [likedCount, setLikedCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Load notification count and saved posts count
  useEffect(() => {
    if (!isLoggedIn) return

    async function loadCounts() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Fetch unread notification count
        const { count: notifCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)

        setNotificationCount(notifCount || 0)

        // Fetch saved posts count
        const { count: savedCount } = await supabase
          .from('saved_posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        setLikedCount(savedCount || 0)
      } catch (error) {
        console.error('Error loading counts:', error)
      }
    }

    loadCounts()

    // Subscribe to notification changes
    const notifChannel = supabase
      .channel('notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          loadCounts()
        }
      )
      .subscribe()

    // Subscribe to saved posts changes
    const savedChannel = supabase
      .channel('saved-posts-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_posts',
        },
        () => {
          loadCounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notifChannel)
      supabase.removeChannel(savedChannel)
    }
  }, [isLoggedIn])

  // Verify login status on client side
  useEffect(() => {
    setMounted(true)
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setIsLoggedIn(!!session)
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }
    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [initialIsLoggedIn, user])

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2" style={{ minWidth: 'fit-content' }}>
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse"></div>
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse"></div>
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse"></div>
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse"></div>
      </div>
    )
  }

  // Only show icons when logged in
  if (!isLoggedIn) {
    return null
  }

  return (
    <div 
      className="flex items-center gap-1.5 sm:gap-2" 
      data-testid="header-icons"
    >
      {/* Chat Icon */}
      <Link
        href="/messages"
        className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transform flex-shrink-0"
        title="Tin nhắn"
        style={{ 
          boxShadow: '0 2px 8px 0 rgba(34, 197, 94, 0.3)',
        }}
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </Link>

      {/* Saved Posts Icon */}
      <Link
        href="/saved-posts"
        className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transform flex-shrink-0"
        title="Tin đã lưu"
        style={{ 
          boxShadow: '0 2px 8px 0 rgba(34, 197, 94, 0.3)',
        }}
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        {likedCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
            {likedCount > 99 ? '99+' : likedCount}
          </span>
        )}
      </Link>

      {/* Notifications Icon */}
      <button
        onClick={() => router.push('/notifications')}
        className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transform flex-shrink-0"
        title="Thông báo"
        style={{ 
          boxShadow: '0 2px 8px 0 rgba(34, 197, 94, 0.3)',
        }}
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white animate-pulse">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      {/* My Posts Icon */}
      <Link
        href="/my-posts"
        className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transform flex-shrink-0"
        title="Tin đã đăng"
        style={{ 
          boxShadow: '0 2px 8px 0 rgba(34, 197, 94, 0.3)',
        }}
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </Link>
    </div>
  )
}

