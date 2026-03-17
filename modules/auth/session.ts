import { cookies } from 'next/headers'
import crypto from 'crypto'
import type { Role } from '@prisma/client'

const SESSION_COOKIE_NAME = 'cityecho_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// Session secret — MUST be set in production
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET environment variable is required in production')
}
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-in-production'

export interface SessionData {
  userId: string
  email: string
  role: Role
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
function verifyAndParse(cookieValue: string): SessionData | null {
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
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as SessionData
  } catch {
    return null
  }
}

/**
 * Create session cookie (HMAC-signed)
 */
export async function createSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies()

  const payload = Buffer.from(JSON.stringify(data)).toString('base64url')
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

  return verifyAndParse(sessionCookie.value)
}

/**
 * Delete session (logout)
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
