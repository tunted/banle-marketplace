'use client'

import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import HeaderIcons from './HeaderIcons'
import UserMenu from './UserMenu'

/**
 * Client-side header wrapper that reacts to auth state changes in real-time
 * This ensures the header updates immediately when user logs in/out
 */
export default function HeaderAuthWrapper({
  initialUser,
  initialSession,
}: {
  initialUser: { id: string; full_name: string | null; avatar_url: string | null } | null
  initialSession: boolean
}) {
  const { user, profile, initialized } = useAuth()
  const isLoggedIn = !!user && initialized

  // Use profile from useAuth if available, otherwise fall back to initialUser
  const displayProfile = profile || (initialUser && isLoggedIn ? initialUser : null)

  return (
    <>
      {/* "Đăng tin" button - Always visible, same UI element */}
      {/* When NOT logged in: redirects to /login */}
      {/* When logged in: redirects to /write (post creation page) */}
      <Link
        href={isLoggedIn ? "/write" : "/login"}
        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform whitespace-nowrap text-sm sm:text-base"
        style={{ 
          boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.39)',
        }}
      >
        Đăng tin
      </Link>

      {/* HeaderIcons - Only visible when logged in (Notifications, Chat, Liked Posts, My Posts) */}
      {isLoggedIn && <HeaderIcons user={displayProfile} isLoggedIn={isLoggedIn} />}
      
      {/* UserMenu - Only show when logged in (Profile dropdown with settings/logout) */}
      {isLoggedIn && <UserMenu user={displayProfile} initialSession={isLoggedIn} />}
    </>
  )
}

