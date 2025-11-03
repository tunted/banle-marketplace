'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NotificationItem, { Notification } from '@/components/NotificationItem'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadNotifications() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/login')
          return
        }

        // Fetch notifications
        const { data: notificationsData, error: notifError } = await supabase
          .from('notifications')
          .select('id, type, from_user_id, post_id, is_read, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (notifError) {
          console.error('Error fetching notifications:', notifError)
          setError('Không thể tải thông báo.')
          setLoading(false)
          return
        }

        if (!notificationsData || notificationsData.length === 0) {
          setNotifications([])
          setLoading(false)
          return
        }

        // Fetch related user_profiles and posts separately
        const userIds = [...new Set(notificationsData.map(n => n.from_user_id).filter(Boolean))]
        const postIds = [...new Set(notificationsData.map(n => n.post_id).filter(Boolean))]

        // Fetch user profiles
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds)

        // Fetch posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('id, title')
          .in('id', postIds)

        // Create lookup maps
        const userProfilesMap = new Map(
          (userProfiles || []).map(profile => [profile.id, profile])
        )
        const postsMap = new Map(
          (postsData || []).map(post => [post.id, post])
        )

        // Transform data with related entities
        const transformed: Notification[] = notificationsData.map((item) => ({
          id: item.id,
          type: item.type,
          from_user_id: item.from_user_id,
          post_id: item.post_id,
          is_read: item.is_read,
          created_at: item.created_at,
          from_user: item.from_user_id ? userProfilesMap.get(item.from_user_id) || null : null,
          post: item.post_id ? postsMap.get(item.post_id) || null : null,
        }))

        setNotifications(transformed)
      } catch (err: any) {
        console.error('Error loading notifications:', err)
        setError('Đã xảy ra lỗi. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all as read:', error)
        return
      }

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {notifications.length === 0 ? (
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="text-gray-500 mb-4">Bạn chưa có thông báo nào.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
