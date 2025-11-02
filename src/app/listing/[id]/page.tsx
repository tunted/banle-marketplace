import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { formatCurrency, getTimeAgo, isNewListing } from '@/lib/utils'
import Link from 'next/link'

interface Listing {
  id: string
  title: string
  price: number
  location: string
  description: string | null
  phone: string
  images: string[] | null
  created_at: string
}

async function getListing(id: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, price, location, description, phone, images, created_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

// Generate static params for top listings (for better performance)
export async function generateStaticParams() {
  // Fetch most recent 50 listings for static generation
  const { data } = await supabase
    .from('listings')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data) return []

  return data.map((listing) => ({
    id: listing.id,
  }))
}

// Enable ISR: revalidate every 60 seconds
export const revalidate = 60

export default async function ListingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const listing = await getListing(params.id)

  if (!listing) {
    notFound()
  }

  // Parse images array - handle both array and string formats
  let imagesArray: string[] = []
  if (listing.images) {
    if (Array.isArray(listing.images)) {
      imagesArray = listing.images
    } else if (typeof listing.images === 'string') {
      try {
        // Try to parse as JSON string
        const parsed = JSON.parse(listing.images)
        if (Array.isArray(parsed)) {
          imagesArray = parsed
        }
      } catch {
        // If not valid JSON, ignore
        imagesArray = []
      }
    }
  }

  // Filter to only valid image URLs
  const validImages = imagesArray.filter((img) => {
    if (!img || typeof img !== 'string') return false
    // Must be a valid absolute URL (http/https) or relative path starting with /
    return (
      img.startsWith('http://') ||
      img.startsWith('https://') ||
      img.startsWith('/')
    )
  })

  const isNew = isNewListing(listing.created_at)

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <Link
          href="/"
          className="text-green-500 hover:text-green-600 mb-4 inline-flex items-center gap-2"
        >
          <span>←</span>
          <span>Quay lại</span>
        </Link>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {validImages.length > 0 ? (
            <div className="space-y-4 mb-4">
              {validImages.map((image, index) => (
                <div key={index} className="aspect-[4/3] relative bg-gray-100">
                  <Image
                    src={image}
                    alt={`${listing.title} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    loading={index < 2 ? 'eager' : 'lazy'}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center mb-4">
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

          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900 flex-1">
                {listing.title}
              </h1>
              {isNew && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-4 flex-shrink-0">
                  Mới
                </span>
              )}
            </div>
            
            <p className="text-2xl text-red-600 font-bold mt-2">
              {formatCurrency(listing.price)}
            </p>

            <div className="mt-3 text-gray-500 text-sm">
              <p className="mb-1">{listing.location}</p>
              <p>{getTimeAgo(listing.created_at)}</p>
            </div>

            {listing.description && (
              <div className="mt-3">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            <div className="bg-green-50 p-3 rounded-xl mt-4">
              <a
                href={`tel:${listing.phone}`}
                className="block text-green-600 font-semibold"
              >
                📞 {listing.phone}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-4 right-4 md:hidden z-50">
        <a
          href={`tel:${listing.phone}`}
          className="block w-full bg-green-500 text-white py-3 rounded-full text-center font-bold shadow-lg hover:bg-green-600 transition-colors"
        >
          Gọi ngay
        </a>
      </div>
    </>
  )
}

