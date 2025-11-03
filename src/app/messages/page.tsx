'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getTimeAgo, getAvatarUrl } from '@/lib/utils'

interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  other_user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  last_message: {
    content: string
    sent_at: string
    sender_id: string
  } | null
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Refresh header counts when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Trigger header refresh when page becomes visible
        window.dispatchEvent(new CustomEvent('messagesRead'))
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    async function loadConversations() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/login')
          return
        }

        setUser(user)

        // Fetch conversations where user is participant
        const { data: convosData, error: convosError } = await supabase
          .from('conversations')
          .select('id, user1_id, user2_id, created_at')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false })

        if (convosError) {
          console.error('Error fetching conversations:', convosError)
          setError('Không thể tải danh sách cuộc trò chuyện.')
          setLoading(false)
          return
        }

        // For each conversation, get other user info and last message
        const enrichedConversations: Conversation[] = await Promise.all(
          (convosData || []).map(async (conv) => {
            const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id

            // Get other user profile
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('id, full_name, avatar_url')
              .eq('id', otherUserId)
              .single()

            // Get last message
            const { data: messagesData } = await supabase
              .from('messages')
              .select('content, sent_at, sender_id')
              .eq('conversation_id', conv.id)
              .order('sent_at', { ascending: false })
              .limit(1)
              .single()

            return {
              id: conv.id,
              user1_id: conv.user1_id,
              user2_id: conv.user2_id,
              created_at: conv.created_at,
              other_user: {
                id: otherUserId,
                full_name: userData?.full_name || null,
                avatar_url: userData?.avatar_url || null,
              },
              last_message: messagesData || null,
            }
          })
        )

        setConversations(enrichedConversations)
        setLoading(false)

        // Subscribe to real-time updates for conversations and messages
        const conversationsChannel = supabase
          .channel(`conversations-list-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'conversations',
              filter: `user1_id=eq.${user.id}`,
            },
            () => {
              // Reload conversations when new one is created where user is user1
              loadConversations()
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'conversations',
              filter: `user2_id=eq.${user.id}`,
            },
            () => {
              // Reload conversations when new one is created where user is user2
              loadConversations()
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
            },
            () => {
              // Reload conversations when new message arrives to update last_message
              // This will be filtered by RLS, so only relevant messages trigger
              loadConversations()
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(conversationsChannel)
        }
      } catch (err: any) {
        console.error('Error loading conversations:', err)
        setError('Đã xảy ra lỗi. Vui lòng thử lại.')
        setLoading(false)
      }
    }

    loadConversations()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [router, searchParams])

  // Check if we should open a specific conversation
  const userIdParam = searchParams.get('userId')
  useEffect(() => {
    async function handleUserIdParam() {
      if (!userIdParam) return
      
      if (conversations.length > 0) {
        // Find existing conversation with this user
        const existingConv = conversations.find(
          (c) => c.other_user.id === userIdParam
        )
        if (existingConv) {
          router.push(`/messages/${existingConv.id}`)
        } else {
          // Create new conversation
          await createConversation(userIdParam)
        }
      } else if (!loading) {
        // If conversations are loaded but none found, create new one
        await createConversation(userIdParam)
      }
    }
    
    handleUserIdParam()
  }, [userIdParam, conversations, loading, router])

  const createConversation = async (otherUserId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user1_id: user.id,
          user2_id: otherUserId,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating conversation:', error)
        return
      }

      router.push(`/messages/${data.id}`)
    } catch (err) {
      console.error('Error creating conversation:', err)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Trò chuyện</h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {conversations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
            <p className="text-gray-500 mb-2 text-lg font-medium">Bạn chưa có cuộc trò chuyện nào.</p>
            <p className="text-gray-400 text-sm">Bắt đầu trò chuyện bằng cách nhấn vào nút Chat trên bài đăng.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
            {conversations.map((conv) => {
              const displayName = conv.other_user.full_name || 'Người dùng'
              const avatarUrl = getAvatarUrl(conv.other_user.avatar_url)
              const isOwnLastMessage = conv.last_message?.sender_id === user?.id

              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center overflow-hidden shadow-sm">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={displayName}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-white font-semibold text-base">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Online indicator - could be added later */}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate text-base">
                          {displayName}
                        </h3>
                        {conv.last_message && (
                          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                            {getTimeAgo(conv.last_message.sent_at)}
                          </span>
                        )}
                      </div>
                      {conv.last_message ? (
                        <p className={`text-sm truncate ${!isOwnLastMessage ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                          {isOwnLastMessage && <span className="text-gray-400">Bạn: </span>}
                          {conv.last_message.content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Chưa có tin nhắn</p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
