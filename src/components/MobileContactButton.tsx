'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import LoginPrompt from './LoginPrompt'

interface MobileContactButtonProps {
  phone: string
}

export default function MobileContactButton({ phone }: MobileContactButtonProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

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

  const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone
    const lastFour = phone.slice(-4)
    const masked = phone.slice(0, -4).replace(/./g, '*')
    return masked + lastFour
  }

  const handleCallClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault()
      setShowLoginPrompt(true)
    }
  }

  return (
    <>
      {showLoginPrompt && (
        <LoginPrompt
          message="Vui lòng đăng nhập để liên hệ người bán"
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
      <div className="fixed bottom-6 left-4 right-4 lg:hidden z-50">
        <div className="bg-white rounded-full shadow-lg p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">Liên hệ</p>
            <p className="font-bold text-gray-900">
              {isLoggedIn ? phone : maskPhone(phone)}
            </p>
          </div>
          {isLoggedIn ? (
            <a
              href={`tel:${phone}`}
              className="bg-green-500 text-white px-6 py-2 rounded-full font-bold hover:bg-green-600 transition-colors"
            >
              Gọi ngay
            </a>
          ) : (
            <button
              onClick={handleCallClick}
              className="bg-green-500 text-white px-6 py-2 rounded-full font-bold hover:bg-green-600 transition-colors"
            >
              Đăng nhập để gọi
            </button>
          )}
        </div>
      </div>
    </>
  )
}

