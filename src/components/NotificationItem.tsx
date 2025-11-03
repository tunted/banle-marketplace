'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getTimeAgo, getAvatarUrl } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string
  type: 'like' | 'new_message'
  from_user_id: string | null
  post_id: string | null
  is_read: boolean
  created_at: string
  from_user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  post?: {
    id: string
    title: string
  }
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (notificationId: string) => void
}

export default function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const handleClick = async () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  const displayName = notification.from_user?.full_name || 'Người dùng'
  const avatarUrl = getAvatarUrl(notification.from_user?.avatar_url)

  // Determine navigation URL based on type
  const getNavigationUrl = () => {
    if (notification.type === 'new_message') {
      // Navigate to chat with this user
      return `/messages?userId=${notification.from_user_id}`
    } else if (notification.type === 'like' && notification.post_id) {
      // Navigate to the saved post
      return `/posts/${notification.post_id}`
    }
    return '#'
  }

  // Get notification message
  const getNotificationMessage = () => {
    if (notification.type === 'like') {
      return `${displayName} đã lưu bài đăng của bạn`
    } else if (notification.type === 'new_message') {
      return `${displayName} đã gửi tin nhắn cho bạn`
    }
    return 'Bạn có thông báo mới'
  }

  return (
    <Link
      href={getNavigationUrl()}
      onClick={handleClick}
      className={`block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        !notification.is_read ? 'bg-blue-50/50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="text-white font-semibold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 font-medium">
            {getNotificationMessage()}
          </p>
          {notification.post && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              "{notification.post.title}"
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {getTimeAgo(notification.created_at)}
          </p>
        </div>

        {/* Unread Indicator */}
        {!notification.is_read && (
          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
        )}
      </div>
    </Link>
  )
}

