'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PostCard, { PostCardData } from '@/components/PostCard'

export default function MyPostsPage() {
  const [posts, setPosts] = useState<PostCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadPosts() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error('User error:', userError)
          console.log('User:', user)
          router.push('/login')
          return
        }

        console.log('Loading posts for user ID:', user.id)

        // Fetch user's posts
        const { data, error: postsError } = await supabase
          .from('posts')
          .select('id, title, price, location, image_url, created_at, status, user_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        console.log('Posts query result:', { data, error: postsError })

        if (postsError) {
          console.error('Error fetching posts:', postsError)
          setError(`Không thể tải danh sách tin đăng: ${postsError.message}`)
        } else {
          console.log(`Found ${data?.length || 0} posts for user ${user.id}`)
          
          // Debug: Check if any posts have different user_id
          if (data && data.length > 0) {
            const mismatched = data.filter((post: any) => post.user_id !== user.id)
            if (mismatched.length > 0) {
              console.warn('Found posts with mismatched user_id:', mismatched)
            }
          }
          
          // Also check all posts to see if there are any posts at all
          const { data: allPosts } = await supabase
            .from('posts')
            .select('id, user_id')
            .limit(5)
          
          console.log('Sample of all posts in database:', allPosts)
          
          setPosts(data || [])
        }
      } catch (err: any) {
        console.error('Error loading posts:', err)
        setError(`Đã xảy ra lỗi: ${err.message || 'Unknown error'}. Vui lòng thử lại.`)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [router])

  const handleDelete = async (postId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (deleteError) {
        alert('Không thể xóa tin đăng. Vui lòng thử lại.')
        return
      }

      // Remove from local state
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      console.error('Error deleting post:', err)
      alert('Đã xảy ra lỗi. Vui lòng thử lại.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tin đã đăng</h1>
          <Link
            href="/post"
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all"
          >
            + Đăng tin mới
          </Link>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500 mb-4">Bạn chưa có tin đăng nào.</p>
            <p className="text-xs text-gray-400 mb-4">
              Kiểm tra console để xem thông tin debug (F12)
            </p>
            <Link
              href="/post"
              className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              Đăng tin ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                showActions={true}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

