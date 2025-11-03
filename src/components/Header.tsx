'use client'

import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import HeaderIcons from './HeaderIcons'
import UserMenu from './UserMenu'

/**
 * Client-side header component that reacts to auth state changes
 * 
 * Requirements:
 * - When NOT logged in: Show only "Đăng tin" button
 * - When logged in: Show all icons (chat, saved, my posts, notifications) + "Đăng tin" + user menu
 */
export default function Header() {
  const { user, profile, loading, initialized } = useAuth()
  const isLoggedIn = !!user && !!initialized

  // Show loading state during initial hydration to prevent flickering
  if (!initialized || loading) {
    return (
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-[104px] gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Placeholder for buttons during loading */}
              <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-[104px] gap-4">
          {/* Logo placeholder - Logo component will be rendered from layout */}
          <div className="flex-1" />
          
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Header Icons - Only visible when logged in */}
            <HeaderIcons user={profile} isLoggedIn={isLoggedIn} />

            {/* "Đăng tin" button - Always visible */}
            {isLoggedIn ? (
              <Link
                href="/post"
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform whitespace-nowrap text-sm sm:text-base"
                style={{
                  boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.39)',
                }}
              >
                + Đăng tin
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform whitespace-nowrap text-sm sm:text-base"
                style={{
                  boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.39)',
                }}
              >
                + Đăng tin
              </Link>
            )}

            {/* User Menu - Shows login/register when not logged in, user menu when logged in */}
            <UserMenu user={profile} initialSession={isLoggedIn} />
          </div>
        </div>
      </div>
    </header>
  )
}

