import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import UserMenu from '@/components/UserMenu'
import HeaderIcons from '@/components/HeaderIcons'
import Logo from '@/components/Logo'

export const metadata: Metadata = {
  title: 'Bán Lẹ - Rao vặt miễn phí',
  description: 'Rao vặt miễn phí – Bán nhanh, mua lẹ!',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  let userProfile = null
  if (session?.user) {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url')
      .eq('id', session.user.id)
      .single()
    
    if (data) {
      userProfile = data
    }
  }

  return (
    <html lang="vi">
      <body className="font-['Inter','SF Pro Display','-apple-system','BlinkMacSystemFont','Segoe UI',Roboto,sans-serif] antialiased">
        <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center h-[104px] gap-4">
              <Logo />
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Always render HeaderIcons for debugging - will check login internally */}
                <HeaderIcons user={userProfile} isLoggedIn={!!session} />
                <Link
                  href="/post"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform whitespace-nowrap text-sm sm:text-base"
                  style={{ 
                    boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.39)',
                  }}
                >
                  + Đăng tin
                </Link>
                <UserMenu user={userProfile} initialSession={!!session} />
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
}

