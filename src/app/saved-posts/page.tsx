'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PostCard, { PostCardData } from '@/components/PostCard'

export default function SavedPostsPage() {
  const [posts, setPosts] = useState<PostCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadSavedPosts() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/login')
          return
        }

        // Fetch saved posts with join to posts table
        const { data, error: postsError } = await supabase
          .from('saved_posts')
          .select(`
            id,
            post_id,
            created_at,
            posts (
              id,
              title,
              price,
              location,
              image_url,
              created_at,
              status
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (postsError) {
          console.error('Error fetching saved posts:', postsError)
          setError('Không thể tải danh sách tin đã lưu.')
        } else {
          // Transform the data to match PostCardData format
          const transformedPosts: PostCardData[] = (data || [])
            .filter((item: any) => item.posts) // Filter out any null posts
            .map((item: any) => ({
              id: item.posts.id,
              title: item.posts.title,
              price: item.posts.price,
              location: item.posts.location,
              image_url: item.posts.image_url,
              created_at: item.posts.created_at,
              status: item.posts.status,
            }))
          setPosts(transformedPosts)
        }
      } catch (err: any) {
        console.error('Error loading saved posts:', err)
        setError('Đã xảy ra lỗi. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }

    loadSavedPosts()
  }, [router])

  const handleUnsave = async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error: deleteError } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)

      if (deleteError) {
        alert('Không thể bỏ lưu. Vui lòng thử lại.')
        return
      }

      // Remove from local state
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      console.error('Error unsaving post:', err)
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
          <h1 className="text-2xl font-bold text-gray-900">Tin đã lưu</h1>
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <p className="text-gray-500 mb-4">Bạn chưa lưu tin đăng nào.</p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              Khám phá tin đăng
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {posts.map((post) => (
              <div key={post.id} className="relative group">
                <PostCard post={post} />
                <button
                  onClick={() => handleUnsave(post.id)}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Bỏ lưu"
                >
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

