'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface QuickChatSuggestionsProps {
  postId: string
}

export default function QuickChatSuggestions({ postId }: QuickChatSuggestionsProps) {
  const [sending, setSending] = useState<string | null>(null)
  const router = useRouter()

  const suggestions = [
    'Điện thoại này còn không?',
    'Bạn có ship hàng không?',
    'Sản phẩm còn bảo hành không?',
  ]

  const handleSuggestionClick = async (suggestion: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get post to find seller
      const { data: postData } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single()

      if (!postData || !postData.user_id) {
        alert('Không thể tìm thấy người bán.')
        return
      }

      if (user.id === postData.user_id) {
        alert('Bạn không thể chat với chính mình.')
        return
      }

      setSending(suggestion)

      // Find or create conversation
      // Check both possible combinations
      const { data: existingConv1 } = await supabase
        .from('conversations')
        .select('id')
        .eq('user1_id', user.id)
        .eq('user2_id', postData.user_id)
        .maybeSingle()

      const { data: existingConv2 } = await supabase
        .from('conversations')
        .select('id')
        .eq('user1_id', postData.user_id)
        .eq('user2_id', user.id)
        .maybeSingle()

      const existingConv = existingConv1 || existingConv2
      let conversationId: string

      if (existingConv) {
        conversationId = existingConv.id
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            user1_id: user.id,
            user2_id: postData.user_id,
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating conversation:', createError)
          
          // If duplicate, try to find it again
          if (createError.code === '23505') {
            const { data: retryConv1 } = await supabase
              .from('conversations')
              .select('id')
              .eq('user1_id', user.id)
              .eq('user2_id', postData.user_id)
              .maybeSingle()

            const { data: retryConv2 } = await supabase
              .from('conversations')
              .select('id')
              .eq('user1_id', postData.user_id)
              .eq('user2_id', user.id)
              .maybeSingle()

            const retryConv = retryConv1 || retryConv2
            if (retryConv) {
              conversationId = retryConv.id
            } else {
              alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại.')
              setSending(null)
              return
            }
          } else {
            alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại.')
            setSending(null)
            return
          }
        } else if (newConv) {
          conversationId = newConv.id
        } else {
          alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại.')
          setSending(null)
          return
        }
      }

      // Send message
      const { error: messageError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: suggestion,
      })

      if (messageError) {
        console.error('Error sending message:', messageError)
        alert('Không thể gửi tin nhắn. Vui lòng thử lại.')
      } else {
        // Navigate to conversation
        router.push(`/messages/${conversationId}`)
      }
    } catch (err) {
      console.error('Error handling suggestion:', err)
      alert('Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">Câu hỏi nhanh</p>
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={!!sending}
            className="w-full text-left text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending === suggestion ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang gửi...
              </span>
            ) : (
              suggestion
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

