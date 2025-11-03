'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency, getTimeAgo, getPostImageUrl } from '@/lib/utils'
import { useMemo } from 'react'

export interface PostCardData {
  id: string
  title: string
  price: number
  location?: string | null
  image_url: string | null
  created_at: string
  status?: string | null
}

interface PostCardProps {
  post: PostCardData
  showActions?: boolean
  onDelete?: (postId: string) => void
}

export default function PostCard({ post, showActions = false, onDelete }: PostCardProps) {
  // Get image URL from image_url field
  const firstImageUrl = useMemo(() => {
    if (!post.image_url || !post.id) {
      return null // No placeholder path - will show SVG fallback
    }
    
    // Get public URL from Supabase Storage
    // image_url format: "filename.jpg" (just the filename)
    // getPostImageUrl() reconstructs path as "posts/{postId}/filename.jpg" and generates public URL
    const publicUrl = getPostImageUrl(post.id, post.image_url)
    
    // Return the URL (will be public URL or null for SVG fallback)
    return publicUrl
  }, [post.id, post.image_url])

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/posts/${post.id}`}>
        <div className="aspect-[4/3] relative bg-gray-100 flex items-center justify-center overflow-hidden">
          {firstImageUrl ? (
            <Image
              src={firstImageUrl}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
              unoptimized={firstImageUrl.startsWith('http') && firstImageUrl.includes('supabase.co')}
              onError={(e) => {
                // Hide broken image and show SVG fallback
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/posts/${post.id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] hover:text-green-600 transition-colors">
            {post.title}
          </h3>
        </Link>
        <p className="text-red-600 font-bold text-lg mb-2">
          {formatCurrency(post.price)}
        </p>
        {post.location && (
          <div className="flex items-center justify-between mt-2 mb-3">
            <p className="text-gray-500 text-sm truncate">
              {post.location}
            </p>
            <p className="text-gray-500 text-sm ml-2 flex-shrink-0">
              {getTimeAgo(post.created_at)}
            </p>
          </div>
        )}
        {post.status && (
          <div className="mb-3">
            <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${
              post.status === 'active' 
                ? 'bg-green-100 text-green-700' 
                : post.status === 'sold'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {post.status === 'active' ? 'Đang bán' : 
               post.status === 'sold' ? 'Đã bán' : 
               'Đang chờ'}
            </span>
          </div>
        )}
        {showActions && onDelete && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                // TODO: Navigate to edit page
                console.log('Edit post:', post.id)
              }}
              className="flex-1 bg-gray-100 text-gray-700 font-medium py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Chỉnh sửa
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                if (confirm('Bạn có chắc chắn muốn xóa tin đăng này?')) {
                  onDelete(post.id)
                }
              }}
              className="flex-1 bg-red-100 text-red-600 font-medium py-2 px-3 rounded-lg hover:bg-red-200 transition-colors text-sm"
            >
              Xóa
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

