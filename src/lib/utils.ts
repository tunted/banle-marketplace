import { supabase } from '@/lib/supabase'

/**
 * Format number as Vietnamese currency (e.g., 12500000 -> "12.500.000 đ")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' đ'
}

/**
 * Get public URL from Supabase Storage for posts
 * 
 * This function reconstructs the full storage path and generates a public URL.
 * 
 * Database format: image_url stores only the filename (e.g., "image.jpg")
 * Storage location: posts/{postId}/{filename}
 * 
 * @param postId - The post ID (UUID)
 * @param imageUrl - The filename stored in database (e.g., "image.jpg") or null
 * @returns Public URL string or null if path is invalid
 */
export function getPostImageUrl(postId: string | null | undefined, imageUrl: string | null | undefined): string | null {
  // Handle null/undefined - return null (components will show SVG fallback)
  if (!postId || !imageUrl) {
    return null
  }
  
  // If imageUrl is already a full URL, return it (backward compatibility)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  
  // If it's a relative path starting with /, return as-is (public asset)
  if (imageUrl.startsWith('/')) {
    return imageUrl
  }
  
  // Handle legacy format: "posts/{postId}/filename.jpg" (backward compatibility)
  // Extract filename if it contains path separators
  let filename = imageUrl
  if (imageUrl.includes('/')) {
    const parts = imageUrl.split('/')
    filename = parts[parts.length - 1]
  }
  
  // Reconstruct full storage path: "{postId}/{filename}"
  // getPublicUrl() expects path within bucket (without "posts/" prefix)
  const storagePath = `${postId}/${filename}`
  
  // Use getPublicUrl() with the path within the bucket
  try {
    const { data } = supabase.storage.from('posts').getPublicUrl(storagePath)
    
    if (data?.publicUrl) {
      return data.publicUrl
    }
    
    // Return null if getPublicUrl fails (components will show SVG fallback)
    console.warn('getPostImageUrl - getPublicUrl returned no data for path:', storagePath)
    return null
  } catch (error) {
    console.error('Error generating public URL for path:', storagePath, error)
    return null
  }
}

/**
 * Get public URL from Supabase Storage path for avatars
 * Handles both full URLs and paths for avatars bucket
 */
export function getAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null
  
  // If it's already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // If it's a relative path starting with /, return as-is
  if (path.startsWith('/')) {
    return path
  }
  
  // If it's a path like "avatars/filename.jpg", convert to public URL
  try {
    // Ensure path starts with avatars/ subfolder
    const avatarPath = path.startsWith('avatars/') ? path : `avatars/${path}`
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath)
    return data?.publicUrl || null
  } catch {
    return null
  }
}

export function getTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Vừa xong'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} tuần trước`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  return `${diffInMonths} tháng trước`
}

/**
 * Check if post is less than 24 hours old
 */
export function isNewPost(dateString: string): boolean {
  const now = new Date()
  const date = new Date(dateString)
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  return diffInHours < 24 && diffInHours >= 0
}

/**
 * Validate Vietnamese phone number format
 * Accepts: 10 digits starting with 0, or 11 digits starting with +84 or 84
 * 
 * Valid formats:
 * - 0912345678 (10 digits, starts with 0)
 * - 0987654321 (10 digits, starts with 0)
 * - +84912345678 (11 digits with + prefix)
 * - 84912345678 (11 digits without +)
 * 
 * Valid prefixes: 03, 05, 07, 08, 09 (mobile networks)
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false
  }
  
  // Remove all whitespace, dashes, and plus signs for validation
  const cleaned = phone.trim().replace(/\s+/g, '').replace(/[-\+]/g, '')
  
  // Check if empty after cleaning
  if (!cleaned) {
    return false
  }
  
  // Check if it contains only digits
  if (!/^\d+$/.test(cleaned)) {
    return false
  }
  
  // Vietnamese phone patterns:
  // - 10 digits starting with 0 followed by 3, 5, 7, 8, or 9 (e.g., 0912345678)
  // - 11 digits starting with 84 followed by 3, 5, 7, 8, or 9 (e.g., 84912345678)
  // Valid prefixes: 03, 05, 07, 08, 09 (mobile), 84 + same prefixes
  const phoneRegex = /^(0[35789]\d{8})$|^(84[35789]\d{8})$/
  
  return phoneRegex.test(cleaned)
}

/**
 * Compress image file (browser-based, reduces file size)
 * Returns a Promise that resolves to a compressed Blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new window.Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Compression failed'))
            }
          },
          file.type,
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Image load error'))
      
      if (e.target?.result) {
        img.src = e.target.result as string
      }
    }
    
    reader.onerror = () => reject(new Error('File read error'))
    reader.readAsDataURL(file)
  })
}

