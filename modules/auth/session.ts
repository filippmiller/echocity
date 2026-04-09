import { cookies } from 'next/headers'
import crypto from 'crypto'
import type { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const SESSION_COOKIE_NAME = 'cityecho_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE * 1000

// Session secret — MUST be set in production
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET environment variable is required in production')
}
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-in-production'

// In-memory session cache — avoids DB lookup on every request
const SESSION_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
type CachedSession = { data: SessionData | null; expiresAt: number }

declare global {
  // eslint-disable-next-line no-var
  var __sessionCache: Map<string, CachedSession> | undefined
}
const sessionCache = globalThis.__sessionCache ?? new Map<string, CachedSession>()
globalThis.__sessionCache = sessionCache

let sessionCachePruneCounter = 0
function pruneSessionCache(now: number) {
  sessionCachePruneCounter++
  if (sessionCachePruneCounter % 50 !== 0) return
  for (const [key, entry] of sessionCache.entries()) {
    if (entry.expiresAt <= now) sessionCache.delete(key)
  }
}

export interface SessionData {
  userId: string
  email: string
  role: Role
}

interface SessionPayload extends SessionData {
  exp: number
  iat: number
}

/**
 * Create HMAC signature for session payload
 */
function sign(payload: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
}

/**
 * Verify HMAC signature and return parsed data
 */
function verifyAndParse(cookieValue: string): SessionPayload | null {
  const dotIndex = cookieValue.lastIndexOf('.')
  if (dotIndex === -1) return null

  const payload = cookieValue.slice(0, dotIndex)
  const signature = cookieValue.slice(dotIndex + 1)

  const expectedSignature = sign(payload)
  const sigBuf = Buffer.from(signature, 'hex')
  const expectedBuf = Buffer.from(expectedSignature, 'hex')
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null // tampered
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as SessionPayload
  } catch {
    return null
  }
}

/**
 * Create session cookie (HMAC-signed)
 */
export async function createSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies()

  const now = Date.now()
  const payloadData: SessionPayload = {
    ...data,
    iat: now,
    exp: now + SESSION_MAX_AGE_MS,
  }

  const payload = Buffer.from(JSON.stringify(payloadData)).toString('base64url')
  const signature = sign(payload)
  const sessionValue = `${payload}.${signature}`

  cookieStore.set(SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

/**
 * Get current session (verified)
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie?.value) {
    return null
  }

  const parsed = verifyAndParse(sessionCookie.value)
  if (!parsed) {
    return null
  }

  const now = Date.now()

  if (parsed.exp <= now) {
    await deleteSession()
    return null
  }

  // Check session cache before hitting DB
  pruneSessionCache(now)
  const cached = sessionCache.get(parsed.userId)
  if (cached && cached.expiresAt > now) {
    return cached.data
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  })

  if (!user || !user.isActive) {
    sessionCache.set(parsed.userId, { data: null, expiresAt: now + SESSION_CACHE_TTL_MS })
    await deleteSession()
    return null
  }

  const sessionData: SessionData = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }
  sessionCache.set(parsed.userId, { data: sessionData, expiresAt: now + SESSION_CACHE_TTL_MS })
  return sessionData
}

/**
 * Delete session (logout)
 */
export async function deleteSession(userId?: string): Promise<void> {
  if (userId) sessionCache.delete(userId)
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
