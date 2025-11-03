'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getAvatarUrl } from '@/lib/utils'

interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface UserMenuProps {
  user: UserProfile | null
  initialSession: boolean
}

export default function UserMenu({ user, initialSession }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isLoggedIn = initialSession
  const [profile, setProfile] = useState<UserProfile | null>(user)
  const [avatarError, setAvatarError] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Initialize profile from props
  useEffect(() => {
    if (user) {
      setProfile(user)
    }
  }, [user])

  // Update profile when user prop changes
  useEffect(() => {
    setProfile(user)
  }, [user])

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
      setIsOpen(false)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const displayName = profile?.full_name || 'Người dùng'
  const avatarUrl = getAvatarUrl(profile?.avatar_url)
  const showAvatar = isLoggedIn && avatarUrl && !avatarError

  // Reset avatar error when profile changes
  useEffect(() => {
    setAvatarError(false)
  }, [profile?.avatar_url])

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar/User Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 overflow-hidden bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm hover:shadow-md ${
          isOpen 
            ? 'border-green-500 ring-2 ring-green-200' 
            : 'border-gray-300 hover:border-green-400'
        }`}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {showAvatar ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={40}
            height={40}
            className="w-full h-full object-cover"
            loading="eager"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 backdrop-blur-sm">
          {!isLoggedIn ? (
            <>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 group"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Đăng nhập</span>
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 group"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-12-4a2 2 0 100 4 2 2 0 010-4zm0 0V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v2M7 21h10a2 2 0 002-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Đăng ký</span>
              </Link>
            </>
          ) : (
            <>
              {/* User Header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                    {showAvatar ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {displayName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 group mx-2 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Trang cá nhân</span>
                  <svg className="w-4 h-4 text-gray-300 ml-auto group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/my-posts"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 group mx-2 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Tin đã đăng</span>
                  <svg className="w-4 h-4 text-gray-300 ml-auto group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 my-2" />

              {/* Logout */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 w-full text-left mx-2 rounded-lg group"
              >
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

