# Authentication Implementation Guide

This guide documents the complete authentication system implementation for the "Bán Lẹ" classifieds application.

## Overview

The authentication system provides:
- ✅ Persistent session management (survives page refresh, new tabs)
- ✅ Real-time auth state updates via Supabase listeners
- ✅ Automatic profile fetching on login
- ✅ Seamless UI updates without flickering
- ✅ TypeScript strict compliance
- ✅ Graceful error handling

## Architecture

### Core Components

1. **`useAuth` Hook** (`src/hooks/useAuth.ts`)
   - Centralized authentication state management
   - Provides `signIn`, `signUp`, `signOut` methods
   - Handles session persistence and profile fetching
   - Listens to auth state changes in real-time

2. **Header Components**
   - `HeaderIcons` - Shows chat, saved posts, notifications, my posts (only when logged in)
   - `UserMenu` - Shows user avatar/profile dropdown (or login/register when logged out)
   - Header layout - Shows "Đăng tin" button (always visible, redirects to login if not authenticated)

3. **Auth Pages**
   - `/login` - Sign-in page using `useAuth.signIn()`
   - `/register` - Sign-up page using `useAuth.signUp()`
   - `/reset-password` - Password reset page

## Header UI Behavior

### When User is NOT Logged In:
```
[Logo]                          [Đăng tin] [User Icon → Login/Register]
```

- ✅ **"Đăng tin" button** - Visible, redirects to `/login`
- ❌ **HeaderIcons** - Hidden (returns `null`)
- ✅ **UserMenu** - Shows login/register options

### When User IS Logged In:
```
[Logo]  [Chat] [Saved] [Notifications] [My Posts] [Đăng tin] [User Avatar → Profile Menu]
```

- ✅ **HeaderIcons** - All icons visible (chat, saved posts, notifications, my posts)
- ✅ **"Đăng tin" button** - Visible, links to `/post`
- ✅ **UserMenu** - Shows user profile dropdown with logout

## Key Features

### 1. Session Persistence

**How it works:**
- Supabase stores session in cookies/localStorage
- `useAuth` hook fetches session on mount
- Session persists across:
  - Page refreshes
  - Browser tabs
  - Navigation
  - Browser restarts (until token expires)

**Implementation:**
```typescript
// useAuth hook automatically handles this
useEffect(() => {
  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  
  // Session is automatically persisted by Supabase client
  // No manual storage needed
}, [])
```

### 2. Real-Time Auth State Updates

**How it works:**
- `onAuthStateChange` listener in `useAuth` hook
- Automatically updates when:
  - User signs in
  - User signs out
  - Token is refreshed
  - Session expires

**Implementation:**
```typescript
supabase.auth.onAuthStateChange(async (event, session) => {
  // State is automatically updated
  // Components using useAuth hook will re-render
  // No manual state synchronization needed
})
```

### 3. Profile Fetching

**How it works:**
- When user logs in, `useAuth` automatically fetches profile from `user_profiles` table
- Profile data is cached in hook state
- Profile is cleared on logout

**Implementation:**
```typescript
// Automatically called when user logs in
const fetchProfile = async (userId: string) => {
  const { data } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url')
    .eq('id', userId)
    .single()
  
  setState(prev => ({ ...prev, profile: data }))
}
```

### 4. No Flickering or Blank Screens

**How it works:**
- `initialized` flag in `useAuth` hook
- Header components show loading state until auth is initialized
- Prevents SSR/CSR mismatch issues

**Implementation:**
```typescript
// In HeaderIcons component
if (!mounted) {
  return <LoadingPlaceholder />
}

if (!isLoggedIn) {
  return null // Hide icons when logged out
}
```

### 5. Automatic Redirects

**How it works:**
- Login page redirects to `/` if user is already logged in
- Register page redirects to `/` if user is already logged in
- After successful login, user is redirected to homepage

**Implementation:**
```typescript
// In login/register pages
useEffect(() => {
  if (user) {
    router.push('/')
  }
}, [user, router])
```

## Usage Examples

### Using `useAuth` Hook

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, profile, loading, signIn, signOut } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please log in</div>
  }

  return (
    <div>
      <p>Welcome, {profile?.full_name || user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Sign In Flow

```typescript
const { signIn } = useAuth()

const handleLogin = async () => {
  const { error } = await signIn(email, password)
  
  if (error) {
    console.error('Login failed:', error.message)
    return
  }
  
  // Success - user is automatically logged in
  // Header will update automatically
  router.push('/')
}
```

### Sign Up Flow

```typescript
const { signUp } = useAuth()

const handleSignUp = async () => {
  const { error, requiresEmailConfirmation } = await signUp(
    email,
    password,
    {
      full_name: fullName,
      phone: phoneNumber,
    }
  )
  
  if (error) {
    console.error('Sign up failed:', error.message)
    return
  }
  
  if (requiresEmailConfirmation) {
    // Show email confirmation modal
    setShowEmailModal(true)
  } else {
    // User is immediately authenticated
    router.push('/')
  }
}
```

## File Structure

```
src/
├── hooks/
│   └── useAuth.ts              # Main auth hook
├── components/
│   ├── HeaderIcons.tsx          # Chat, saved, notifications, my posts icons
│   ├── UserMenu.tsx            # User avatar dropdown menu
│   └── Header.tsx              # Client-side header wrapper (optional)
├── app/
│   ├── layout.tsx              # Root layout (server component)
│   ├── login/
│   │   └── page.tsx            # Login page (uses useAuth)
│   ├── register/
│   │   └── page.tsx            # Register page (uses useAuth)
│   └── reset-password/
│       └── page.tsx            # Password reset page
└── lib/
    ├── supabase.ts             # Client Supabase instance
    └── supabase-server.ts      # Server Supabase instance
```

## Common Patterns

### Protecting Routes

```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null // Will redirect
  }

  return <div>Protected Content</div>
}
```

### Conditional Rendering Based on Auth

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user } = useAuth()

  return (
    <div>
      {user ? (
        <div>Logged in content</div>
      ) : (
        <div>Please log in</div>
      )}
    </div>
  )
}
```

## Best Practices

### ✅ DO

- Use `useAuth` hook for all auth-related logic
- Check `initialized` flag before rendering auth-dependent UI
- Handle loading states gracefully
- Use `user` and `profile` from `useAuth` instead of fetching separately
- Redirect logged-in users away from auth pages

### ❌ DON'T

- Don't manually call `supabase.auth.getSession()` in components (use `useAuth`)
- Don't create multiple auth state instances
- Don't skip loading states (causes flickering)
- Don't access auth state before `initialized` is true

## Troubleshooting

### Issue: Header not updating after login

**Solution:**
- Ensure `useAuth` hook is used in header components
- Check that `onAuthStateChange` listener is active
- Verify `router.refresh()` is called after sign-in

### Issue: Session lost on page refresh

**Solution:**
- Check Supabase client config has `persistSession: true`
- Verify cookies are enabled in browser
- Check browser console for errors

### Issue: Profile not loading

**Solution:**
- Verify `user_profiles` table exists
- Check RLS policies allow profile reading
- Ensure profile is created during sign-up

### Issue: Flickering on page load

**Solution:**
- Use `initialized` flag from `useAuth`
- Show loading placeholder until `initialized === true`
- Don't render auth-dependent UI until initialized

## Testing Checklist

- [ ] User can sign up
- [ ] User can sign in
- [ ] User can sign out
- [ ] Session persists on page refresh
- [ ] Session persists in new tab
- [ ] Header shows only "Đăng tin" when logged out
- [ ] Header shows all icons when logged in
- [ ] Header updates immediately after login
- [ ] Header updates immediately after logout
- [ ] Profile loads after login
- [ ] Redirects work correctly
- [ ] Email confirmation flow works (if enabled)
- [ ] Password reset flow works

## Migration Notes

### From Old Implementation

If you had previous auth code:

1. **Replace direct Supabase calls:**
   ```typescript
   // OLD
   const { data } = await supabase.auth.signInWithPassword({ email, password })
   
   // NEW
   const { error } = await signIn(email, password)
   ```

2. **Replace session checks:**
   ```typescript
   // OLD
   const { data: { session } } = await supabase.auth.getSession()
   
   // NEW
   const { user } = useAuth()
   ```

3. **Update components:**
   - Use `useAuth` hook instead of local state
   - Remove manual auth listeners (handled by hook)
   - Use `user` and `profile` from hook

## Next Steps

After MVP validation:
- [ ] Enable email confirmation in Supabase
- [ ] Add OAuth providers (Google, Facebook)
- [ ] Implement rate limiting for auth attempts
- [ ] Add 2FA support (if needed)
- [ ] Add account deletion flow
- [ ] Add profile editing flow

---

**Last Updated:** Based on current implementation (Next.js 14 App Router + Supabase v2)

