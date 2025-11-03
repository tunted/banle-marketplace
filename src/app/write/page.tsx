'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

/**
 * Redirect /write to /post (the actual post creation page)
 * This maintains the route name convention while using the existing /post route
 */
export default function WritePage() {
  const router = useRouter()
  const { user, initialized } = useAuth()

  useEffect(() => {
    // Redirect to /post (the actual post creation page)
    router.replace('/post')
  }, [router])

  // Optional: Show a loading state while redirecting
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // If user is not logged in, redirect will happen and /post will handle auth check
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>
  )
}

