'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Logo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Generate public URL for logo from Supabase Storage
    const { data } = supabase.storage
      .from('logo')
      .getPublicUrl('logo_white.png')
    
    if (data?.publicUrl) {
      setLogoUrl(data.publicUrl)
    }
  }, [])

  const handleImageError = () => {
    setHasError(true)
  }

  return (
    <Link href="/" className="flex items-center gap-3 group flex-shrink-0 min-w-0">
      {logoUrl && !hasError ? (
        <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
          <Image
            src={logoUrl}
            alt="Bán Lẹ"
            width={227}
            height={76}
            className="object-contain h-[76px] sm:h-[91px] w-auto"
            priority
            onError={handleImageError}
            unoptimized={logoUrl.includes('supabase.co')}
          />
        </div>
      ) : (
        // Fallback: Original emoji + text design
        <>
          <span className="text-4xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" style={{ filter: 'drop-shadow(0 4px 8px rgba(34, 197, 94, 0.3))' }}>
            ⚡
          </span>
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 bg-clip-text text-transparent whitespace-nowrap overflow-visible" style={{ 
            textShadow: '0 2px 4px rgba(34, 197, 94, 0.2)',
            letterSpacing: '-0.01em',
            transform: 'perspective(500px) rotateX(2deg)',
          }}>
            Bán Lẹ
          </h1>
        </>
      )}
    </Link>
  )
}

