'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getTimeAgo } from '@/lib/utils'

interface Listing {
  id: string
  title: string
  price: number
  location: string
  images: string[] | null
  created_at: string
  status?: string
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadListings() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/login')
          return
        }

        // Fetch user's listings
        const { data, error: listingsError } = await supabase
          .from('listings')
          .select('id, title, price, location, images, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (listingsError) {
          console.error('Error fetching listings:', listingsError)
          setError('Không thể tải danh sách tin đăng.')
        } else {
          setListings(data || [])
        }
      } catch (err: any) {
        console.error('Error loading listings:', err)
        setError('Đã xảy ra lỗi. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }

    loadListings()
  }, [router])

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

        {listings.length === 0 ? (
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
            <Link
              href="/post"
              className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              Đăng tin ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => {
              // Parse images array - handle both array and string formats
              let imagesArray: string[] = []
              if (listing.images) {
                if (Array.isArray(listing.images)) {
                  imagesArray = listing.images
                } else if (typeof listing.images === 'string') {
                  try {
                    // Try to parse as JSON string
                    const parsed = JSON.parse(listing.images)
                    if (Array.isArray(parsed)) {
                      imagesArray = parsed
                    }
                  } catch {
                    // If not valid JSON, ignore
                    imagesArray = []
                  }
                }
              }

              // Get first valid image URL
              const firstImage = imagesArray.find((img) => {
                if (!img || typeof img !== 'string') return false
                // Must be a valid absolute URL (http/https) or relative path starting with /
                return (
                  img.startsWith('http://') ||
                  img.startsWith('https://') ||
                  img.startsWith('/')
                )
              }) || null

              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <Link href={`/listing/${listing.id}`}>
                    <div className="aspect-[4/3] relative bg-gray-100 flex items-center justify-center">
                      {firstImage ? (
                        <Image
                          src={firstImage}
                          alt={listing.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                          onError={(e) => {
                            // Hide image on error and show placeholder
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <svg
                          className="w-12 h-12 text-gray-400"
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
                    <Link href={`/listing/${listing.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] hover:text-green-600 transition-colors">
                        {listing.title}
                      </h3>
                    </Link>
                    <p className="text-red-600 font-bold text-lg mb-2">
                      {formatCurrency(listing.price)}
                    </p>
                    <div className="flex items-center justify-between mt-2 mb-3">
                      <p className="text-gray-500 text-sm truncate">
                        {listing.location}
                      </p>
                      <p className="text-gray-500 text-sm ml-2 flex-shrink-0">
                        {getTimeAgo(listing.created_at)}
                      </p>
                    </div>
                    {listing.status && (
                      <div className="mb-3">
                        <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${
                          listing.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : listing.status === 'sold'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {listing.status === 'active' ? 'Đang bán' : 
                           listing.status === 'sold' ? 'Đã bán' : 
                           'Đang chờ'}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // TODO: Navigate to edit page
                          console.log('Edit listing:', listing.id)
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 font-medium py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Bạn có chắc chắn muốn xóa tin đăng này?')) {
                            return
                          }
                          
                          try {
                            const { error: deleteError } = await supabase
                              .from('listings')
                              .delete()
                              .eq('id', listing.id)

                            if (deleteError) {
                              alert('Không thể xóa tin đăng. Vui lòng thử lại.')
                              return
                            }

                            // Remove from local state
                            setListings((prev) => prev.filter((l) => l.id !== listing.id))
                          } catch (err) {
                            console.error('Error deleting listing:', err)
                            alert('Đã xảy ra lỗi. Vui lòng thử lại.')
                          }
                        }}
                        className="flex-1 bg-red-100 text-red-600 font-medium py-2 px-3 rounded-lg hover:bg-red-200 transition-colors text-sm"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

