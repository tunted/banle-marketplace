'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency, getTimeAgo, isNewListing } from '@/lib/utils'
import { categories, type Category } from '@/lib/categories'

interface Province {
  code: string
  name: string
}

interface Ward {
  code: string
  name: string
  province_code: string
}

interface Listing {
  id: string
  title: string
  price: number
  location: string
  images: string[] | null
  created_at: string
  category?: string
  province_code?: string
  ward_code?: string
}

async function fetchListings(
  provinceCode?: string | null,
  wardCode?: string | null
): Promise<Listing[]> {
  let query = supabase
    .from('listings')
    .select('id, title, price, location, images, created_at, category, province_code, ward_code')
    .order('created_at', { ascending: false })
    .limit(200)

  // Apply location filters
  if (wardCode) {
    query = query.eq('ward_code', wardCode)
  } else if (provinceCode) {
    query = query.eq('province_code', provinceCode)
  }

  const { data, error } = await query

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
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string | null>(null)
  const [selectedWardCode, setSelectedWardCode] = useState<string | null>(null)
  const [locationName, setLocationName] = useState<string>('Chọn khu vực')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  
  // Location modal state
  const [provinces, setProvinces] = useState<Province[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [modalSelectedProvince, setModalSelectedProvince] = useState<string>('')
  const [modalSelectedWard, setModalSelectedWard] = useState<string>('')
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadListings() {
      setLoading(true)
      const data = await fetchListings(selectedProvinceCode, selectedWardCode)
      setListings(data)
      setLoading(false)
    }
    loadListings()
  }, [selectedProvinceCode, selectedWardCode])

  // Load provinces when modal opens
  useEffect(() => {
    if (isLocationModalOpen) {
      async function loadProvinces() {
        setLoadingProvinces(true)
        setLocationError(null)
        try {
          const { data, error } = await supabase
            .from('provinces')
            .select('code, name')
            .order('name')
          
          if (error) {
            console.error('Error fetching provinces:', error)
            setLocationError('Không thể tải danh sách tỉnh/thành phố. Vui lòng kiểm tra kết nối database.')
            alert('Lỗi: Không thể tải danh sách tỉnh/thành phố. ' + error.message)
          } else {
            setProvinces(data || [])
            if (!data || data.length === 0) {
              setLocationError('Chưa có dữ liệu tỉnh/thành phố. Vui lòng import dữ liệu vào Supabase.')
            }
          }
        } catch (err: any) {
          console.error('Error loading provinces:', err)
          setLocationError('Không thể tải danh sách tỉnh/thành phố. Vui lòng kiểm tra kết nối database.')
          alert('Lỗi: Không thể tải danh sách tỉnh/thành phố. ' + (err?.message || 'Unknown error'))
        } finally {
          setLoadingProvinces(false)
        }
      }
      loadProvinces()
      // Reset modal selections
      setModalSelectedProvince('')
      setModalSelectedWard('')
      setWards([])
    }
  }, [isLocationModalOpen])

  // Load wards when province is selected
  useEffect(() => {
    if (isLocationModalOpen && modalSelectedProvince) {
      async function loadWards() {
        setLoadingWards(true)
        setLocationError(null)
        try {
          const { data, error } = await supabase
            .from('wards')
            .select('code, name, province_code')
            .eq('province_code', modalSelectedProvince)
            .order('name')
          
          if (error) {
            console.error('Error fetching wards:', error)
            setLocationError('Không thể tải danh sách quận/huyện.')
            alert('Lỗi: Không thể tải danh sách quận/huyện. ' + error.message)
          } else {
            setWards(data || [])
            setModalSelectedWard('')
            if (!data || data.length === 0) {
              setLocationError('Chưa có dữ liệu quận/huyện cho tỉnh này.')
            }
          }
        } catch (err: any) {
          console.error('Error loading wards:', err)
          setLocationError('Không thể tải danh sách quận/huyện.')
          alert('Lỗi: Không thể tải danh sách quận/huyện. ' + (err?.message || 'Unknown error'))
        } finally {
          setLoadingWards(false)
        }
      }
      loadWards()
    } else if (isLocationModalOpen && !modalSelectedProvince) {
      setWards([])
      setModalSelectedWard('')
    }
  }, [isLocationModalOpen, modalSelectedProvince])

  // Handle click outside modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsLocationModalOpen(false)
      }
    }

    if (isLocationModalOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isLocationModalOpen])

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      // Category filter
      if (selectedCategory && listing.category !== selectedCategory) {
        return false
      }

      // Location filter is already applied at the database level via province_code/ward_code
      // Additional validation for exact code matching
      if (selectedWardCode && listing.ward_code !== selectedWardCode) {
        return false
      }
      if (selectedProvinceCode && !selectedWardCode && listing.province_code !== selectedProvinceCode) {
        return false
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
  }, [listings, selectedCategory, locationName, searchQuery, selectedProvinceCode, selectedWardCode])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Filtering happens automatically via useMemo
  }

  const handleLocationApply = () => {
    const province = provinces.find((p) => p.code === modalSelectedProvince)
    const ward = wards.find((w) => w.code === modalSelectedWard)

    let newLocationName = 'Chọn khu vực'
    
    if (ward && province) {
      newLocationName = ward.name
    } else if (province) {
      newLocationName = province.name
    }

    setSelectedProvinceCode(modalSelectedProvince || null)
    setSelectedWardCode(modalSelectedWard || null)
    setLocationName(newLocationName)
    setIsLocationModalOpen(false)
  }

  const handleLocationClear = () => {
    setSelectedProvinceCode(null)
    setSelectedWardCode(null)
    setLocationName('Chọn khu vực')
    setIsLocationModalOpen(false)
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

          {/* Location Button */}
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="w-full sm:w-48 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-left hover:bg-gray-50 transition-colors"
            >
              {locationName}
            </button>
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
            {searchQuery || selectedCategory || (locationName && locationName !== 'Chọn khu vực')
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

      {/* Location Filter Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Chọn khu vực</h2>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {locationError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">{locationError}</p>
                </div>
              )}

              {/* Province Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tỉnh/Thành phố
                </label>
                <select
                  value={modalSelectedProvince}
                  onChange={(e) => setModalSelectedProvince(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  disabled={loadingProvinces}
                >
                  <option value="">
                    {loadingProvinces ? 'Đang tải...' : provinces.length === 0 ? 'Chưa có dữ liệu' : 'Chọn tỉnh/thành phố'}
                  </option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ward Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quận/Huyện/Xã
                </label>
                <select
                  value={modalSelectedWard}
                  onChange={(e) => setModalSelectedWard(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white disabled:bg-gray-100"
                  disabled={!modalSelectedProvince || loadingWards}
                >
                  <option value="">
                    {!modalSelectedProvince
                      ? 'Chọn tỉnh/thành phố trước'
                      : loadingWards
                      ? 'Đang tải...'
                      : wards.length === 0
                      ? 'Chưa có dữ liệu'
                      : 'Chọn quận/huyện/xã'}
                  </option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2">
              <button
                onClick={handleLocationApply}
                disabled={loadingProvinces || loadingWards}
                className="w-full py-3 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Áp dụng
              </button>
              <button
                onClick={handleLocationClear}
                className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

