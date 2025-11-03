'use client'

interface NotificationBadgeProps {
  count: number
  className?: string
}

export default function NotificationBadge({ count, className = '' }: NotificationBadgeProps) {
  if (count <= 0) return null

  // Format count - show 99+ if over 99
  const displayCount = count > 99 ? '99+' : count.toString()

  return (
    <span
      className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 shadow-lg ${className}`}
      style={{
        fontSize: count > 99 ? '9px' : '10px',
        lineHeight: '1',
      }}
    >
      {displayCount}
    </span>
  )
}

