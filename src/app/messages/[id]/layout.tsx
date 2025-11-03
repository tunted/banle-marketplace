// Route segment config to mark this dynamic route as force-dynamic
// This prevents Next.js from trying to statically generate paths
// which causes issues with Supabase client-side code
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

