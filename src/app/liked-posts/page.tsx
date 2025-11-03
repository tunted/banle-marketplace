'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LikedPostsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to saved-posts
    router.replace('/saved-posts')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500">Đang chuyển hướng...</p>
      </div>
    </div>
  )
}

