/**
 * Client-side rate limiting utility (MVP approach)
 * In production, implement server-side rate limiting with Redis or similar
 * 
 * This uses localStorage to track post attempts per IP (simulated)
 * For real production, use:
 * - Server-side API route with rate limiting middleware
 * - Redis for distributed rate limiting
 * - IP-based or user-based rate limiting
 */

const RATE_LIMIT_KEY = 'banle_rate_limit'
const MAX_POSTS_PER_HOUR = 3
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

interface RateLimitEntry {
  timestamp: number
  count: number
}

/**
 * Check if user has exceeded rate limit
 */
export function checkRateLimit(): { allowed: boolean; remainingTime?: number } {
  if (typeof window === 'undefined') {
    // Server-side: always allow (server should handle rate limiting)
    return { allowed: true }
  }

  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    
    if (!stored) {
      // First post, initialize
      const entry: RateLimitEntry = {
        timestamp: Date.now(),
        count: 0,
      }
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entry))
      return { allowed: true }
    }

    const entry: RateLimitEntry = JSON.parse(stored)
    const now = Date.now()
    const timeSinceFirstPost = now - entry.timestamp

    // If more than 1 hour has passed, reset
    if (timeSinceFirstPost > RATE_LIMIT_WINDOW) {
      const newEntry: RateLimitEntry = {
        timestamp: now,
        count: 0,
      }
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newEntry))
      return { allowed: true }
    }

    // Check if limit exceeded
    if (entry.count >= MAX_POSTS_PER_HOUR) {
      const remainingTime = RATE_LIMIT_WINDOW - timeSinceFirstPost
      return { allowed: false, remainingTime }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // On error, allow (fail open for better UX)
    return { allowed: true }
  }
}

/**
 * Record a post attempt
 */
export function recordPostAttempt(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    
    if (!stored) {
      const entry: RateLimitEntry = {
        timestamp: Date.now(),
        count: 1,
      }
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entry))
      return
    }

    const entry: RateLimitEntry = JSON.parse(stored)
    const now = Date.now()
    const timeSinceFirstPost = now - entry.timestamp

    // If more than 1 hour has passed, reset
    if (timeSinceFirstPost > RATE_LIMIT_WINDOW) {
      const newEntry: RateLimitEntry = {
        timestamp: now,
        count: 1,
      }
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newEntry))
    } else {
      // Increment count
      entry.count += 1
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entry))
    }
  } catch (error) {
    console.error('Rate limit record error:', error)
  }
}

/**
 * Get remaining time in minutes
 */
export function getRemainingTimeMinutes(remainingTime: number): number {
  return Math.ceil(remainingTime / (60 * 1000))
}

