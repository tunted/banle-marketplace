import { createClient } from '@/lib/supabase-server'

/**
 * Server-side utility to generate public URLs for post images
 * Use this in Server Components to avoid client-side waterfall
 * 
 * Uses the exact image_url value stored in the database without any path manipulation.
 * 
 * @param imageUrl - The storage path stored in database (e.g., "{postId}/filename.jpg") or null
 * @returns Public URL string or null if path is invalid
 */
export async function getPostImageUrlServer(imageUrl: string | null | undefined): Promise<string | null> {
  if (!imageUrl) return null
  
  // If imageUrl is already a full URL, return it
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  
  // If it's a relative path starting with /, return as-is (public asset)
  if (imageUrl.startsWith('/')) {
    return imageUrl
  }
  
  // Use the stored path directly - getPublicUrl() expects path within bucket
  // Remove "posts/" prefix if present (getPublicUrl adds bucket name automatically)
  let storagePath = imageUrl
  if (storagePath.startsWith('posts/')) {
    storagePath = storagePath.substring(6) // Remove "posts/" prefix
  }
  
  // Convert to public URL using Supabase Storage
  try {
    const supabase = await createClient()
    const { data } = supabase.storage.from('posts').getPublicUrl(storagePath)
    return data?.publicUrl || null
  } catch {
    return null
  }
}

/**
 * Process posts array to add public URLs for images
 * Use this in Server Components to pre-generate all URLs
 */
export async function processPostsWithImageUrls<T extends { id: string; image_url: string | null }>(
  posts: T[]
): Promise<(T & { image_url_resolved: string | null })[]> {
  return Promise.all(
    posts.map(async (post) => {
      const imageUrl = await getPostImageUrlServer(post.image_url)
      return {
        ...post,
        image_url_resolved: imageUrl, // null if no image (components will show SVG fallback)
      }
    })
  )
}

