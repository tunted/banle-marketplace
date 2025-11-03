'use client'

import Image from 'next/image'
import { getTimeAgo, getAvatarUrl } from '@/lib/utils'

export interface Message {
  id: string
  sender_id: string
  content: string
  sent_at: string
  sender?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const displayName = message.sender?.full_name || 'Người dùng'
  const avatarUrl = getAvatarUrl(message.sender?.avatar_url)

  return (
    <div className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={32}
              height={32}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-white font-semibold text-xs">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isOwnMessage && (
          <span className="text-xs text-gray-500 mb-1 px-1">
            {displayName}
          </span>
        )}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwnMessage
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span className="text-xs text-gray-400 mt-1 px-1">
          {getTimeAgo(message.sent_at)}
        </span>
      </div>
    </div>
  )
}

