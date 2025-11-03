'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getCategoryImageUrl, type Category } from '@/lib/categoryImage'

interface CategoryImageProps {
  /** Category object with image_url */
  category?: Category | null
  /** Or directly provide image path */
  imagePath?: string | null
  /** Alt text for the image (defaults to category.name if available) */
  alt?: string
  /** Bucket name (default: 'categories') */
  bucket?: string
  /** Priority loading for above-the-fold images */
  priority?: boolean
  /** Additional CSS classes */
  className?: string
  /** Fill mode for responsive images */
  fill?: boolean
  /** Width for fixed-size images */
  width?: number
  /** Height for fixed-size images */
  height?: number
  /** Image sizes attribute for responsive images */
  sizes?: string
  /** Fallback component when image fails to load */
  fallback?: React.ReactNode
  /** Callback when image fails to load */
  onError?: () => void
}

/**
 * Reusable component for displaying category images from Supabase Storage
 * 
 * @example
 * ```tsx
 * <CategoryImage 
 *   category={category} 
 *   alt={category.name}
 *   fill
 *   priority
 * />
 * ```
 * 
 * @example
 * ```tsx
 * <CategoryImage 
 *   imagePath="categories/photos/fashion.png"
 *   alt="Fashion"
 *   width={200}
 *   height={150}
 * />
 * ```
 */
export default function CategoryImage({
  category,
  imagePath,
  alt,
  bucket = 'categories',
  priority = false,
  className = '',
  fill = false,
  width,
  height,
  sizes,
  fallback,
  onError,
}: CategoryImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  // Determine the image path from category or direct prop
  const resolvedImagePath = imagePath || category?.image_url

  // Determine alt text
  const resolvedAlt = alt || category?.name || 'Category image'

  useEffect(() => {
    if (!resolvedImagePath) {
      setImageSrc(null)
      setImageError(false)
      return
    }

    // Get public URL from Supabase Storage
    const publicUrl = getCategoryImageUrl(resolvedImagePath, bucket)
    
    if (publicUrl) {
      setImageSrc(publicUrl)
      setImageError(false)
    } else {
      setImageSrc(null)
      setImageError(true)
    }
  }, [resolvedImagePath, bucket])

  // Handle image load error
  const handleImageError = () => {
    setImageError(true)
    onError?.()
  }

  // Show fallback if no image or error
  if (imageError || !imageSrc) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Default fallback: gradient background
    return (
      <div 
        className={`bg-gradient-to-br from-gray-400 to-gray-600 ${fill ? 'absolute inset-0' : ''} ${className}`}
        style={!fill && width && height ? { width, height } : undefined}
        aria-label={resolvedAlt}
      />
    )
  }

  // Render image with Next.js Image component
  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={resolvedAlt}
        fill
        className={className}
        sizes={sizes || '(max-width: 640px) 25vw, 12.5vw'}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        unoptimized={imageSrc.includes('supabase.co/storage')}
        onError={handleImageError}
      />
    )
  }

  // Fixed size image
  if (width && height) {
    return (
      <Image
        src={imageSrc}
        alt={resolvedAlt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        unoptimized={imageSrc.includes('supabase.co/storage')}
        onError={handleImageError}
      />
    )
  }

  // Fallback to regular img tag if dimensions not specified and fill is false
  return (
    <img
      src={imageSrc}
      alt={resolvedAlt}
      className={className}
      onError={handleImageError}
      loading={priority ? 'eager' : 'lazy'}
    />
  )
}

