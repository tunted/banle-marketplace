'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getAvatarUrl } from '@/lib/utils'
import QuickChatSuggestions from './QuickChatSuggestions'
import SavePostButton from './SavePostButton'
import LoginPrompt from './LoginPrompt'

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
  const [chatLoading, setChatLoading] = useState(false)
  const [sellerData, setSellerData] = useState<SellerProfile | null>(seller)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const router = useRouter()

  // Check auth status
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch seller data if not provided (fallback)
  useEffect(() => {
    if (!seller || !seller.id) {
      // Try to fetch seller from post
      async function fetchSeller() {
        try {
          const { data: postData, error: postError } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .maybeSingle()

          if (postError || !postData?.user_id) {
            return
          }

          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, full_name, avatar_url')
            .eq('id', postData.user_id)
            .maybeSingle() // Use maybeSingle to avoid errors when profile doesn't exist

          // Only log non-404 errors (PGRST116 is expected when profile doesn't exist)
          if (profileError) {
            const errorCode = (profileError as any)?.code || profileError?.code
            if (errorCode && errorCode !== 'PGRST116') {
              console.error('[ContactSection] Error fetching seller:', profileError)
            }
          }

          if (profileData && profileData.id) {
            setSellerData(profileData)
          }
        } catch (error: any) {
          // Only log unexpected errors (not PGRST116)
          const errorCode = error?.code || error?.error?.code
          if (errorCode && errorCode !== 'PGRST116') {
            console.error('[ContactSection] Error fetching seller:', error)
          }
        }
      }
      fetchSeller()
    } else {
      setSellerData(seller)
    }
  }, [seller, postId])

  const handleChatClick = async () => {
    if (chatLoading) return

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setShowLoginPrompt(true)
      return
    }
    
    // Use sellerData instead of seller prop
    const currentSeller = sellerData || seller
    
    if (!currentSeller || !currentSeller.id) {
      alert('Không thể tìm thấy thông tin người bán.')
      console.warn('[ContactSection] No seller data available:', { sellerData, seller })
      return
    }

    setChatLoading(true)
    console.log('[ContactSection] Starting chat with seller:', currentSeller.id)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.warn('[ContactSection] User not authenticated:', userError)
        setChatLoading(false)
        router.push('/login')
        return
      }

      if (user.id === currentSeller.id) {
        alert('Bạn không thể chat với chính mình.')
        setChatLoading(false)
        return
      }

      console.log('[ContactSection] Checking for existing conversation between:', user.id, 'and', currentSeller.id)

      // Check if conversation already exists
      // Try both possible combinations: user1=current, user2=seller OR user1=seller, user2=current
      const { data: existingConv1, error: error1 } = await supabase
        .from('conversations')
        .select('id')
        .eq('user1_id', user.id)
        .eq('user2_id', currentSeller.id)
        .maybeSingle()

      if (error1 && error1.code !== 'PGRST116') {
        console.error('[ContactSection] Error checking conversation 1:', error1)
      }

      const { data: existingConv2, error: error2 } = await supabase
        .from('conversations')
        .select('id')
        .eq('user1_id', currentSeller.id)
        .eq('user2_id', user.id)
        .maybeSingle()

      if (error2 && error2.code !== 'PGRST116') {
        console.error('[ContactSection] Error checking conversation 2:', error2)
      }

      const existingConv = existingConv1 || existingConv2

      if (existingConv) {
        console.log('[ContactSection] Found existing conversation:', existingConv.id)
        setChatLoading(false)
        router.push(`/messages/${existingConv.id}`)
        router.refresh() // Force refresh to ensure navigation
        return
      }

      console.log('[ContactSection] Creating new conversation')

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          user1_id: user.id,
          user2_id: currentSeller.id,
        })
        .select()
        .single()

      if (createError) {
        console.error('[ContactSection] Error creating conversation:', createError)
        
        // Check if it's a duplicate error (conversation was created by another request)
        if (createError.code === '23505' || createError.message?.includes('duplicate')) {
          console.log('[ContactSection] Duplicate detected, retrying fetch')
          // Try to find the conversation again
          const { data: retryConv1 } = await supabase
            .from('conversations')
            .select('id')
            .eq('user1_id', user.id)
            .eq('user2_id', currentSeller.id)
            .maybeSingle()

          const { data: retryConv2 } = await supabase
            .from('conversations')
            .select('id')
            .eq('user1_id', currentSeller.id)
            .eq('user2_id', user.id)
            .maybeSingle()

          const retryConv = retryConv1 || retryConv2
          if (retryConv) {
            console.log('[ContactSection] Found conversation on retry:', retryConv.id)
            setChatLoading(false)
            router.push(`/messages/${retryConv.id}`)
            router.refresh()
            return
          }
        }
        
        alert(`Không thể tạo cuộc trò chuyện: ${createError.message || 'Vui lòng thử lại.'}`)
        setChatLoading(false)
        return
      }

      if (newConv && newConv.id) {
        console.log('[ContactSection] Created new conversation:', newConv.id)
        setChatLoading(false)
        router.push(`/messages/${newConv.id}`)
        router.refresh() // Force refresh to ensure navigation
      } else {
        console.error('[ContactSection] Conversation created but no ID returned:', newConv)
        alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại.')
        setChatLoading(false)
      }
    } catch (err: any) {
      console.error('[ContactSection] Unexpected error handling chat click:', err)
      alert(`Đã xảy ra lỗi: ${err?.message || 'Vui lòng thử lại.'}`)
      setChatLoading(false)
    }
  }

  const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone
    const lastFour = phone.slice(-4)
    const masked = phone.slice(0, -4).replace(/./g, '*')
    return masked + lastFour
  }

  const handleShowPhone = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true)
      return
    }
    setShowFullPhone(true)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
      {showLoginPrompt && (
        <LoginPrompt
          message="Vui lòng đăng nhập để liên hệ người bán"
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
      
      <div className="space-y-4">
        {/* Phone Number - Hide for non-logged-in users */}
        {isLoggedIn ? (
          <div>
            <p className="text-sm text-gray-600 mb-2">Liên hệ</p>
            <p className="text-xl font-bold text-gray-900">
              {showFullPhone ? phone : `Hiện số ${maskPhone(phone)}`}
            </p>
            {!showFullPhone && (
              <button
                onClick={handleShowPhone}
                className="text-green-600 hover:text-green-700 text-sm font-medium mt-1"
              >
                Hiện số đầy đủ
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-2">Liên hệ</p>
            <p className="text-xl font-bold text-gray-900 mb-2">
              {maskPhone(phone)}
            </p>
            <button
              onClick={() => setShowLoginPrompt(true)}
              className="text-green-600 hover:text-green-700 text-sm font-medium underline"
            >
              Đăng nhập để xem số điện thoại
            </button>
          </div>
        )}

        {/* Save Post Button - Only for logged-in users */}
        {isLoggedIn && <SavePostButton postId={postId} />}

        {/* Chat Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleChatClick()
          }}
          disabled={!sellerData || !sellerData.id || chatLoading}
          className="w-full bg-yellow-400 text-gray-900 font-bold py-3 rounded-xl hover:bg-yellow-500 active:bg-yellow-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          title={
            !sellerData 
              ? 'Không tìm thấy thông tin người bán' 
              : !sellerData.id 
              ? 'Thông tin người bán không hợp lệ'
              : chatLoading
              ? 'Đang tải...'
              : 'Nhấn để bắt đầu chat'
          }
        >
          {chatLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Đang tải...</span>
            </>
          ) : (
            <>
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
              <span>Chat</span>
            </>
          )}
        </button>

        {/* Quick Chat Suggestions */}
        <QuickChatSuggestions postId={postId} />

        {/* Seller Info */}
        {sellerData && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {getAvatarUrl(sellerData.avatar_url) ? (
                  <Image
                    src={getAvatarUrl(sellerData.avatar_url)!}
                    alt={sellerData.full_name || 'Seller'}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                ) : (
                  <span className="text-gray-600 font-medium">
                    {sellerData.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {sellerData.full_name || 'Người bán'}
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

