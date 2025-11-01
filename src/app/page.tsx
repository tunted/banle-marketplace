'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency, getTimeAgo, isNewListing } from '@/lib/utils'
import { categories, vietnamLocations, type Category } from '@/lib/categories'

interface Listing {
  id: string
  title: string
  price: number
  location: string
  images: string[] | null
  created_at: string
  category?: string
}

async function fetchListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, price, location, images, created_at, category')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Error fetching listings:', error)
    return []
  }

  return data || []
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    async function loadListings() {
      setLoading(true)
      const data = await fetchListings()
      setListings(data)
      setLoading(false)
    }
    loadListings()
  }, [])

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      // Category filter
      if (selectedCategory && listing.category !== selectedCategory) {
        return false
      }

      // Location filter
      if (selectedLocation && selectedLocation !== 'Chọn khu vực') {
        if (!listing.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
          return false
        }
      }

      // Keyword search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const titleMatch = listing.title.toLowerCase().includes(query)
        const locationMatch = listing.location.toLowerCase().includes(query)
        if (!titleMatch && !locationMatch) {
          return false
        }
      }

      return true
    })
  }, [listings, selectedCategory, selectedLocation, searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Filtering happens automatically via useMemo
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Bar - Sticky Top */}
      <div className="sticky top-16 z-40 bg-white rounded-2xl shadow-md p-4 mb-6 -mt-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          {/* Category Dropdown */}
          <div className="flex-shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-48 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              <option value="">Danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm sản phẩm..."
              className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Location Dropdown */}
          <div className="flex-shrink-0">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full sm:w-48 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              {vietnamLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-500 transition-colors flex-shrink-0"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Category Grid */}
      <div className="mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(selectedCategory === category.slug ? '' : category.slug)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:scale-105 hover:shadow-md ${
                selectedCategory === category.slug
                  ? 'bg-green-50 shadow-md'
                  : 'bg-white shadow-sm'
              }`}
            >
              <span className="text-3xl mb-2">{category.icon}</span>
              <span className="text-xs font-medium text-gray-700 text-center">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">
            {searchQuery || selectedCategory || (selectedLocation && selectedLocation !== 'Chọn khu vực')
              ? 'Không tìm thấy kết quả phù hợp'
              : 'Chưa có tin đăng nào. Hãy đăng tin đầu tiên!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => {
            const firstImage = listing.images && listing.images.length > 0 
              ? listing.images[0] 
              : null
            const isNew = isNewListing(listing.created_at)

            return (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] relative bg-gray-100 flex items-center justify-center">
                  {firstImage ? (
                    <Image
                      src={firstImage}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      loading="lazy"
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
                  {isNew && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Mới
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                    {listing.title}
                  </h3>
                  <p className="text-red-600 font-bold text-lg mb-2">
                    {formatCurrency(listing.price)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-gray-500 text-sm truncate">
                      {listing.location}
                    </p>
                    <p className="text-gray-500 text-sm ml-2 flex-shrink-0">
                      {getTimeAgo(listing.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

