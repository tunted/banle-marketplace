'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import CategoryImage from './CategoryImage'
import type { Category } from '@/lib/categoryImage'

interface CategoryCarouselProps {
  selectedCategory?: string
  onCategorySelect?: (slug: string) => void
}

export default function CategoryCarousel({ selectedCategory = '', onCategorySelect }: CategoryCarouselProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        // Fetch all categories without any filters
        let query = supabase
          .from('categories')
          .select('id, name, image_url, slug, sort_order')

        const { data, error } = await query

        if (error) {
          console.error('Error fetching categories:', error)
          console.error('Error details:', JSON.stringify(error, null, 2))
          setCategories([])
        } else {
          // Sort categories: first by sort_order (nulls last), then by name
          const sortedCategories = (data || []).sort((a, b) => {
            // If both have sort_order, sort by it
            if (a.sort_order !== null && b.sort_order !== null) {
              return a.sort_order - b.sort_order
            }
            // If only a has sort_order, it comes first
            if (a.sort_order !== null && b.sort_order === null) {
              return -1
            }
            // If only b has sort_order, it comes first
            if (a.sort_order === null && b.sort_order !== null) {
              return 1
            }
            // If both are null, sort by name
            return a.name.localeCompare(b.name)
          })
          
          setCategories(sortedCategories)
        }
      } catch (err) {
        console.error('Error loading categories:', err)
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollAmount = container.clientWidth * 0.8 // Scroll ~80% of visible width
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    })
  }

  const canScrollLeft = () => {
    if (!scrollContainerRef.current) return false
    return scrollContainerRef.current.scrollLeft > 0
  }

  const canScrollRight = () => {
    if (!scrollContainerRef.current) return false
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    return scrollLeft < scrollWidth - clientWidth - 1
  }

  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const updateArrows = () => {
      setShowLeftArrow(canScrollLeft())
      setShowRightArrow(canScrollRight())
    }

    updateArrows()
    container.addEventListener('scroll', updateArrows)
    window.addEventListener('resize', updateArrows)

    return () => {
      container.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [categories])

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[calc((25%-0.5rem)/2)] sm:w-[calc((25%-1.5rem)/4)] aspect-[3/2] bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (categories.length === 0 && !loading) {
    return (
      <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
        <p className="text-yellow-800 text-sm">
          <strong>Không có danh mục nào.</strong> Vui lòng thêm danh mục vào bảng <code>categories</code> trong Supabase.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-8 relative">
      <div className="relative">
        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none', 
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch'
          }}
        >
          {categories.map((category, index) => {
            const isSelected = selectedCategory === category.slug
            return (
              <button
                key={category.id || `category-${index}`}
                onClick={() => onCategorySelect?.(isSelected ? '' : category.slug)}
                className={`flex-shrink-0 w-[calc((25%-0.5rem)/2)] sm:w-[calc((25%-1.5rem)/4)] aspect-[3/2] relative rounded-xl overflow-hidden transition-all duration-300 group card-3d ${
                  isSelected ? 'ring-2 ring-green-500 ring-offset-2' : ''
                }`}
                style={{ 
                  minWidth: 'calc((25% - 0.5rem) / 2)', 
                  flexShrink: 0,
                  boxShadow: isSelected 
                    ? '0 10px 30px -5px rgba(34, 197, 94, 0.4), 0 4px 15px -5px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    : '0 4px 15px -5px rgba(0, 0, 0, 0.15), 0 2px 8px -5px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
              >
              {/* Background Image or Fallback */}
              <CategoryImage 
                category={category}
                alt={category.name}
                priority={index < 4}
                fill
                className="object-cover z-0"
                sizes="(max-width: 640px) 25vw, 12.5vw"
                fallback={
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 z-0" />
                }
              />

              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

              {/* Category Name */}
              <div className="absolute inset-0 flex items-center justify-center p-1.5">
                <h3 className="text-white font-bold text-xs sm:text-sm text-center drop-shadow-lg">
                  {category.name}
                </h3>
              </div>
            </button>
          )
          })}
        </div>

        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg z-10 transition-opacity"
            aria-label="Scroll left"
          >
            <svg
              className="w-6 h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg z-10 transition-opacity"
            aria-label="Scroll right"
          >
            <svg
              className="w-6 h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

