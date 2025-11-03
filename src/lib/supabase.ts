import { createClient } from '@supabase/supabase-js'

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we're in a build context (Vercel build) where env vars might not be set yet
// During build, we'll create a client with placeholder values to prevent immediate errors
// The actual validation will happen at runtime when the client is used
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || !supabaseUrl || !supabaseAnonKey

/**
 * Supabase client for database, storage, and auth operations
 * Uses anonymous key - never expose service role key in client-side code
 * 
 * During build time, creates a client with placeholder values to allow static generation
 * Actual validation happens at runtime when methods are called
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true, // Enable session persistence for auth pages
    },
  }
)

// Warn during build if env vars are missing (but don't throw to allow build to complete)
if (isBuildTime && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    '⚠️  Missing Supabase environment variables during build. ' +
    'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel environment variables.'
  )
}

