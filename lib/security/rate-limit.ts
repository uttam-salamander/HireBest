import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter
// In production, use Redis or similar for distributed rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
}

export function getRateLimitKey(request: NextRequest, token?: string): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  // Combine IP and token for more granular limiting
  return token ? `${ip}:${token}` : ip
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  // Clean up old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < now) {
        rateLimitMap.delete(k)
      }
    }
  }

  if (!record || record.resetTime < now) {
    // New window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    }
  }

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    }
  }

  record.count++
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetIn: record.resetTime - now,
  }
}

export function rateLimitResponse(resetIn: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(resetIn / 1000)),
        'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000 + resetIn / 1000)),
      },
    }
  )
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  assessmentStart: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 starts per minute
  assessmentChat: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 messages per minute
  assessmentComplete: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 completes per minute
  assessmentFetch: { windowMs: 60 * 1000, maxRequests: 120 }, // 120 fetches per minute
}
