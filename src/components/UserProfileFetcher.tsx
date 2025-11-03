'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface UserProfileFetcherProps {
  userId: string
  onProfileLoaded?: (profile: UserProfile | null) => void
}

/**
 * Component that fetches a user profile using Supabase client
 * Properly handles loading and error states
 * RLS-friendly: uses Supabase client which automatically includes auth headers
 */
export default function UserProfileFetcher({ userId, onProfileLoaded }: UserProfileFetcherProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      if (!userId) {
        setError('User ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Use Supabase client - automatically handles:
        // - Correct API endpoint
        // - Authentication headers (from session)
        // - RLS policies
        // - Proper Content-Type headers
        const { data, error: fetchError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .eq('id', userId)
          .single()

        if (fetchError) {
          // Handle specific error cases
          if (fetchError.code === 'PGRST116' || fetchError.message.includes('No rows')) {
            // Profile doesn't exist
            setError('User profile not found')
            setProfile(null)
            onProfileLoaded?.(null)
          } else {
            // Other errors (RLS, network, etc.)
            console.error('Error fetching user profile:', fetchError)
            setError(`Failed to load profile: ${fetchError.message}`)
            setProfile(null)
          }
        } else {
          // Success
          setProfile(data)
          onProfileLoaded?.(data)
        }
      } catch (err) {
        // Handle unexpected errors
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        console.error('Unexpected error fetching profile:', err)
        setError(`Unexpected error: ${errorMessage}`)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId, onProfileLoaded])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm font-medium">Error loading profile</p>
        <p className="text-red-500 text-xs mt-1">{error}</p>
      </div>
    )
  }

  // No profile found
  if (!profile) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-500 text-sm">User profile not available</p>
      </div>
    )
  }

  // Success state - render profile
  const displayName = profile.full_name || 'Người dùng'
  const avatarUrl = profile.avatar_url
    ? profile.avatar_url.startsWith('http')
      ? profile.avatar_url
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
    : null

  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <span className="text-white font-semibold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
        <p className="text-xs text-gray-500">ID: {profile.id.slice(0, 8)}...</p>
      </div>
    </div>
  )
}

/**
 * Hook version for fetching user profile in other components
 */
export function useUserProfile(userId: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      if (!userId) {
        setProfile(null)
        setLoading(false)
        setError(null)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .eq('id', userId)
          .single()

        if (fetchError) {
          if (fetchError.code === 'PGRST116' || fetchError.message.includes('No rows')) {
            setError('User profile not found')
            setProfile(null)
          } else {
            console.error('Error fetching user profile:', fetchError)
            setError(fetchError.message)
            setProfile(null)
          }
        } else {
          setProfile(data)
          setError(null)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        console.error('Unexpected error fetching profile:', err)
        setError(errorMessage)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  return { profile, loading, error }
}

