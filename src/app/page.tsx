'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency, getTimeAgo, isNewPost, getPostImageUrl } from '@/lib/utils'
import { useSearchAutocomplete } from '@/hooks/useSearchAutocomplete'

interface Category {
  id: string
  name: string
  image_url: string | null
}

interface Subcategory {
  id: string
  name: string
  category_id: string
}

interface Province {
  code: string
  name: string
}

interface Ward {
  code: string
  name: string
  province_code: string
}

interface Post {
  id: string
  title: string
  price: number
  location: string
  image_url: string | null
  created_at: string
  category_id: string | null
  subcategory_id: string | null
}

async function fetchPosts(
  categoryId?: string | null,
  subcategoryId?: string | null,
  searchQuery?: string,
  province?: string | null,
  district?: string | null
): Promise<Post[]> {
  // Try to fetch with location columns first
  let query = supabase
    .from('posts')
    .select('id, title, price, location, image_url, created_at, category_id, subcategory_id, province, district')
    .order('created_at', { ascending: false })
    .limit(200)

  // Apply filters: if subcategory is selected, filter by both category_id and subcategory_id
  if (subcategoryId && categoryId) {
    query = query.eq('category_id', categoryId).eq('subcategory_id', subcategoryId)
  } else if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  // Apply location filters (only if values are provided)
  // If columns don't exist, the query will error and we'll fall back
  if (province && province.trim()) {
    query = query.eq('province', province.trim())
  }
  if (district && district.trim()) {
    query = query.eq('district', district.trim())
  }

  const { data, error } = await query

  // If error is due to missing columns, fall back to query without location columns
  if (error) {
    const isColumnError = error.message?.includes('column') && 
                         (error.message?.includes('province') || error.message?.includes('district')) &&
                         error.message?.includes('does not exist')
    
    if (isColumnError) {
      console.warn('Location columns (province, district) not found. Falling back to query without location columns.')
      console.warn('Please run add-posts-location-columns.sql in Supabase SQL Editor to enable location filtering.')
      // Retry without location columns
      return fetchPostsWithoutLocation(categoryId, subcategoryId, searchQuery)
    }
    console.error('Error fetching posts:', error)
    return []
  }

  // Apply search filter if needed (client-side for simplicity)
  let filtered = data || []
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.location.toLowerCase().includes(query)
    )
  }

  return filtered
}

// Fallback function if location columns don't exist yet
async function fetchPostsWithoutLocation(
  categoryId?: string | null,
  subcategoryId?: string | null,
  searchQuery?: string
): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('id, title, price, location, image_url, created_at, category_id, subcategory_id')
    .order('created_at', { ascending: false })
    .limit(200)

  // Apply filters: if subcategory is selected, filter by both category_id and subcategory_id
  if (subcategoryId && categoryId) {
    query = query.eq('category_id', categoryId).eq('subcategory_id', subcategoryId)
  } else if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  // Apply search filter if needed (client-side for simplicity)
  let filtered = data || []
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.location.toLowerCase().includes(query)
    )
  }

  return filtered
}

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get initial state from URL params
  const urlCategory = searchParams.get('category') || ''
  const urlSubcategory = searchParams.get('subcategory') || ''
  const urlQuery = searchParams.get('q') || ''
  const urlProvince = searchParams.get('province') || ''
  const urlDistrict = searchParams.get('district') || ''

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [postsLoaded, setPostsLoaded] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(urlCategory)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>(urlSubcategory)
  const [searchQuery, setSearchQuery] = useState<string>(urlQuery)
  const [showSubcategories, setShowSubcategories] = useState<boolean>(!!urlCategory && !urlSubcategory)
  const [currentSubcategoryName, setCurrentSubcategoryName] = useState<string>('')
  
  // Location filter state
  const [provinces, setProvinces] = useState<Province[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [selectedProvince, setSelectedProvince] = useState<string>(urlProvince)
  const [selectedDistrict, setSelectedDistrict] = useState<string>(urlDistrict)
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)

  const searchAutocomplete = useSearchAutocomplete()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Determine if we're in filtered view (subcategory selected)
  const isFilteredView = !!selectedSubcategoryId

  // Load provinces on mount
  useEffect(() => {
    async function loadProvinces() {
      setLoadingProvinces(true)
      try {
        const { data, error } = await supabase
          .from('provinces')
          .select('code, name')
          .order('name')

        if (error) {
          console.error('Error fetching provinces:', error)
        } else {
          setProvinces(data || [])
        }
      } catch (err) {
        console.error('Error loading provinces:', err)
      } finally {
        setLoadingProvinces(false)
      }
    }
    loadProvinces()
  }, [])

  // Load wards when province is selected
  useEffect(() => {
    async function loadWards() {
      if (!selectedProvince) {
        setWards([])
        // Only reset district if province is being cleared (not on initial load with URL param)
        if (!urlProvince) {
          setSelectedDistrict('')
        }
        return
      }

      setLoadingWards(true)
      try {
        const { data, error } = await supabase
          .from('wards')
          .select('code, name, province_code')
          .eq('province_code', selectedProvince)
          .order('name')

        if (error) {
          console.error('Error fetching wards:', error)
          setWards([])
        } else {
          setWards(data || [])
          // Only reset district when province changes (not on initial load with URL param)
          // If district from URL is valid, keep it
          if (!urlDistrict || !data?.some(w => w.code === urlDistrict)) {
            setSelectedDistrict('')
          }
        }
      } catch (err) {
        console.error('Error loading wards:', err)
        setWards([])
      } finally {
        setLoadingWards(false)
      }
    }
    loadWards()
  }, [selectedProvince, urlProvince, urlDistrict])

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedCategoryId && !selectedSubcategoryId) params.set('category', selectedCategoryId)
    if (selectedSubcategoryId) {
      params.set('category', selectedCategoryId)
      params.set('subcategory', selectedSubcategoryId)
    }
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (selectedProvince) params.set('province', selectedProvince)
    if (selectedDistrict) params.set('district', selectedDistrict)

    const queryString = params.toString()
    const newUrl = queryString ? `/?${queryString}` : '/'
    
    // Only update URL if it's different to avoid infinite loops
    if (window.location.search !== `?${queryString}`) {
      router.replace(newUrl, { scroll: false })
    }
  }, [selectedCategoryId, selectedSubcategoryId, searchQuery, selectedProvince, selectedDistrict, router])

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, image_url')
          .order('name')

        if (error) {
          console.error('Error fetching categories:', error)
          setCategories([])
        } else {
          setCategories(data || [])
        }
      } catch (err) {
        console.error('Error loading categories:', err)
        setCategories([])
      }
    }
    loadCategories()
  }, [])

  // Load subcategories when category is selected (but not in filtered view)
  useEffect(() => {
    async function loadSubcategories() {
      if (!selectedCategoryId || isFilteredView) {
        setSubcategories([])
        setShowSubcategories(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('subcategories')
          .select('id, name, category_id')
          .eq('category_id', selectedCategoryId)
          .order('name')

        if (error) {
          console.error('Error fetching subcategories:', error)
          setSubcategories([])
        } else {
          setSubcategories(data || [])
          setShowSubcategories(true)
        }
      } catch (err) {
        console.error('Error loading subcategories:', err)
        setSubcategories([])
      }
    }

    loadSubcategories()
  }, [selectedCategoryId, isFilteredView])

  // Load posts when filters change
  useEffect(() => {
    async function loadPosts() {
      setLoading(true)
      setPostsLoaded(false)
      // When subcategory is selected, we need both categoryId and subcategoryId
      const activeCategoryId = selectedSubcategoryId ? selectedCategoryId : (selectedCategoryId || null)
      const activeSubcategoryId = selectedSubcategoryId || null
      
      // Get province and district names from selected codes
      const selectedProvinceName = provinces.find(p => p.code === selectedProvince)?.name || null
      const selectedDistrictName = wards.find(w => w.code === selectedDistrict)?.name || null
      
      const data = await fetchPosts(
        activeCategoryId, 
        activeSubcategoryId, 
        searchQuery,
        selectedProvinceName,
        selectedDistrictName
      )
      setPosts(data)
      setLoading(false)
      // Trigger fade-in animation
      setTimeout(() => setPostsLoaded(true), 50)
    }
    loadPosts()
  }, [selectedCategoryId, selectedSubcategoryId, searchQuery, selectedProvince, selectedDistrict, provinces, wards])

  // Handle category click
  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategoryId === categoryId && !selectedSubcategoryId) {
      // Deselect if already selected
      setSelectedCategoryId('')
      setSelectedSubcategoryId('')
      setShowSubcategories(false)
    } else {
      setSelectedCategoryId(categoryId)
      setSelectedSubcategoryId('') // Clear subcategory when changing category
    }
  }

  // Handle subcategory click
  const handleSubcategoryClick = (subcategoryId: string) => {
    setSelectedSubcategoryId(subcategoryId)
    // Hide categories and subcategories when entering filtered view
  }

  // Handle search input with autocomplete
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    searchAutocomplete.updateSearch(value)
  }

  // Handle suggestion click
  const handleSuggestionClick = (subcategory: Subcategory) => {
    setSelectedCategoryId(subcategory.category_id)
    setSelectedSubcategoryId(subcategory.id)
    setSearchQuery('')
    searchAutocomplete.clearSuggestions()
    if (searchInputRef.current) {
      searchInputRef.current.blur()
    }
  }

  // Get category and subcategory names for pills
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const selectedSubcategory = subcategories.find((s) => s.id === selectedSubcategoryId) || 
    (selectedSubcategoryId ? subcategories.find((s) => s.id === selectedSubcategoryId) : null)

  // Load subcategory name when in filtered view
  useEffect(() => {
    async function loadSubcategoryName() {
      if (selectedSubcategoryId) {
        try {
          const { data } = await supabase
            .from('subcategories')
            .select('id, name, category_id')
            .eq('id', selectedSubcategoryId)
            .single()
          if (data) {
            setCurrentSubcategoryName(data.name)
            if (!selectedSubcategory) {
              setSubcategories([data])
            }
          }
        } catch (err) {
          console.error('Error loading subcategory:', err)
        }
      } else {
        setCurrentSubcategoryName('')
      }
    }
    loadSubcategoryName()
  }, [selectedSubcategoryId, selectedSubcategory])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        searchInputRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        searchAutocomplete.clearSuggestions()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [searchAutocomplete])

  const handleRemoveSubcategoryFilter = () => {
    setSelectedSubcategoryId('')
    setSelectedCategoryId('')
    setSelectedProvince('')
    setSelectedDistrict('')
    // Return to full homepage view
  }

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvince(e.target.value)
    setSelectedDistrict('') // Reset district when province changes
  }

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDistrict(e.target.value)
  }

  // Get current subcategory name for filtered view
  const displaySubcategoryName = currentSubcategoryName || selectedSubcategory?.name || ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar with Autocomplete - Always visible */}
        <div className="sticky top-20 z-40 bg-white/90 backdrop-blur-sm rounded-2xl p-4 mb-8 -mt-4 shadow-lg">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              searchAutocomplete.clearSuggestions()
            }}
            className="relative"
          >
            <div className="flex gap-4 items-start">
              {/* In filtered view: show pill to the left of search input */}
              {isFilteredView && displaySubcategoryName && (
                <div className="flex items-center flex-shrink-0">
                  <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                    <span className="text-sm font-medium text-gray-700">
                      {displaySubcategoryName}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveSubcategoryFilter}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label="Xóa bộ lọc"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Search Input with Autocomplete */}
              <div className="flex-1 relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Tìm kiếm..."
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
                
                {/* Autocomplete Suggestions */}
                {searchAutocomplete.suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {searchAutocomplete.suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                      >
                        {suggestion.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          {/* Location Filters - Compact, directly below search bar */}
          {isFilteredView && (
            <div className="flex items-center gap-2 mt-2">
              {/* Province Dropdown */}
              <select
                id="province-filter"
                value={selectedProvince}
                onChange={handleProvinceChange}
                disabled={loadingProvinces}
                className="flex-1 h-9 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundImage: 'none' }}
                title="Tỉnh/Thành phố"
              >
                <option value="">
                  {loadingProvinces ? 'Đang tải...' : 'Tất cả tỉnh/thành'}
                </option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.code}>
                    {province.name}
                  </option>
                ))}
              </select>

              {/* District Dropdown */}
              <select
                id="district-filter"
                value={selectedDistrict}
                onChange={handleDistrictChange}
                disabled={!selectedProvince || loadingWards}
                className="flex-1 h-9 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white disabled:bg-gray-50 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundImage: 'none' }}
                title="Quận/Huyện"
              >
                <option value="">
                  {!selectedProvince
                    ? 'Chọn tỉnh trước'
                    : loadingWards
                    ? 'Đang tải...'
                    : 'Tất cả quận/huyện'}
                </option>
                {wards.map((ward) => (
                  <option key={ward.code} value={ward.code}>
                    {ward.name}
                  </option>
                ))}
              </select>

              {/* Clear Location Filters Button */}
              {(selectedProvince || selectedDistrict) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProvince('')
                    setSelectedDistrict('')
                  }}
                  className="h-9 px-3 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium whitespace-nowrap flex-shrink-0"
                  title="Xóa bộ lọc"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Categories Horizontal Scrollable List - Hide in filtered view */}
        {!isFilteredView && (
          <div className="mb-8">
            <div 
              className="flex gap-x-6 overflow-x-auto pb-4 hide-scrollbar transition-opacity duration-300"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map((category) => {
                const isSelected = selectedCategoryId === category.id
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`flex-shrink-0 flex flex-col items-center transition-transform hover:scale-[1.02] min-w-[120px] ${
                      isSelected ? 'ring-2 ring-green-500 rounded-xl p-1' : ''
                    }`}
                  >
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center aspect-square mb-2">
                      {category.image_url ? (
                        <Image
                          src={category.image_url}
                          alt={category.name}
                          width={112}
                          height={112}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300" />
                      )}
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 text-center w-24 sm:w-28 leading-tight line-clamp-2 px-1">
                      {category.name}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Subcategories Vertical List - Hide in filtered view, no heading */}
        {!isFilteredView && showSubcategories && subcategories.length > 0 && (
          <div className="mb-8 bg-white rounded-xl p-4 shadow-sm transition-opacity duration-300">
            <div className="flex flex-col gap-2">
              {subcategories.map((subcategory) => {
                const isSelected = selectedSubcategoryId === subcategory.id
                return (
                  <button
                    key={subcategory.id}
                    onClick={() => handleSubcategoryClick(subcategory.id)}
                    className={`text-left px-4 py-2 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-green-100 text-green-900 font-semibold'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {subcategory.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Posts Grid */}
        <div 
          className={`transition-opacity duration-300 ${postsLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          {loading ? (
            <div className="text-center py-16">
              <p className="text-gray-500">Đang tải...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">
                {isFilteredView 
                  ? 'Chưa có bài đăng'
                  : searchQuery || selectedCategoryId || selectedSubcategoryId
                  ? 'Không tìm thấy kết quả phù hợp'
                  : 'Chưa có tin đăng nào. Hãy đăng tin đầu tiên!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => {
                const imageUrl = getPostImageUrl(post.image_url)
                const isNew = isNewPost(post.created_at)
                const isPriority = index < 6

                return (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="bg-white rounded-2xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 shadow-sm hover:shadow-md"
                  >
                    <div className="aspect-[4/3] relative bg-gray-100 flex items-center justify-center overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          priority={isPriority}
                          loading={isPriority ? 'eager' : 'lazy'}
                          unoptimized={imageUrl.startsWith('http') && imageUrl.includes('supabase.co')}
                          onError={(e) => {
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
                        {post.title}
                      </h3>
                      <p className="text-red-600 font-bold text-lg mb-2">
                        {formatCurrency(post.price)}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-gray-500 text-sm truncate">{post.location}</p>
                        <p className="text-gray-500 text-sm ml-2 flex-shrink-0">
                          {getTimeAgo(post.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
