'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getAvatarUrl } from '@/lib/utils'
import MessageBubble, { Message } from '@/components/MessageBubble'

interface MessagesListProps {
  messages: Message[]
}

function MessagesList({ messages }: MessagesListProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getCurrentUser() {
      try {
        const { data } = await supabase.auth.getUser()
        setCurrentUserId(data.user?.id || null)
      } catch (error) {
        console.error('Error getting current user:', error)
      } finally {
        setLoading(false)
      }
    }
    getCurrentUser()
  }, [])

  if (loading || !currentUserId) {
    return <div className="text-center text-gray-500 py-12">Đang tải...</div>
  }

  return (
    <>
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwnMessage={message.sender_id === currentUserId}
        />
      ))}
    </>
  )
}

interface ConversationInfo {
  id: string
  other_user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const [conversation, setConversation] = useState<ConversationInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    async function loadConversation() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/login')
          return
        }

        // Get conversation info
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('id, user1_id, user2_id')
          .eq('id', conversationId)
          .single()

        if (convError) {
          console.error('[ConversationPage] Error fetching conversation:', convError)
          if (convError.code === 'PGRST116') {
            alert('Cuộc trò chuyện không tồn tại.')
          } else {
            alert(`Không thể tải cuộc trò chuyện: ${convError.message || 'Vui lòng thử lại.'}`)
          }
          router.push('/messages')
          return
        }

        if (!convData) {
          console.error('[ConversationPage] Conversation data is null')
          alert('Cuộc trò chuyện không tồn tại.')
          router.push('/messages')
          return
        }

        // Verify user is part of conversation
        if (convData.user1_id !== user.id && convData.user2_id !== user.id) {
          router.push('/messages')
          return
        }

        // Get other user info
        const otherUserId = convData.user1_id === user.id ? convData.user2_id : convData.user1_id
        const { data: userData, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .eq('id', otherUserId)
          .maybeSingle() // Use maybeSingle to handle missing profiles gracefully

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('[ConversationPage] Error fetching user profile:', profileError)
        }

        setConversation({
          id: conversationId,
          other_user: {
            id: otherUserId,
            full_name: userData?.full_name || null,
            avatar_url: userData?.avatar_url || null,
          },
        })

        // Load messages
        await loadMessages()

        // Subscribe to new messages with real-time updates
        const channel = supabase
          .channel(`conversation:${conversationId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              // Optimistically update UI with new message
              if (payload.new) {
                const newMsg = payload.new as any
                setMessages((prev) => {
                  // Check if message already exists to avoid duplicates
                  if (prev.some((m) => m.id === newMsg.id)) {
                    return prev
                  }
                  return [...prev, {
                    id: newMsg.id,
                    sender_id: newMsg.sender_id,
                    content: newMsg.content,
                    sent_at: newMsg.sent_at,
                    sender: null, // Will be loaded with full reload
                  }]
                })
              }
              // Reload to get full message with sender info
              setTimeout(() => loadMessages(), 100)
            }
          )
          .subscribe()

        setLoading(false)

        return () => {
          supabase.removeChannel(channel)
        }
      } catch (err: any) {
        console.error('[ConversationPage] Error loading conversation:', err)
        // Show error message before redirecting
        if (err?.message) {
          alert(`Không thể tải cuộc trò chuyện: ${err.message}`)
        }
        router.push('/messages')
      }
    }

    if (conversationId) {
      loadConversation()
    } else {
      console.warn('[ConversationPage] No conversation ID provided')
      router.push('/messages')
    }
  }, [conversationId, router])

  const loadMessages = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Fetch messages with sender info
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          content,
          sent_at,
          sender:user_profiles!messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true })

      if (messagesError) {
        console.error('Error loading messages:', messagesError)
        return
      }

      // Transform messages
      const transformedMessages: Message[] = (messagesData || []).map((msg: any) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        content: msg.content,
        sent_at: msg.sent_at,
        sender: msg.sender || null,
      }))

      setMessages(transformedMessages)
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !conversation) return

    const messageContent = newMessage.trim()
    setNewMessage('') // Clear input immediately for better UX
    setSending(true)
    
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Optimistic update - add message to UI immediately
      const tempId = `temp-${Date.now()}`
      const optimisticMessage: Message = {
        id: tempId,
        sender_id: user.id,
        content: messageContent,
        sent_at: new Date().toISOString(),
        sender: {
          id: user.id,
          full_name: null,
          avatar_url: null,
        },
      }
      
      setMessages((prev) => [...prev, optimisticMessage])

      const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: messageContent,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error sending message:', insertError)
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        alert('Không thể gửi tin nhắn. Vui lòng thử lại.')
        setNewMessage(messageContent) // Restore message
      } else {
        // Replace temp message with real one
        if (insertedMessage) {
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== tempId)
            return [...filtered, {
              id: insertedMessage.id,
              sender_id: insertedMessage.sender_id,
              content: insertedMessage.content,
              sent_at: insertedMessage.sent_at,
              sender: optimisticMessage.sender,
            }]
          })
        }
        inputRef.current?.focus()
      }
    } catch (err) {
      console.error('Error sending message:', err)
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')))
      alert('Đã xảy ra lỗi. Vui lòng thử lại.')
      setNewMessage(messageContent) // Restore message
    } finally {
      setSending(false)
    }
  }

  if (loading || !conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Đang tải cuộc trò chuyện...</p>
          <p className="text-gray-400 text-sm mt-2">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    )
  }

  const displayName = conversation.other_user.full_name || 'Người dùng'
  const avatarUrl = getAvatarUrl(conversation.other_user.avatar_url)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/messages"
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h2 className="font-semibold text-gray-900 flex-1">{displayName}</h2>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
              <p className="text-lg font-medium mb-2">Chưa có tin nhắn nào</p>
              <p className="text-sm">Hãy bắt đầu cuộc trò chuyện!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <MessagesList messages={messages} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  // Auto-resize textarea
                  if (inputRef.current) {
                    inputRef.current.style.height = 'auto'
                    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
                placeholder="Nhập tin nhắn... (Nhấn Enter để gửi, Shift+Enter để xuống dòng)"
                rows={1}
                className="w-full p-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none min-h-[48px] max-h-[120px]"
                disabled={sending}
              />
              {newMessage.trim() && (
                <button
                  type="button"
                  onClick={() => setNewMessage('')}
                  className="absolute right-2 bottom-2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Xóa tin nhắn"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg min-h-[48px]"
            >
              {sending ? (
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
                  <span>Gửi...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Gửi</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

