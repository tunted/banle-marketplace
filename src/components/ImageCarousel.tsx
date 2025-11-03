'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { getPostImageUrl } from '@/lib/utils'

interface ImageCarouselProps {
  images: string[] // Array of public URLs or storage paths
  title: string
}

export default function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Convert image paths to public URLs
  // Input can be: public URLs (http/https), relative paths (/), or storage paths from database
  const imageUrls = useMemo(() => {
    return images
      .map((img) => {
        if (!img) return null
        
        // If already a full URL, return as-is
        if (img.startsWith('http://') || img.startsWith('https://')) {
          return img
        }
        
        // If relative path starting with /, return as-is (public asset)
        if (img.startsWith('/')) {
          return img
        }
        
        // Otherwise, treat as storage path from database and convert to public URL
        // Uses the exact path stored in the database without path manipulation
        return getPostImageUrl(img)
      })
      .filter((url): url is string => url !== null && url !== '')
  }, [images])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1))
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

  if (imageUrls.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
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
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden group">
        {imageUrls[currentIndex] ? (
          <Image
            src={imageUrls[currentIndex]}
            alt={`${title} - Image ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority={currentIndex === 0}
            loading={currentIndex === 0 ? 'eager' : 'lazy'}
            unoptimized={imageUrls[currentIndex].startsWith('http') && imageUrls[currentIndex].includes('supabase.co')}
            onError={(e) => {
              // Hide broken image and show SVG fallback
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
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
          </div>
        )}

        {/* Image Counter */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white text-sm font-medium px-3 py-1 rounded-full">
          {currentIndex + 1} / {imageUrls.length}
        </div>

        {/* Navigation Arrows */}
        {imageUrls.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-opacity opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
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
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-opacity opacity-0 group-hover:opacity-100"
              aria-label="Next image"
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
          </>
        )}
      </div>

      {/* Thumbnail Previews */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {imageUrls.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-green-500 ring-2 ring-green-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

