import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { formatCurrency, getTimeAgo, getPostImageUrl } from '@/lib/utils'
import Link from 'next/link'
import ImageCarousel from '@/components/ImageCarousel'
import PostDetails from '@/components/PostDetails'
import ContactSection from '@/components/ContactSection'
import MobileContactButton from '@/components/MobileContactButton'

interface Post {
  id: string
  title: string
  price: number
  location: string
  description: string | null
  phone: string
  image_url: string | null
  created_at: string
  user_id: string | null
  province_code: string | null
  ward_code: string | null
}

interface SellerProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
}

async function getPost(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, price, location, description, phone, image_url, created_at, user_id, province_code, ward_code')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

async function getSellerProfile(userId: string): Promise<SellerProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

// Generate static params for top posts
export async function generateStaticParams() {
  const { data } = await supabase
    .from('posts')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data) return []

  return data.map((post) => ({
    id: post.id,
  }))
}

// Enable ISR: revalidate every 60 seconds
export const revalidate = 60

export default async function PostDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const post = await getPost(params.id)

  if (!post) {
    notFound()
  }

  // Get all images for this post
  // New format: images are stored in {postId}/ subfolder (e.g., "{postId}/filename.jpg")
  // The image_url field contains the path like "{postId}/filename.jpg"
  // We need to convert this path to a public URL
  let validImages: string[] = []
  
  if (post.image_url) {
    // Convert the stored filename to public URL
    // image_url format: "filename.jpg" (just the filename)
    // getPostImageUrl() reconstructs path as "posts/{postId}/filename.jpg" and generates public URL
    const imageUrl = getPostImageUrl(post.id, post.image_url)
    
    if (imageUrl) {
      validImages = [imageUrl]
      
      // Also try to list all images in the post's folder (in case there are multiple images)
      try {
        const { data: files, error } = await supabase.storage
          .from('posts')
          .list(post.id, {
            limit: 10,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' },
          })

        if (!error && files && files.length > 0) {
          // Get public URLs for all image files in the folder
          const folderImages = files
            .filter((file) => {
              const fileName = file.name.toLowerCase()
              return (
                fileName.endsWith('.jpg') ||
                fileName.endsWith('.jpeg') ||
                fileName.endsWith('.png') ||
                fileName.endsWith('.webp')
              )
            })
            .map((file) => {
              // file.name is just the filename, post.id is the folder
              // getPostImageUrl() reconstructs path as "{postId}/{filename}"
              return getPostImageUrl(post.id, file.name)
            })
            .filter((url): url is string => url !== null && url !== '')

          // Combine all images, remove duplicates, ensure first image from image_url is first
          if (folderImages.length > 0) {
            const allImages = [imageUrl, ...folderImages.filter((url) => url !== imageUrl)]
            validImages = [...new Set(allImages)] // Remove duplicates
          }
        }
      } catch (error) {
        console.warn('Error listing additional images from folder:', error)
        // Continue with just the image_url converted to URL
      }
    }
  }

  // Fetch seller profile if user_id exists
  let seller: SellerProfile | null = null
  if (post.user_id) {
    seller = await getSellerProfile(post.user_id)
  }


  // Calculate price range for market price slider (mock calculation)
  const priceInTr = post.price / 1000000 // Convert to triệu (millions)
  const minPrice = Math.max(0.5, priceInTr - 0.5) // Min range
  const maxPrice = priceInTr + 0.5 // Max range
  const currentPricePosition = ((priceInTr - minPrice) / (maxPrice - minPrice)) * 100

  // Format price in triệu for slider
  const formatPriceTr = (price: number) => {
    return price.toFixed(2).replace('.', ',') + ' tr'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link
          href="/"
          className="text-green-500 hover:text-green-600 mb-4 inline-flex items-center gap-2"
        >
          <span>←</span>
          <span>Quay lại</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Carousel */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <ImageCarousel images={validImages} title={post.title} postId={post.id} />
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {post.title}
                  </h1>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-red-50 text-red-600 text-xs font-medium px-2 py-1 rounded">
                      Giá tốt
                    </span>
                    <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-1 rounded">
                      Kèm phụ kiện
                    </span>
                  </div>
                </div>

                <div className="pb-4 border-b border-gray-200">
                  <p className="text-4xl font-bold text-red-600 mb-4">
                    {formatCurrency(post.price)}
                  </p>
                </div>

                {/* Market Price Range */}
                <div className="py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Giá thị trường</span>
                    <span className="text-xs text-gray-500" title="Theo dữ liệu trong 3 tháng gần nhất">
                      ℹ️
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full">
                    <div
                      className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                      style={{ width: `${currentPricePosition}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-1 bg-red-600"
                      style={{ left: `${currentPricePosition}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-gray-600">{formatPriceTr(minPrice)}</span>
                    <span className="font-bold text-red-600">{formatPriceTr(priceInTr)}</span>
                    <span className="text-gray-600">{formatPriceTr(maxPrice)}</span>
                  </div>
                </div>

                {/* Location and Time */}
                <div className="space-y-2 text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">📍</span>
                    <span>{post.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Cập nhật {getTimeAgo(post.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description and Comments */}
            <PostDetails
              description={post.description}
              comments={[]}
              postId={post.id}
            />
          </div>

          {/* Right Column - Contact and Seller Info */}
          <div className="space-y-6">
            <ContactSection
              phone={post.phone}
              seller={seller}
              postId={post.id}
            />
          </div>
        </div>
      </div>

      {/* Mobile Contact Button */}
      <MobileContactButton phone={post.phone} />
    </div>
  )
}

