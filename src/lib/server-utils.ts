import { createClient } from '@/lib/supabase-server'

/**
 * Server-side utility to generate public URLs for post images
 * Use this in Server Components to avoid client-side waterfall
 * 
 * @param postId - The post ID (UUID)
 * @param imageUrl - The filename stored in database (e.g., "image.jpg") or null
 * @returns Public URL string or null if path is invalid
 */
export async function getPostImageUrlServer(postId: string | null | undefined, imageUrl: string | null | undefined): Promise<string | null> {
  if (!postId || !imageUrl) return null
  
  // If imageUrl is already a full URL, return it
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
      const imageUrl = await getPostImageUrlServer(post.id, post.image_url)
      return {
        ...post,
        image_url_resolved: imageUrl, // null if no image (components will show SVG fallback)
      }
    })
  )
}

