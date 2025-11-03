import type { Metadata } from 'next'
import './globals.css'
import { createClient } from '@/lib/supabase-server'
import HeaderAuthWrapper from '@/components/HeaderAuthWrapper'
import Logo from '@/components/Logo'

export const metadata: Metadata = {
  title: 'Bán Lẹ - Rao vặt miễn phí',
  description: 'Rao vặt miễn phí – Bán nhanh, mua lẹ!',
}

// Force dynamic rendering because we use cookies for auth
export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session = null
  let userProfile = null

  try {
    const supabase = await createClient()
    const {
      data: { session: authSession },
      error: sessionError,
    } = await supabase.auth.getSession()

    // Handle session errors gracefully
    if (sessionError) {
      console.error('Error getting session:', sessionError)
      // Continue without session - user will see logged-out state
    } else {
      session = authSession
    }

    // Fetch user profile if session exists
    if (session?.user) {
      try {
        const { data, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          // Profile might not exist yet - that's okay
          console.warn('Profile fetch error (may not exist yet):', profileError.message)
        } else if (data) {
          userProfile = data
        }
      } catch (profileErr) {
        console.error('Unexpected error fetching profile:', profileErr)
        // Continue without profile - user will see logged-out state
      }
    }
  } catch (error) {
    // Handle Supabase client creation errors (e.g., missing env vars)
    console.error('Error initializing Supabase client:', error)
    // Continue rendering - page will work but auth features won't
  }

  return (
    <html lang="vi">
      <body className="font-['Inter','SF Pro Display','-apple-system','BlinkMacSystemFont','Segoe UI',Roboto,sans-serif] antialiased">
        <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center h-[104px] gap-4">
              <Logo />
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Client-side auth wrapper - handles real-time auth state updates */}
                <HeaderAuthWrapper 
                  initialUser={userProfile} 
                  initialSession={!!session} 
                />
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

