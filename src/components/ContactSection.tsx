'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getAvatarUrl } from '@/lib/utils'
import QuickChatSuggestions from './QuickChatSuggestions'
import SavePostButton from './SavePostButton'

interface SellerProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface ContactSectionProps {
  phone: string
  seller: SellerProfile | null
  postId: string
}

export default function ContactSection({ phone, seller, postId }: ContactSectionProps) {
  const [showFullPhone, setShowFullPhone] = useState(false)
  const router = useRouter()

  const handleChatClick = async () => {
    if (!seller) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      if (user.id === seller.id) {
        alert('Bạn không thể chat với chính mình.')
        return
      }

      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${seller.id}),and(user1_id.eq.${seller.id},user2_id.eq.${user.id})`)
        .single()

      if (existingConv) {
        router.push(`/messages/${existingConv.id}`)
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            user1_id: user.id,
            user2_id: seller.id,
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating conversation:', createError)
          alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại.')
          return
        }

        if (newConv) {
          router.push(`/messages/${newConv.id}`)
        }
      }
    } catch (err) {
      console.error('Error handling chat click:', err)
      alert('Đã xảy ra lỗi. Vui lòng thử lại.')
    }
  }

  const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone
    const lastFour = phone.slice(-4)
    const masked = phone.slice(0, -4).replace(/./g, '*')
    return masked + lastFour
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
      <div className="space-y-4">
        {/* Phone Number */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Liên hệ</p>
          <p className="text-xl font-bold text-gray-900">
            {showFullPhone ? phone : `Hiện số ${maskPhone(phone)}`}
          </p>
          {!showFullPhone && (
            <button
              onClick={() => setShowFullPhone(true)}
              className="text-green-600 hover:text-green-700 text-sm font-medium mt-1"
            >
              Hiện số đầy đủ
            </button>
          )}
        </div>

        {/* Save Post Button */}
        <SavePostButton postId={postId} />

        {/* Chat Button */}
        <button
          onClick={handleChatClick}
          disabled={!seller}
          className="w-full bg-yellow-400 text-gray-900 font-bold py-3 rounded-xl hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Chat
        </button>

        {/* Quick Chat Suggestions */}
        <QuickChatSuggestions postId={postId} />

        {/* Seller Info */}
        {seller && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {getAvatarUrl(seller.avatar_url) ? (
                  <Image
                    src={getAvatarUrl(seller.avatar_url)!}
                    alt={seller.full_name || 'Seller'}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                ) : (
                  <span className="text-gray-600 font-medium">
                    {seller.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {seller.full_name || 'Người bán'}
                </p>
                <p className="text-xs text-green-600">Đang hoạt động</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span>41 Đã bán</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-yellow-500">★★★★★</span>
                <span>5</span>
                <span className="text-gray-400">•</span>
                <span>1 đánh giá</span>
              </div>
              <div className="text-gray-600">
                <span>Tỷ lệ phản hồi: 100%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

