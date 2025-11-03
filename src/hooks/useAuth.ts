'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export interface AuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
}

export interface AuthMethods {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, metadata?: { full_name?: string; phone?: string }) => Promise<{ error: Error | null; requiresEmailConfirmation?: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

/**
 * Custom hook for authentication state and methods
 * 
 * Features:
 * - Persistent session on page refresh
 * - Real-time auth state updates via Supabase listener
 * - Automatic profile fetching when user logs in
 * - No flickering or blank screens (handles hydration gracefully)
 * - TypeScript strict compliance
 */
export function useAuth(): AuthState & AuthMethods {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    initialized: false,
  })

  /**
   * Fetch user profile from user_profiles table
   */
  const fetchProfile = useCallback(async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .eq('id', userId)
        .single()

      if (error) {
        // Profile might not exist yet - that's okay
        console.warn('[useAuth] Profile not found:', error.message)
        setState((prev) => ({ ...prev, profile: null }))
        return
      }

      if (data) {
        setState((prev) => ({ ...prev, profile: data }))
      }
    } catch (err) {
      console.error('[useAuth] Error fetching profile:', err)
      setState((prev) => ({ ...prev, profile: null }))
    }
  }, [])

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[useAuth] Error getting session:', error)
          if (mounted) {
            setState({
              user: null,
              session: null,
              profile: null,
              loading: false,
              initialized: true,
            })
          }
          return
        }

        if (mounted) {
          setState({
            user: session?.user ?? null,
            session: session ?? null,
            profile: null,
            loading: false,
            initialized: true,
          })

          // Fetch profile if user exists
          if (session?.user) {
            await fetchProfile(session.user.id)
          }
        }
      } catch (err) {
        console.error('[useAuth] Error initializing auth:', err)
        if (mounted) {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            initialized: true,
          })
        }
      }
    }

    initAuth()

    // Listen for auth state changes (login, logout, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      setState((prev) => ({
        ...prev,
        user: session?.user ?? null,
        session: session ?? null,
        profile: prev.profile, // Keep existing profile during transition
      }))

      // Fetch profile when user logs in
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        // Clear profile on logout
        setState((prev) => ({ ...prev, profile: null }))
      }

      // Handle specific auth events
      if (event === 'SIGNED_IN') {
        // User successfully signed in - refresh router to update server components
        router.refresh()
      } else if (event === 'SIGNED_OUT') {
        // User signed out - refresh router
        router.refresh()
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refreshed - ensure profile is still available
        if (session?.user && !state.profile) {
          await fetchProfile(session.user.id)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, router])

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      setState((prev) => ({ ...prev, loading: true }))
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setState((prev) => ({ ...prev, loading: false }))
        return { error: new Error(error.message) }
      }

      if (data?.user && data?.session) {
        // Profile will be fetched automatically by auth state change listener
        setState((prev) => ({ ...prev, loading: false }))
        router.refresh()
        return { error: null }
      }

      setState((prev) => ({ ...prev, loading: false }))
      return { error: new Error('Sign in failed - no session received') }
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false }))
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      return { error }
    }
  }, [router])

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: { full_name?: string; phone?: string }
    ): Promise<{ error: Error | null; requiresEmailConfirmation?: boolean }> => {
      try {
        setState((prev) => ({ ...prev, loading: true }))

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: metadata?.full_name || null,
              phone: metadata?.phone || null,
            },
            emailRedirectTo: `${window.location.origin}/login?success=email_verified`,
          },
        })

        if (error) {
          setState((prev) => ({ ...prev, loading: false }))
          return { error: new Error(error.message) }
        }

        // Create user profile if user was created
        if (data?.user) {
          try {
            const { error: profileError } = await supabase.from('user_profiles').insert({
              id: data.user.id,
              full_name: metadata?.full_name || null,
              phone: metadata?.phone || null,
              avatar_url: null,
            })

            if (profileError) {
              console.warn('[useAuth] Error creating profile:', profileError)
              // Continue anyway - profile can be created later
            }
          } catch (profileErr) {
            console.error('[useAuth] Error creating profile:', profileErr)
            // Continue anyway
          }

          setState((prev) => ({ ...prev, loading: false }))

          // Check if email confirmation is required
          // If user has a session immediately, email confirmation is disabled
          // Otherwise, it's required
          const requiresEmailConfirmation = !data.session

          return {
            error: null,
            requiresEmailConfirmation,
          }
        }

        setState((prev) => ({ ...prev, loading: false }))
        return { error: new Error('Sign up failed - no user created') }
      } catch (err) {
        setState((prev) => ({ ...prev, loading: false }))
        const error = err instanceof Error ? err : new Error('Unknown error occurred')
        return { error }
      }
    },
    []
  )

  /**
   * Sign out current user
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, loading: true }))
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('[useAuth] Error signing out:', error)
      }

      // State will be updated by auth state change listener
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('[useAuth] Error signing out:', err)
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }, [router])

  /**
   * Manually refresh user profile
   */
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (state.user) {
      await fetchProfile(state.user.id)
    }
  }, [state.user, fetchProfile])

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }
}

