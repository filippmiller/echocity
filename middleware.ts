import { NextRequest, NextResponse } from 'next/server'
import { consumeRateLimit, type RateLimitRule } from '@/lib/rate-limit'

const READ_RULE: RateLimitRule = {
  key: 'api:read',
  limit: 600,
  windowMs: 60_000,
}

const MUTATION_RULE: RateLimitRule = {
  key: 'api:mutation',
  limit: 180,
  windowMs: 60_000,
}

const AUTH_LOGIN_RULE: RateLimitRule = {
  key: 'api:auth:login',
  limit: 100,
  windowMs: 5 * 60_000,
}

const AUTH_REGISTER_RULE: RateLimitRule = {
  key: 'api:auth:register',
  limit: 30,
  windowMs: 10 * 60_000,
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  return 'local'
}

function getRule(request: NextRequest): RateLimitRule {
  const { pathname } = request.nextUrl

  if (pathname === '/api/auth/login') {
    return AUTH_LOGIN_RULE
  }

  if (pathname === '/api/auth/register') {
    return AUTH_REGISTER_RULE
  }

  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return READ_RULE
  }

  return MUTATION_RULE
}

function attachHeaders(response: NextResponse, result: ReturnType<typeof consumeRateLimit>) {
  response.headers.set('X-RateLimit-Limit', String(result.limit))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.floor(result.resetAt / 1000)))
  response.headers.set('Retry-After', String(result.retryAfterSeconds))
  return response
}

export function middleware(request: NextRequest) {
  const rule = getRule(request)
  const actorId = getClientIp(request)
  const result = consumeRateLimit(rule, actorId)

  if (!result.allowed) {
    const response = NextResponse.json(
      {
        error: 'Too many requests',
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status: 429 },
    )
    return attachHeaders(response, result)
  }

  return attachHeaders(NextResponse.next(), result)
}

export const config = {
  matcher: ['/api/:path*'],
}
