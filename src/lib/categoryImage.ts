import { supabase } from '@/lib/supabase'

/**
 * Category object interface
 */
export interface Category {
  id: string
  name: string
  slug: string
  image_url: string
  sort_order?: number | null
}

/**
 * Get public URL from Supabase Storage for a category image
 * 
 * @param imagePath - Relative path (e.g., 'categories/photos/fashion.png' or 'photos/fashion.png')
 * @param bucket - Bucket name (default: 'categories')
 * @returns Full public URL or null if error
 */
export function getCategoryImageUrl(imagePath: string | null | undefined, bucket: string = 'categories'): string | null {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return null
  }

  // If it's already a full Supabase public URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // Only accept Supabase Storage URLs
    if (imagePath.includes('supabase.co/storage/v1/object/public/')) {
      return imagePath
    }
    // Invalid URL format for Supabase Storage
    console.warn('Invalid URL format (not Supabase Storage):', imagePath)
    return null
  }

  // Normalize the path - remove leading 'categories/' if present
  let normalizedPath = imagePath.trim()
  
  // Remove leading bucket name if present
  if (normalizedPath.startsWith(`${bucket}/`)) {
    normalizedPath = normalizedPath.replace(new RegExp(`^${bucket}/`), '')
  }
  
  // Remove leading slash
  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.substring(1)
  }

  // Validate path is not empty after normalization
  if (!normalizedPath) {
    console.warn('Empty image path after normalization:', imagePath)
    return null
  }

  try {
    // getPublicUrl() is synchronous and always returns data (no error property)
    // It generates a URL even if the file doesn't exist - validation happens at request time
    const { data } = supabase.storage.from(bucket).getPublicUrl(normalizedPath)
    
    if (!data?.publicUrl) {
      console.warn('No public URL returned for path:', normalizedPath)
      return null
    }
    
    return data.publicUrl
  } catch (err) {
    console.error('Unexpected error getting public URL:', err)
    return null
  }
}

/**
 * Get public URL for a category object
 * 
 * @param category - Category object with image_url
 * @param bucket - Bucket name (default: 'categories')
 * @returns Full public URL or null if error
 */
export function getCategoryImageUrlFromCategory(category: Category | null | undefined, bucket: string = 'categories'): string | null {
  if (!category) {
    return null
  }
  
  return getCategoryImageUrl(category.image_url, bucket)
}

