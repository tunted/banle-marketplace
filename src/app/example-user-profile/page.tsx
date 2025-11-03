'use client'

import { useState } from 'react'
import UserProfileFetcher, { useUserProfile } from '@/components/UserProfileFetcher'

/**
 * Example page demonstrating correct Supabase user profile fetching
 * 
 * This shows:
 * 1. Component-based fetching with loading/error states
 * 2. Hook-based fetching for custom implementations
 * 3. Proper use of @supabase/supabase-js client (not raw fetch)
 */
export default function ExampleUserProfilePage() {
  const [userId, setUserId] = useState('53f23cd0-bf68-47fe-9b05-3049c12c8509')
  const [useComponent, setUseComponent] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            User Profile Fetching Example
          </h1>
          
          <p className="text-sm text-gray-600 mb-4">
            This page demonstrates the correct way to fetch user profiles using the Supabase client.
            The client automatically handles authentication headers and RLS policies.
          </p>

          {/* User ID Input */}
          <div className="mb-6">
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter user ID"
            />
          </div>

          {/* Toggle between component and hook */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useComponent}
                onChange={(e) => setUseComponent(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">
                Use Component (uncheck to see Hook example)
              </span>
            </label>
          </div>

          {/* Demo Section */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {useComponent ? 'Component Example' : 'Hook Example'}
            </h2>

            {useComponent ? (
              <UserProfileFetcher 
                userId={userId} 
                onProfileLoaded={(profile) => {
                  console.log('Profile loaded:', profile)
                }}
              />
            ) : (
              <HookExample userId={userId} />
            )}
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-gray-900 rounded-lg p-6 text-sm overflow-x-auto">
          <pre className="text-green-400">
{`// ✅ CORRECT: Using Supabase client
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('user_profiles')
  .select('id, full_name, avatar_url')
  .eq('id', userId)
  .single()

// ❌ WRONG: Raw fetch (causes 406 Not Acceptable)
// fetch('.../user_profiles?id=eq.${userId}', {
//   headers: { 'apikey': '...', 'Authorization': 'Bearer ...' }
// })`}
          </pre>
        </div>
      </div>
    </div>
  )
}

/**
 * Example of using the hook directly in a component
 */
function HookExample({ userId }: { userId: string }) {
  const { profile, loading, error } = useUserProfile(userId)

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

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm font-medium">Error loading profile</p>
        <p className="text-red-500 text-xs mt-1">{error}</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-500 text-sm">User profile not available</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
        <span className="text-white font-semibold text-sm">
          {profile.full_name?.charAt(0).toUpperCase() || 'U'}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">
          {profile.full_name || 'Người dùng'}
        </p>
        <p className="text-xs text-gray-500">ID: {profile.id}</p>
      </div>
    </div>
  )
}

