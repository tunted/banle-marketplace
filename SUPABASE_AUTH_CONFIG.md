# Supabase Authentication Configuration Guide

This document provides recommended Supabase Auth settings for the "Bán Lẹ" classifieds application during MVP and production phases.

## Dashboard Configuration

### 1. Authentication Settings

**Location:** Supabase Dashboard → Authentication → Settings

#### Email Settings

- **Enable Email Signups:** ✅ Enabled
- **Enable Email Confirmations:** 
  - **MVP Stage (Recommended):** ❌ Disabled
    - Allows immediate sign-up without email verification
    - Faster user onboarding for testing and early adoption
    - Users can start using the app immediately
    - **Note:** Enable email confirmation for production
  
  - **Production Stage:** ✅ Enabled
    - Verifies email ownership
    - Reduces spam accounts
    - Better security and user trust

- **Enable Email Change Confirmations:** ✅ Enabled (Production)

#### Password Settings

- **Minimum Password Length:** 6 characters (default)
- **Password Complexity:** 
  - **MVP:** Basic (meet minimum length)
  - **Production:** Consider enabling complexity requirements

#### Session Settings

- **JWT Expiry:** 3600 seconds (1 hour) - Default
- **Refresh Token Rotation:** ✅ Enabled (Recommended for security)
- **Refresh Token Reuse Detection:** ✅ Enabled (Prevents token replay attacks)

### 2. Redirect URLs Configuration

**Location:** Supabase Dashboard → Authentication → URL Configuration

#### Allowed Redirect URLs

Add these URLs to allow authentication callbacks:

**Local Development:**
```
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/login?success=email_verified
http://localhost:3000/auth/callback
```

**Production (Replace with your domain):**
```
https://yourdomain.com
https://yourdomain.com/login
https://yourdomain.com/login?success=email_verified
https://yourdomain.com/auth/callback
```

#### Site URL

- **Local:** `http://localhost:3000`
- **Production:** `https://yourdomain.com`

**Important:** The Site URL is used as the default redirect URL for email confirmations and password resets.

### 3. Email Templates

**Location:** Supabase Dashboard → Authentication → Email Templates

#### Customize Templates (Optional for MVP)

You can customize email templates for:
- **Confirm signup** - Email verification link
- **Reset password** - Password reset link
- **Magic link** - If using magic link authentication
- **Change email address** - Email change confirmation

**MVP Recommendation:** Use default templates initially. Customize after MVP validation.

### 4. Providers Configuration

**Location:** Supabase Dashboard → Authentication → Providers

#### Email Provider (Default)

- **Enable Email Provider:** ✅ Enabled
- **Confirm Email:** 
  - MVP: ❌ Disabled (for faster onboarding)
  - Production: ✅ Enabled

#### OAuth Providers (Optional - Add Later)

For future implementation:
- Google OAuth
- Facebook OAuth
- GitHub OAuth

**MVP Recommendation:** Start with email/password only. Add OAuth providers after MVP.

## Environment Variables

### Required Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### Where to Find These Values

1. Go to Supabase Dashboard → Project Settings → API
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Security Notes

- ✅ **USE:** `anon` or `public` key in frontend code
- ❌ **NEVER:** Expose `service_role` key in frontend code
- ❌ **NEVER:** Commit `.env.local` to Git (already in `.gitignore`)

## Recommended Settings by Stage

### MVP / Early Stage

```yaml
Email Confirmations: Disabled
Password Complexity: Basic (6+ chars)
Session Duration: 1 hour
Refresh Token Rotation: Enabled
Redirect URLs: Local + Production domains
Site URL: Production domain (or localhost for dev)
```

**Benefits:**
- Faster user onboarding
- Lower friction for sign-ups
- Easier testing and iteration
- Users can use app immediately

### Production Stage

```yaml
Email Confirmations: Enabled
Password Complexity: Standard/Strong
Session Duration: 1 hour (or shorter)
Refresh Token Rotation: Enabled
Refresh Token Reuse Detection: Enabled
Redirect URLs: Production domains only
Site URL: Production domain
```

**Benefits:**
- Better security
- Verified email addresses
- Reduced spam accounts
- Enhanced user trust

## Authentication Flow Configuration

### Sign-Up Flow

1. User fills registration form
2. **If email confirmation disabled:**
   - User is immediately authenticated
   - Can use app right away
   - Profile is created automatically

3. **If email confirmation enabled:**
   - User receives confirmation email
   - Must click link to verify email
   - Then can log in and use app

### Sign-In Flow

1. User enters email/password
2. Supabase validates credentials
3. Session is created and stored (cookies/localStorage)
4. User is redirected to homepage
5. Header UI updates automatically via `useAuth` hook

### Session Persistence

- Sessions persist across page refreshes
- Sessions persist across browser tabs
- Sessions expire after JWT expiry time
- Refresh tokens automatically renew sessions

## Testing Checklist

- [ ] Sign-up creates user account
- [ ] Sign-in authenticates user
- [ ] Sign-out clears session
- [ ] Session persists on page refresh
- [ ] Session persists in new tab
- [ ] Email confirmation link works (if enabled)
- [ ] Password reset email sends
- [ ] Password reset link works
- [ ] Redirect URLs work correctly
- [ ] Header UI updates immediately after login
- [ ] Header shows only "Đăng tin" when logged out
- [ ] Header shows all icons when logged in

## Troubleshooting

### Common Issues

1. **"Invalid redirect URL"**
   - Check that your redirect URLs are added in Supabase Dashboard
   - Verify the URL matches exactly (including trailing slashes)

2. **"Email confirmation not working"**
   - Check that email confirmation is enabled in settings
   - Verify email template is configured
   - Check spam folder

3. **"Session not persisting"**
   - Check that cookies are enabled in browser
   - Verify `persistSession: true` in Supabase client config
   - Check browser console for errors

4. **"Header not updating after login"**
   - Verify `useAuth` hook is used in header components
   - Check that `onAuthStateChange` listener is active
   - Ensure router.refresh() is called after sign-in

## Migration from MVP to Production

When ready to enable email confirmations:

1. **Supabase Dashboard:**
   - Enable "Confirm email" in Authentication → Settings

2. **Update Redirect URLs:**
   - Ensure production URLs are configured
   - Test email confirmation flow

3. **Update User Communication:**
   - Inform existing users about email verification
   - Add helpful UI messages explaining verification process

4. **Monitor:**
   - Check authentication logs
   - Monitor sign-up conversion rates
   - Gather user feedback

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js + Supabase Auth Guide](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Supabase Auth Best Practices](https://supabase.com/docs/guides/auth/auth-deep-dive/auth-deep-dive-jwts)

---

**Last Updated:** Based on current implementation (Next.js App Router + Supabase v2)

